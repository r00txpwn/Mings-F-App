import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import { pointInGeoJsonPolygon } from '../_shared/geo.ts';

type FulfillmentType = 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'cod';

interface CartLine {
  productId: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
}

interface Body {
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  cart: CartLine[];
  customerName?: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  /** QR/table context (e.g. `?table=` or `?ref=`) — stored on the sale `notes` field for kitchen. */
  tableLabel?: string;
}

function getGroupNameForOption(
  groups: Array<{ id: string; name: string; modifier_options?: Array<{ id: string }> }>,
  optionId: string
): string {
  for (const g of groups) {
    if (g.modifier_options?.some((o) => o.id === optionId)) return g.name;
  }
  return '';
}

Deno.serve(async (req: Request) => {
  try {
    return await handleRequest(req);
  } catch (e) {
    console.error('online-order-create', e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : String(e) },
      500
    );
  }
});

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let customerUserId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token !== anonKey) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && userData?.user?.id) {
        customerUserId = userData.user.id;
      }
    }
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const {
    fulfillmentType,
    paymentMethod = 'cod',
    cart,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    tableLabel,
  } = body;

  if (!Array.isArray(cart) || cart.length === 0) {
    return jsonResponse({ error: 'Cart is empty' }, 400);
  }
  if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length < 5) {
    return jsonResponse({ error: 'Valid phone number required' }, 400);
  }

  const { data: settings } = await supabase.from('online_settings').select('*').limit(1).maybeSingle();
  if (!settings) {
    return jsonResponse({ error: 'Online ordering not configured' }, 503);
  }

  if (fulfillmentType === 'takeaway' && !settings.takeaway_enabled) {
    return jsonResponse({ error: 'Takeaway ordering is disabled' }, 400);
  }
  if (fulfillmentType === 'delivery' && !settings.delivery_enabled) {
    return jsonResponse({ error: 'Delivery is disabled' }, 400);
  }

  if (fulfillmentType === 'delivery') {
    if (deliveryLat == null || deliveryLng == null || Number.isNaN(deliveryLat) || Number.isNaN(deliveryLng)) {
      return jsonResponse({ error: 'Delivery location required' }, 400);
    }
    if (!deliveryAddress?.trim()) {
      return jsonResponse({ error: 'Delivery address required' }, 400);
    }
  }

  const source = fulfillmentType === 'delivery' ? 'online_delivery' : 'online_takeaway';

  const { data: channel } = await supabase.from('sales_channels').select('id').eq('name', 'Online').maybeSingle();
  if (!channel?.id) {
    return jsonResponse({ error: 'Online sales channel missing' }, 500);
  }

  const { data: orderNum, error: rpcErr } = await supabase.rpc('generate_daily_order_number_for_source', {
    order_source: source,
  });
  if (rpcErr || orderNum == null) {
    return jsonResponse({ error: rpcErr?.message ?? 'Order number failed' }, 500);
  }
  const dailyNumber = Number(orderNum);
  const displayNumber = 'O' + String(dailyNumber).padStart(3, '0');
  const trackToken = crypto.randomUUID();

  let deliveryFee = 0;
  let zoneId: string | null = null;

  if (fulfillmentType === 'delivery') {
    const { data: zones } = await supabase.from('delivery_zones').select('*').eq('is_active', true);
    const lng = Number(deliveryLng);
    const lat = Number(deliveryLat);
    let matched: { id: string; delivery_fee: number; min_order_amount: number; polygon: unknown } | null = null;
    for (const z of zones ?? []) {
      const poly = z.polygon as { type?: string; coordinates?: number[][][] };
      if (pointInGeoJsonPolygon(lng, lat, poly)) {
        matched = z as typeof matched;
        break;
      }
    }
    if (!matched) {
      return jsonResponse({ error: 'Address is outside delivery zones' }, 400);
    }
    deliveryFee = Number(matched.delivery_fee ?? 0);
    zoneId = matched.id;
  }

  const productIds = [...new Set(cart.map((l) => l.productId))];
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(
      'id, name, selling_price, online_visible, product_modifier_groups(modifier_groups(id, name, modifier_options(id, name, price_adjustment, is_available)))'
    )
    .in('id', productIds);

  if (prodErr || !products?.length) {
    return jsonResponse({ error: 'Could not load products' }, 400);
  }

  const productMap = new Map(products.map((p) => [p.id as string, p]));

  let subtotal = 0;
  const resolvedLines: Array<{
    product: Record<string, unknown>;
    quantity: number;
    notes: string;
    unitPrice: number;
    modifierRows: Array<{
      groupName: string;
      optionId: string;
      optionName: string;
      priceAdjustment: number;
    }>;
  }> = [];

  for (const line of cart) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));
    const p = productMap.get(line.productId);
    if (!p || p.online_visible === false) {
      return jsonResponse({ error: `Invalid product: ${line.productId}` }, 400);
    }
    const base = Number((p as { selling_price: number }).selling_price);
    const pmgs = (p as { product_modifier_groups?: unknown[] }).product_modifier_groups ?? [];
    const groups = pmgs
      .map((x: { modifier_groups: Record<string, unknown> }) => x.modifier_groups)
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      modifier_options?: Array<{
        id: string;
        name: string;
        price_adjustment: number;
        is_available: boolean;
      }>;
    }>;

    const optionIds = line.modifierOptionIds ?? [];
    const allOptions = groups.flatMap((g) => g.modifier_options ?? []);
    let modAdjust = 0;
    const modifierRows: Array<{
      groupName: string;
      optionId: string;
      optionName: string;
      priceAdjustment: number;
    }> = [];

    for (const oid of optionIds) {
      const opt = allOptions.find((o) => o.id === oid);
      if (!opt || opt.is_available === false) {
        return jsonResponse({ error: `Invalid modifier option: ${oid}` }, 400);
      }
      modAdjust += Number(opt.price_adjustment ?? 0);
      modifierRows.push({
        groupName: getGroupNameForOption(groups, oid),
        optionId: oid,
        optionName: opt.name,
        priceAdjustment: Number(opt.price_adjustment ?? 0),
      });
    }

    const unitPrice = base + modAdjust;
    subtotal += unitPrice * qty;

    const modSummary = modifierRows.map((m) => m.optionName).join(', ');
    const noteParts = [line.notes, modSummary].filter(Boolean).join(' | ');

    resolvedLines.push({
      product: p,
      quantity: qty,
      notes: noteParts,
      unitPrice,
      modifierRows,
    });
  }

  const total = subtotal + deliveryFee;
  const minOrder = Number(settings.min_order_amount ?? 0);
  if (total < minOrder) {
    return jsonResponse({ error: `Minimum order is ₼${minOrder.toFixed(2)}` }, 400);
  }

  if (fulfillmentType === 'delivery' && zoneId) {
    const { data: zrow } = await supabase.from('delivery_zones').select('min_order_amount').eq('id', zoneId).maybeSingle();
    const zmin = Number((zrow as { min_order_amount?: number } | null)?.min_order_amount ?? 0);
    if (subtotal < zmin) {
      return jsonResponse({ error: `Minimum subtotal for this zone is ₼${zmin.toFixed(2)}` }, 400);
    }
  }

  const paymentStatus = 'unpaid';

  const itemCount = resolvedLines.reduce((s, l) => s + l.quantity, 0);

  const { data: saleRow, error: saleErr } = await supabase
    .from('sales')
    .insert({
      source,
      order_status: 'pending',
      payment_status: paymentStatus,
      sales_channel_id: channel.id,
      total_price: total,
      quantity: itemCount,
      unit_price: itemCount > 0 ? total / itemCount : total,
      daily_order_number: dailyNumber,
      display_number: displayNumber,
      track_token: trackToken,
      sale_date: new Date().toISOString(),
      notes: tableLabel?.trim() ? `Table/ref: ${tableLabel.trim()}` : '',
      customer_name: customerName?.trim() || null,
      customer_phone: customerPhone.trim(),
      delivery_address: fulfillmentType === 'delivery' ? deliveryAddress?.trim() ?? null : null,
      delivery_lat: fulfillmentType === 'delivery' ? deliveryLat ?? null : null,
      delivery_lng: fulfillmentType === 'delivery' ? deliveryLng ?? null : null,
      delivery_fee: deliveryFee,
      delivery_zone_id: zoneId,
      customer_user_id: customerUserId,
    })
    .select('id')
    .single();

  if (saleErr || !saleRow) {
    return jsonResponse({ error: saleErr?.message ?? 'Failed to create sale' }, 500);
  }

  const saleId = saleRow.id as string;

  for (const line of resolvedLines) {
    const p = line.product as { id: string; name: string };
    const { data: saleItem, error: siErr } = await supabase
      .from('sale_items')
      .insert({
        sale_id: saleId,
        product_id: p.id,
        product_name: p.name,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        total_price: line.unitPrice * line.quantity,
        notes: line.notes || null,
      })
      .select('id')
      .single();

    if (siErr || !saleItem) {
      await supabase.from('sales').delete().eq('id', saleId);
      return jsonResponse({ error: siErr?.message ?? 'Failed to create line item' }, 500);
    }

    if (line.modifierRows.length > 0) {
      const rows = line.modifierRows.map((m) => ({
        sale_item_id: saleItem.id,
        modifier_group_name: m.groupName,
        modifier_option_name: m.optionName,
        price_adjustment: m.priceAdjustment,
      }));
      const { error: modErr } = await supabase.from('sale_item_modifiers').insert(rows);
      if (modErr) {
        await supabase.from('sales').delete().eq('id', saleId);
        return jsonResponse({ error: modErr.message }, 500);
      }
    }
  }

  if (fulfillmentType === 'delivery') {
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/wolt-drive-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ saleId }),
      }).catch(() => {})
    );
  }

  return jsonResponse({
    saleId,
    trackToken,
    displayNumber,
    total,
    deliveryFee,
    paymentMethod,
    nextStep: 'track',
  });
}
