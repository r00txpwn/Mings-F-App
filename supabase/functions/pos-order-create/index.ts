import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import { pointInGeoJsonPolygon } from '../_shared/geo.ts';
import { CANONICAL_POS_SALES_CHANNEL_ID } from '../_shared/salesChannelPolicy.ts';
import { requireStaffAuth } from '../_shared/staffAuth.ts';

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type FulfillmentType = 'eat_in' | 'takeaway' | 'delivery';

interface CartLine {
  productId?: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
}

interface Body {
  fulfillmentType: FulfillmentType;
  cart: CartLine[];
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  orderNotes?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryApartment?: string;
  deliveryFloor?: string;
  deliveryNotes?: string;
}

const EXCLUSIVE_MODIFIER_GROUP_NAME =
  /(?:^|[\s,])(?:spice|spicy|spiciness|acılı|остр(?:ота|оты)?|is[ıi]dl[ıi]|chili\s*level|heat\s*level|dərəc[əe]|s[əe]viyy[əe])(?:$|[\s,])/iu;

function effectiveMaxSelectForValidation(g: { name: string; max_select?: number }): number {
  let maxSel = Number(g.max_select);
  if (!Number.isFinite(maxSel) || maxSel < 1) maxSel = 1;
  maxSel = Math.floor(maxSel);
  if (maxSel > 1 && EXCLUSIVE_MODIFIER_GROUP_NAME.test(String(g.name ?? ''))) {
    return 1;
  }
  return maxSel;
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

function normalizePhoneE164(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const s = trimmed.replace(/[\s()-]/g, '');
  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }
  const digits = s.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function isLikelyE164(phone: string): boolean {
  return /^\+[1-9]\d{8,14}$/.test(phone);
}

function fulfillmentToSource(ft: FulfillmentType): string {
  if (ft === 'eat_in') return 'pos_eat_in';
  if (ft === 'takeaway') return 'pos_takeaway';
  return 'pos_delivery';
}

function isPoolExhaustedRpcError(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  return message.includes('DIRECT_NUMBER_POOL_EXHAUSTED');
}

function isActiveDisplayNumberUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error == null) return false;
  const e = error as { code?: string; message?: string };
  if (e.code === '23505') return true;
  return (e.message ?? '').includes('ux_sales_active_direct_display_number');
}

async function allocateDirectDisplayNumber(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc('allocate_direct_display_number');
  if (error || !data) {
    if (isPoolExhaustedRpcError(error)) {
      return { ok: false as const, status: 503, code: 'ORDER_NUMBER_POOL_EXHAUSTED', message: 'Order number pool exhausted' };
    }
    return { ok: false as const, status: 500, code: 'ORDER_NUMBER_FAILED', message: error?.message ?? 'Order number failed' };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { daily_order_number?: number; display_number?: string };
  const daily = Number(row.daily_order_number);
  const display = String(row.display_number ?? '');
  if (!Number.isFinite(daily) || daily < 1 || !/^M\d{3}$/.test(display)) {
    return { ok: false as const, status: 500, code: 'ORDER_NUMBER_INVALID', message: 'Invalid allocated number' };
  }
  return { ok: true as const, value: { daily_order_number: daily, display_number: display } };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return corsPreflightResponse();
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const auth = await requireStaffAuth(req);
    if (auth instanceof Response) return auth;

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const {
      fulfillmentType,
      cart,
      paymentMethod,
      customerName,
      customerPhone,
      orderNotes,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      deliveryApartment,
      deliveryFloor,
      deliveryNotes,
    } = body;

    // POS orders are created unpaid; cash is only counted toward the drawer
    // once staff confirms "mark paid". We still record the chosen method so
    // reconciliation knows it was a cash sale.
    const normalizedPaymentMethod =
      String(paymentMethod ?? 'cash').trim().toLowerCase() === 'card' ? 'card' : 'cash';

    if (!fulfillmentType || !['eat_in', 'takeaway', 'delivery'].includes(fulfillmentType)) {
      return jsonResponse({ error: 'Invalid fulfillment type' }, 400);
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return jsonResponse({ error: 'Cart is empty' }, 400);
    }

    let normalizedPhone: string | null = null;
    if (customerPhone?.trim()) {
      normalizedPhone = normalizePhoneE164(customerPhone);
      if (!isLikelyE164(normalizedPhone)) {
        return jsonResponse({ error: 'Invalid phone (E.164)' }, 400);
      }
    }

    if (fulfillmentType === 'delivery') {
      if (deliveryLat == null || deliveryLng == null || Number.isNaN(deliveryLat) || Number.isNaN(deliveryLng)) {
        return jsonResponse({ error: 'Delivery location required' }, 400);
      }
      if (!deliveryAddress?.trim()) {
        return jsonResponse({ error: 'Delivery address required' }, 400);
      }
    }

    const supabase = auth.supabaseAdmin;
    const source = fulfillmentToSource(fulfillmentType);

    let { data: channel } = await supabase
      .from('sales_channels')
      .select('id')
      .eq('id', CANONICAL_POS_SALES_CHANNEL_ID)
      .maybeSingle();
    if (!channel?.id) {
      const { data: byName } = await supabase.from('sales_channels').select('id').eq('name', 'POS').maybeSingle();
      channel = byName;
    }
    if (!channel?.id) {
      const { data: created } = await supabase
        .from('sales_channels')
        .insert({ id: CANONICAL_POS_SALES_CHANNEL_ID, name: 'POS', is_active: true })
        .select('id')
        .single();
      channel = created;
    }
    if (!channel?.id) {
      return jsonResponse({ error: 'POS sales channel missing' }, 500);
    }

    let deliveryFee = 0;
    let zoneId: string | null = null;

    if (fulfillmentType === 'delivery') {
      const { data: zones } = await supabase.from('delivery_zones').select('*').eq('is_active', true);
      const lng = Number(deliveryLng);
      const lat = Number(deliveryLat);
      let matched: { id: string; delivery_fee: number; min_order_amount: number } | null = null;
      for (const z of zones ?? []) {
        const poly = z.polygon as { type?: string; coordinates?: number[][][] };
        if (pointInGeoJsonPolygon(lng, lat, poly)) {
          matched = z as { id: string; delivery_fee: number; min_order_amount: number };
          break;
        }
      }
      if (!matched) {
        return jsonResponse({ error: 'Address is outside delivery zones' }, 400);
      }
      deliveryFee = Number(matched.delivery_fee ?? 0);
      zoneId = matched.id;
    }

    const productIds = [...new Set(cart.map((l) => l.productId).filter(Boolean))] as string[];
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(
        'id, name, selling_price, kiosk_visible, product_modifier_groups(modifier_groups(id, name, min_select, max_select, modifier_options(id, name, price_adjustment, is_available)))'
      )
      .in('id', productIds);

    if (prodErr || !products?.length) {
      return jsonResponse({ error: 'Could not load products' }, 400);
    }

    const productMap = new Map(products.map((p) => [p.id as string, p as Record<string, unknown>]));

    type ResolvedLine = {
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
    };

    const resolvedLines: ResolvedLine[] = [];
    let subtotal = 0;

    for (const line of cart) {
      if (!line.productId) return jsonResponse({ error: 'Invalid cart line' }, 400);
      const p = productMap.get(line.productId);
      if (!p || p.kiosk_visible === false) {
        return jsonResponse({ error: `Invalid product: ${line.productId}` }, 400);
      }

      const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));
      const base = Number((p as { selling_price: number }).selling_price);
      const pmgs = ((p as { product_modifier_groups?: unknown[] }).product_modifier_groups ?? []) as Array<{
        modifier_groups: Record<string, unknown>;
      }>;
      const groups = pmgs.map((x) => x.modifier_groups).filter(Boolean) as Array<{
        id: string;
        name: string;
        min_select?: number;
        max_select?: number;
        modifier_options?: Array<{
          id: string;
          name: string;
          price_adjustment: number;
          is_available: boolean;
        }>;
      }>;

      const optionIds = line.modifierOptionIds ?? [];
      for (const g of groups) {
        const opts = g.modifier_options ?? [];
        const idSet = new Set(opts.map((o) => o.id));
        const minSel = Math.max(0, Math.floor(Number(g.min_select ?? 0)));
        const maxSel = effectiveMaxSelectForValidation(g);
        const minClamped = Math.min(minSel, maxSel);
        const count = optionIds.filter((id) => idSet.has(id)).length;
        if (count > maxSel) return jsonResponse({ error: `Too many modifiers for "${g.name}"` }, 400);
        if (count < minClamped) return jsonResponse({ error: `Not enough modifiers for "${g.name}"` }, 400);
      }

      const allOptions = groups.flatMap((g) => g.modifier_options ?? []);
      let modAdjust = 0;
      const modifierRows: ResolvedLine['modifierRows'] = [];
      for (const oid of optionIds) {
        const opt = allOptions.find((o) => o.id === oid);
        if (!opt || opt.is_available === false) {
          return jsonResponse({ error: `Invalid modifier: ${oid}` }, 400);
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

    if (fulfillmentType === 'delivery' && zoneId) {
      const { data: zrow } = await supabase.from('delivery_zones').select('min_order_amount').eq('id', zoneId).maybeSingle();
      const zmin = Number((zrow as { min_order_amount?: number } | null)?.min_order_amount ?? 0);
      if (subtotal < zmin) {
        return jsonResponse({ error: `Minimum subtotal for zone is ₼${zmin.toFixed(2)}` }, 400);
      }
    }

    const totalWithAdjustments = subtotal + deliveryFee;
    const itemCount = resolvedLines.reduce((s, l) => s + l.quantity, 0);
    const courierNote = fulfillmentType === 'delivery' && deliveryNotes?.trim() ? deliveryNotes.trim() : '';

    const saleInsertBase: Record<string, unknown> = {
      source,
      order_status: 'pending',
      payment_status: 'unpaid',
      sales_channel_id: channel.id,
      total_price: totalWithAdjustments,
      quantity: itemCount,
      unit_price: itemCount > 0 ? totalWithAdjustments / itemCount : totalWithAdjustments,
      track_token: crypto.randomUUID(),
      is_scheduled: false,
      scheduled_for: null,
      sale_date: new Date().toISOString(),
      notes: [orderNotes?.trim(), courierNote ? `Courier: ${courierNote}` : ''].filter(Boolean).join(' | ') || null,
      delivery_notes: courierNote || null,
      online_payment_method: null,
      payment_method: normalizedPaymentMethod,
      customer_name: customerName?.trim() || null,
      customer_phone: normalizedPhone,
      delivery_address: fulfillmentType === 'delivery' ? deliveryAddress?.trim() ?? null : null,
      delivery_apartment: fulfillmentType === 'delivery' ? deliveryApartment?.trim() || null : null,
      delivery_floor: fulfillmentType === 'delivery' ? deliveryFloor?.trim() || null : null,
      delivery_lat: fulfillmentType === 'delivery' ? deliveryLat ?? null : null,
      delivery_lng: fulfillmentType === 'delivery' ? deliveryLng ?? null : null,
      delivery_fee: deliveryFee,
      delivery_zone_id: zoneId,
      customer_user_id: null,
      payment_init_token: null,
    };

    let insertPayload: Record<string, unknown> = { ...saleInsertBase };
    let saleRow: { id: string } | null = null;
    let saleErr: { message?: string } | null = null;

    for (let allocatorTry = 0; allocatorTry < 4; allocatorTry += 1) {
      const allocated = await allocateDirectDisplayNumber(supabase);
      if (!allocated.ok) {
        return jsonResponse({ error: allocated.message, code: allocated.code }, allocated.status);
      }

      insertPayload = {
        ...insertPayload,
        daily_order_number: allocated.value.daily_order_number,
        display_number: allocated.value.display_number,
      };

      const { data, error } = await supabase.from('sales').insert(insertPayload).select('id').single();
      if (!error && data) {
        saleRow = data as { id: string };
        saleErr = null;
        break;
      }
      saleErr = error as { message?: string } | null;
      if (!isActiveDisplayNumberUniqueViolation(error)) break;
    }

    if (saleErr || !saleRow) {
      return jsonResponse({ error: saleErr?.message ?? 'Failed to create sale' }, 500);
    }

    const displayNumber = String(insertPayload.display_number ?? '');
    const saleId = saleRow.id;
    const responseItems: Array<{
      id: string;
      productName: string;
      quantity: number;
      modifiers: string[];
      notes: string | null;
    }> = [];

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
        return jsonResponse({ error: siErr?.message ?? 'Failed to create line' }, 500);
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

      responseItems.push({
        id: saleItem.id as string,
        productName: p.name,
        quantity: line.quantity,
        modifiers: line.modifierRows.map((m) => m.optionName),
        notes: line.notes || null,
      });
    }

    return jsonResponse({
      saleId,
      displayNumber,
      source,
      total: totalWithAdjustments,
      deliveryFee,
      saleItems: responseItems,
    });
  } catch (e) {
    console.error('pos-order-create', e);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
