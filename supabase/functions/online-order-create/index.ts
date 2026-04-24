import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import { pointInGeoJsonPolygon } from '../_shared/geo.ts';

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

type FulfillmentType = 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'cod' | 'epoint';

interface CartLine {
  productId?: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
  isCombo?: boolean;
  comboId?: string;
  comboSelections?: Array<{ groupId: string; itemId: string; modifierOptionIds?: string[] }>;
}

interface Body {
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  cart: CartLine[];
  promoCode?: string;
  tipAmount?: number;
  orderNotes?: string;
  isScheduled?: boolean;
  scheduledFor?: string;
  customerName?: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  /** Apartment / flat / unit number — stored on `sales.delivery_apartment`. */
  deliveryApartment?: string;
  /** Floor number — stored on `sales.delivery_floor`. */
  deliveryFloor?: string;
  /** Buzzer / courier-visible instructions — stored on `sales.delivery_notes`. */
  deliveryNotes?: string;
  /** QR/table context (e.g. `?table=` or `?ref=`) — stored on the sale `notes` field for kitchen. */
  tableLabel?: string;
}

function errorResponse(code: string, error: string, status = 400): Response {
  return jsonResponse({ code, error }, status);
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

function getGroupNameForOption(
  groups: Array<{ id: string; name: string; modifier_options?: Array<{ id: string }> }>,
  optionId: string
): string {
  for (const g of groups) {
    if (g.modifier_options?.some((o) => o.id === optionId)) return g.name;
  }
  return '';
}

/** Mirrors `src/lib/modifierGroupConstraints.ts` — spice/heat-style groups must behave as single choice even if max_select in DB is > 1. */
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
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return errorResponse('SERVER_MISCONFIGURED', 'Server misconfigured', 500);
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
  if (!customerUserId) {
    return errorResponse('AUTH_REQUIRED', 'Authentication required to place order', 401);
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorResponse('INVALID_JSON', 'Invalid JSON', 400);
  }

  const {
    fulfillmentType,
    paymentMethod = 'cod',
    cart,
    customerName,
    customerPhone,
    promoCode,
    tipAmount,
    orderNotes,
    isScheduled,
    scheduledFor,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    deliveryApartment,
    deliveryFloor,
    tableLabel,
    deliveryNotes,
  } = body;

  if (!Array.isArray(cart) || cart.length === 0) {
    return errorResponse('CART_EMPTY', 'Cart is empty', 400);
  }
  if (!customerPhone || typeof customerPhone !== 'string') {
    return errorResponse('PHONE_REQUIRED', 'Valid phone number required', 400);
  }
  const normalizedPhone = normalizePhoneE164(customerPhone);
  if (!isLikelyE164(normalizedPhone)) {
    return errorResponse('PHONE_INVALID', 'Valid phone number required (E.164, e.g. +994...)', 400);
  }

  const { data: settings } = await supabase.from('online_settings').select('*').limit(1).maybeSingle();
  if (!settings) {
    return errorResponse('ONLINE_NOT_CONFIGURED', 'Online ordering not configured', 503);
  }

  if (fulfillmentType === 'takeaway' && !settings.takeaway_enabled) {
    return errorResponse('TAKEAWAY_DISABLED', 'Takeaway ordering is disabled', 400);
  }
  if (fulfillmentType === 'delivery' && !settings.delivery_enabled) {
    return errorResponse('DELIVERY_DISABLED', 'Delivery is disabled', 400);
  }

  if (fulfillmentType === 'delivery') {
    if (deliveryLat == null || deliveryLng == null || Number.isNaN(deliveryLat) || Number.isNaN(deliveryLng)) {
      return errorResponse('DELIVERY_LOCATION_REQUIRED', 'Delivery location required', 400);
    }
    if (!deliveryAddress?.trim()) {
      return errorResponse('DELIVERY_ADDRESS_REQUIRED', 'Delivery address required', 400);
    }
  }

  let scheduledAtIso: string | null = null;
  if (isScheduled) {
    if (!scheduledFor?.trim()) {
      return errorResponse('SCHEDULE_TIME_REQUIRED', 'Scheduled time is required', 400);
    }
    const parsed = new Date(scheduledFor);
    if (Number.isNaN(parsed.getTime())) {
      return errorResponse('SCHEDULE_TIME_INVALID', 'Scheduled time is invalid', 400);
    }
    const leadMinutes = Number(settings.scheduled_lead_minutes ?? settings.default_prep_time_minutes ?? 45);
    if (parsed.getTime() < Date.now() + Math.max(5, leadMinutes) * 60_000) {
      return errorResponse('SCHEDULE_TIME_TOO_SOON', 'Scheduled time does not meet lead time', 400);
    }
    scheduledAtIso = parsed.toISOString();
  }

  const source = fulfillmentType === 'delivery' ? 'online_delivery' : 'online_takeaway';

  const { data: channel } = await supabase.from('sales_channels').select('id').eq('name', 'Online').maybeSingle();
  if (!channel?.id) {
    return errorResponse('ONLINE_CHANNEL_MISSING', 'Online sales channel missing', 500);
  }

  const { data: orderNum, error: rpcErr } = await supabase.rpc('generate_daily_order_number_for_source', {
    order_source: source,
  });
  if (rpcErr || orderNum == null) {
    return errorResponse('ORDER_NUMBER_FAILED', rpcErr?.message ?? 'Order number failed', 500);
  }
  const dailyNumber = Number(orderNum);
  const displayNumber = 'O' + String(dailyNumber).padStart(3, '0');
  const trackToken = crypto.randomUUID();
  const paymentInitToken = crypto.randomUUID();

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
        matched = z as { id: string; delivery_fee: number; min_order_amount: number; polygon: unknown };
        break;
      }
    }
    if (!matched) {
      return errorResponse('OUTSIDE_DELIVERY_ZONE', 'Address is outside delivery zones', 400);
    }
    deliveryFee = Number(matched.delivery_fee ?? 0);
    zoneId = matched.id;
  }

  const productIds = [
    ...new Set(
      cart.filter((l) => !l.isCombo && l.productId).map((l) => l.productId as string)
    ),
  ];
  const hasProductLines = cart.some((l) => !l.isCombo && l.productId);

  let productMap = new Map<string, Record<string, unknown>>();
  if (productIds.length > 0) {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(
        'id, name, selling_price, online_visible, product_modifier_groups(modifier_groups(id, name, min_select, max_select, modifier_options(id, name, price_adjustment, is_available)))'
      )
      .in('id', productIds);

    if (prodErr || !products?.length) {
      return jsonResponse({ error: 'Could not load products' }, 400);
    }
    productMap = new Map(products.map((p) => [p.id as string, p as Record<string, unknown>]));
  } else if (hasProductLines) {
    return jsonResponse({ error: 'Could not load products' }, 400);
  }

  let subtotal = 0;
  type ResolvedProductLine = {
    kind: 'product';
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
  type ResolvedComboLine = {
    kind: 'combo';
    comboName: string;
    comboId: string;
    quantity: number;
    unitPrice: number;
    lineNotes: string;
    comboSelectionsJson: Record<string, unknown>;
    comboComponentModifiers: Array<{
      comboGroupName: string;
      optionName: string;
      priceAdjustment: number;
    }>;
  };
  const resolvedLines: Array<ResolvedProductLine | ResolvedComboLine> = [];

  for (const line of cart) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));

    if (line.isCombo && line.comboId) {
      const { data: deal, error: dealErr } = await supabase
        .from('combo_deals')
        .select('id, name, base_price, is_active')
        .eq('id', line.comboId)
        .maybeSingle();

      if (dealErr || !deal || !(deal as { is_active?: boolean }).is_active) {
        return jsonResponse({ error: 'Invalid combo deal' }, 400);
      }

      const { data: groups, error: gErr } = await supabase
        .from('combo_groups')
        .select('id, name, required, sort_order')
        .eq('combo_id', line.comboId)
        .order('sort_order', { ascending: true });

      if (gErr || !groups?.length) {
        return jsonResponse({ error: 'Combo has no groups' }, 400);
      }

      const selections = line.comboSelections ?? [];
      const itemsPayload: Array<{ group: string; item: string; itemId: string; modifiers?: string[] }> = [];
      const comboComponentModifiers: Array<{
        comboGroupName: string;
        optionName: string;
        priceAdjustment: number;
      }> = [];

      for (const g of groups) {
        const gid = (g as { id: string }).id;
        const gname = (g as { name: string }).name;
        const required = (g as { required?: boolean }).required !== false;
        const pick = selections.find((s) => s.groupId === gid);
        if (!pick) {
          if (required) {
            return jsonResponse({ error: `Combo: choose an item for "${gname}"` }, 400);
          }
          continue;
        }
        const { data: link } = await supabase
          .from('combo_group_items')
          .select('id')
          .eq('group_id', gid)
          .eq('menu_item_id', pick.itemId)
          .maybeSingle();
        if (!link) {
          return jsonResponse({ error: `Invalid combo choice for "${gname}"` }, 400);
        }
        const { data: pname } = await supabase
          .from('products')
          .select(
            'name, online_visible, product_modifier_groups(modifier_groups(id, name, modifier_options(id, name, price_adjustment, is_available)))'
          )
          .eq('id', pick.itemId)
          .maybeSingle();
        if (!pname || (pname as { online_visible?: boolean }).online_visible === false) {
          return jsonResponse({ error: 'Combo item unavailable' }, 400);
        }
        const selectedModifierIds = pick.modifierOptionIds ?? [];
        const pmgs = ((pname as { product_modifier_groups?: unknown[] }).product_modifier_groups ?? []) as Array<{
          modifier_groups: {
            id: string;
            name: string;
            modifier_options?: Array<{
              id: string;
              name: string;
              price_adjustment: number;
              is_available: boolean;
            }>;
          };
        }>;
        const modifierGroups = pmgs.map((row) => row.modifier_groups).filter(Boolean);
        const modifierNames: string[] = [];
        for (const modifierId of selectedModifierIds) {
          const parentGroup = modifierGroups.find((group) =>
            (group.modifier_options ?? []).some((option) => option.id === modifierId)
          );
          const opt = parentGroup?.modifier_options?.find((option) => option.id === modifierId);
          if (!opt || opt.is_available === false) {
            return jsonResponse({ error: 'Invalid combo modifier option' }, 400);
          }
          modifierNames.push(opt.name);
          comboComponentModifiers.push({
            comboGroupName: `${gname}${parentGroup?.name ? ` / ${parentGroup.name}` : ''}`,
            optionName: opt.name,
            priceAdjustment: Number(opt.price_adjustment ?? 0),
          });
        }
        itemsPayload.push({
          group: gname,
          item: (pname as { name: string }).name,
          itemId: pick.itemId,
          modifiers: modifierNames.length > 0 ? modifierNames : undefined,
        });
      }

      const base = Number((deal as { base_price: number }).base_price);
      const comboName = String((deal as { name: string }).name);
      subtotal += base * qty;

      resolvedLines.push({
        kind: 'combo',
        comboName,
        comboId: line.comboId,
        quantity: qty,
        unitPrice: base,
        lineNotes: line.notes?.trim() ?? '',
        comboSelectionsJson: {
          combo: comboName,
          items: itemsPayload,
        },
        comboComponentModifiers,
      });
      continue;
    }

    if (!line.productId) {
      return jsonResponse({ error: 'Invalid cart line' }, 400);
    }

    const p = productMap.get(line.productId);
    if (!p || p.online_visible === false) {
      return jsonResponse({ error: `Invalid product: ${line.productId}` }, 400);
    }
    const base = Number((p as { selling_price: number }).selling_price);
    const pmgs = ((p as { product_modifier_groups?: unknown[] }).product_modifier_groups ?? []) as Array<{
      modifier_groups: Record<string, unknown>;
    }>;
    const groups = pmgs
      .map((x) => x.modifier_groups)
      .filter(Boolean) as Array<{
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
      if (count > maxSel) {
        return jsonResponse({ error: `Too many modifiers selected for "${g.name}"` }, 400);
      }
      if (count < minClamped) {
        return jsonResponse({ error: `Not enough modifiers selected for "${g.name}"` }, 400);
      }
    }

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
      kind: 'product',
      product: p,
      quantity: qty,
      notes: noteParts,
      unitPrice,
      modifierRows,
    });
  }

  const tip = Math.max(0, Number(tipAmount ?? 0));
  let discount = 0;
  let promoCodeApplied: string | null = null;
  if (promoCode?.trim()) {
    const normalizedCode = promoCode.trim().toUpperCase();
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('active', true)
      .maybeSingle();
    if (!promo) {
      return errorResponse('PROMO_INVALID', 'Promo code is invalid or inactive', 400);
    }
    const startsAt = promo.starts_at ? new Date(String(promo.starts_at)).getTime() : null;
    const endsAt = promo.ends_at ? new Date(String(promo.ends_at)).getTime() : null;
    const now = Date.now();
    if ((startsAt && now < startsAt) || (endsAt && now > endsAt)) {
      return errorResponse('PROMO_INACTIVE_WINDOW', 'Promo code is not active right now', 400);
    }
    const minPromoOrder = Number(promo.min_order_amount ?? 0);
    if (subtotal < minPromoOrder) {
      return errorResponse('PROMO_MIN_NOT_MET', `Promo requires minimum ₼${minPromoOrder.toFixed(2)}`, 400);
    }
    if (promo.discount_type === 'percent') {
      discount = (subtotal * Number(promo.discount_value ?? 0)) / 100;
    } else {
      discount = Number(promo.discount_value ?? 0);
    }
    discount = Math.max(0, Math.min(discount, subtotal));
    promoCodeApplied = normalizedCode;
  }

  const totalWithAdjustments = subtotal + deliveryFee - discount + tip;
  // Combos remain bundled pricing lines and should stay outside discount arithmetic by default.
  const minOrder = Number(settings.min_order_amount ?? 0);
  if (totalWithAdjustments < minOrder) {
    return errorResponse('MIN_ORDER_NOT_MET', `Minimum order is ₼${minOrder.toFixed(2)}`, 400);
  }

  if (fulfillmentType === 'delivery' && zoneId) {
    const { data: zrow } = await supabase.from('delivery_zones').select('min_order_amount').eq('id', zoneId).maybeSingle();
    const zmin = Number((zrow as { min_order_amount?: number } | null)?.min_order_amount ?? 0);
    if (subtotal < zmin) {
      return errorResponse(
        'ZONE_MIN_ORDER_NOT_MET',
        `Minimum subtotal for this zone is ₼${zmin.toFixed(2)}`,
        400
      );
    }
  }

  let paymentStatus: string;
  if (paymentMethod === 'epoint') {
    paymentStatus = 'pending';
  } else {
    paymentStatus = 'unpaid';
  }

  const itemCount = resolvedLines.reduce((s, l) => s + l.quantity, 0);

  const tableNote = tableLabel?.trim() ? `Table/ref: ${tableLabel.trim()}` : '';
  const courierNote =
    fulfillmentType === 'delivery' && deliveryNotes?.trim()
      ? deliveryNotes.trim()
      : '';

  const saleInsertBase: Record<string, unknown> = {
    source,
    order_status: 'pending',
    payment_status: paymentStatus,
    sales_channel_id: channel.id,
    total_price: totalWithAdjustments,
    quantity: itemCount,
    unit_price: itemCount > 0 ? totalWithAdjustments / itemCount : totalWithAdjustments,
    daily_order_number: dailyNumber,
    display_number: displayNumber,
    track_token: trackToken,
    is_scheduled: Boolean(isScheduled && scheduledAtIso),
    scheduled_for: scheduledAtIso,
    sale_date: new Date().toISOString(),
    notes: [tableNote, orderNotes?.trim(), courierNote ? `Courier: ${courierNote}` : '']
      .filter(Boolean)
      .join(' | '),
    delivery_notes: courierNote || null,
    online_payment_method: paymentMethod,
    customer_name: customerName?.trim() || null,
    customer_phone: normalizedPhone,
    delivery_address: fulfillmentType === 'delivery' ? deliveryAddress?.trim() ?? null : null,
    delivery_apartment:
      fulfillmentType === 'delivery' ? deliveryApartment?.trim() || null : null,
    delivery_floor: fulfillmentType === 'delivery' ? deliveryFloor?.trim() || null : null,
    delivery_lat: fulfillmentType === 'delivery' ? deliveryLat ?? null : null,
    delivery_lng: fulfillmentType === 'delivery' ? deliveryLng ?? null : null,
    delivery_fee: deliveryFee,
    delivery_zone_id: zoneId,
    customer_user_id: customerUserId,
    payment_init_token: paymentInitToken,
  };

  const saleInsertWithDiscount: Record<string, unknown> = {
    ...saleInsertBase,
    discount_amount: discount,
    tip_amount: tip,
    promo_code: promoCodeApplied,
  };

  // Backward-compatible insert for environments where some sales columns
  // are not yet present or schema cache is stale.
  let insertPayload: Record<string, unknown> = { ...saleInsertWithDiscount };
  let saleRow: { id: string } | null = null;
  let saleErr: { message?: string } | null = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await supabase
      .from('sales')
      .insert(insertPayload)
      .select('id')
      .single();

    if (!error && data) {
      saleRow = data as { id: string };
      saleErr = null;
      break;
    }

    saleErr = error as { message?: string } | null;
    const msg = error?.message ?? '';
    const missingColMatch = /Could not find the '([^']+)' column of 'sales'/.exec(msg);
    if (!missingColMatch) break;

    const missingCol = missingColMatch[1];
    if (!(missingCol in insertPayload)) break;
    delete insertPayload[missingCol];
  }

  if (saleErr || !saleRow) {
    return jsonResponse({ error: saleErr?.message ?? 'Failed to create sale' }, 500);
  }

  const saleId = saleRow.id as string;

  for (const line of resolvedLines) {
    if (line.kind === 'combo') {
      const { data: saleItem, error: siErr } = await supabase
        .from('sale_items')
        .insert({
          sale_id: saleId,
          product_id: null,
          product_name: line.comboName,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          total_price: line.unitPrice * line.quantity,
          notes: line.lineNotes || null,
          is_combo: true,
          combo_id: line.comboId,
          combo_selections: line.comboSelectionsJson,
        })
        .select('id')
        .single();

      if (siErr || !saleItem) {
        await supabase.from('sales').delete().eq('id', saleId);
        return jsonResponse({ error: siErr?.message ?? 'Failed to create combo line' }, 500);
      }
      if (line.comboComponentModifiers.length > 0) {
        const comboModifierRows = line.comboComponentModifiers.map((mod) => ({
          sale_item_id: saleItem.id,
          modifier_group_name: mod.comboGroupName,
          modifier_option_name: mod.optionName,
          price_adjustment: mod.priceAdjustment,
        }));
        const { error: comboModErr } = await supabase.from('sale_item_modifiers').insert(comboModifierRows);
        if (comboModErr) {
          await supabase.from('sales').delete().eq('id', saleId);
          return jsonResponse({ error: comboModErr.message }, 500);
        }
      }
      continue;
    }

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

  if (fulfillmentType === 'delivery' && Deno.env.get('WOLT_API_TOKEN')) {
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const resp = await fetch(`${supabaseUrl}/functions/v1/wolt-drive-create`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ saleId }),
          });
          if (!resp.ok) {
            await supabase.from('dispatch_failures').insert({
              sale_id: saleId,
              reason: `wolt-drive-create failed: ${resp.status}`,
              payload: { status: resp.status },
            });
          }
        } catch (err) {
          await supabase.from('dispatch_failures').insert({
            sale_id: saleId,
            reason: 'wolt-drive-create network failure',
            payload: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      })()
    );
  }

  return jsonResponse({
    saleId,
    trackToken,
    displayNumber,
    total: totalWithAdjustments,
    deliveryFee,
    paymentMethod,
    paymentInitToken,
    nextStep: paymentMethod === 'epoint' ? 'epoint-create-payment' : 'track',
  });
}
