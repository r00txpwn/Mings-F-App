import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import {
  assertDirectOrderRequestLimits,
  assertLineQuantity,
  assertUniqueModifierIds,
  cartStats,
  hashDirectOrderRequest,
  isValidUuid,
} from '../_shared/directOrderValidation.ts';
import { invokePersistDirectOrder } from '../_shared/persistDirectOrder.ts';

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

interface CartLine {
  productId: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
}

interface Body {
  cart: CartLine[];
  clientRequestId: string;
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

function errorResponse(code: string, error: string, status = 400): Response {
  return jsonResponse({ code, error }, status);
}

function assertKioskSecret(req: Request): Response | null {
  const expected = (Deno.env.get('KIOSK_SECRET') ?? '').trim();
  if (!expected) return null;
  const provided = (req.headers.get('x-kiosk-secret') ?? '').trim();
  if (provided !== expected) {
    return errorResponse('KIOSK_FORBIDDEN', 'Invalid kiosk access', 403);
  }
  return null;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return corsPreflightResponse();
    if (req.method !== 'POST') {
      return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    const secretGate = assertKioskSecret(req);
    if (secretGate) return secretGate;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return errorResponse('SERVER_MISCONFIGURED', 'Server misconfigured', 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const rawBody = await req.text();
    let body: Body;
    try {
      body = JSON.parse(rawBody) as Body;
    } catch {
      return errorResponse('INVALID_JSON', 'Invalid JSON', 400);
    }

    const { cart, clientRequestId } = body;
    if (!Array.isArray(cart) || cart.length === 0) {
      return errorResponse('CART_EMPTY', 'Cart is empty', 400);
    }
    if (!clientRequestId || !isValidUuid(clientRequestId)) {
      return errorResponse('CLIENT_REQUEST_ID_REQUIRED', 'Valid clientRequestId required', 400);
    }

    const stats = cartStats(
      cart.map((l) => ({ quantity: l.quantity, modifierOptionIds: l.modifierOptionIds }))
    );
    const limits = assertDirectOrderRequestLimits(
      rawBody,
      stats.lineCount,
      stats.totalItems,
      stats.maxModifiers
    );
    if (!limits.ok) {
      return errorResponse(limits.code, limits.message, 400);
    }

    const { data: channel } = await supabase.from('sales_channels').select('id').eq('name', 'Kiosk').maybeSingle();
    if (!channel?.id) {
      return errorResponse('KIOSK_CHANNEL_MISSING', 'Kiosk sales channel missing', 500);
    }

    const productIds = [...new Set(cart.map((l) => l.productId).filter(Boolean))];
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select(
        'id, name, selling_price, kiosk_visible, is_deleted, product_modifier_groups(modifier_groups(id, name, min_select, max_select, modifier_options(id, name, price_adjustment, is_available)))'
      )
      .in('id', productIds);

    if (prodErr || !products?.length) {
      return errorResponse('PRODUCTS_LOAD_FAILED', 'Could not load products', 400);
    }

    const productMap = new Map(products.map((p) => [p.id as string, p as Record<string, unknown>]));

    type ResolvedLine = {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      notes: string | null;
      modifiers: Array<{
        modifier_group_name: string;
        modifier_option_name: string;
        price_adjustment: number;
      }>;
    };

    const resolvedLines: ResolvedLine[] = [];
    let subtotal = 0;

    for (const line of cart) {
      if (!line.productId) {
        return errorResponse('INVALID_CART_LINE', 'Invalid cart line', 400);
      }
      const p = productMap.get(line.productId);
      if (!p || p.kiosk_visible === false || p.is_deleted === true) {
        return errorResponse('INVALID_PRODUCT', `Invalid product: ${line.productId}`, 400);
      }

      const qty = assertLineQuantity(line.quantity);
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

      let optionIds: string[] = [];
      try {
        optionIds = assertUniqueModifierIds(line.modifierOptionIds ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'INVALID_MODIFIER';
        return errorResponse(msg, msg, 400);
      }

      for (const g of groups) {
        const opts = g.modifier_options ?? [];
        const idSet = new Set(opts.map((o) => o.id));
        const minSel = Math.max(0, Math.floor(Number(g.min_select ?? 0)));
        const maxSel = effectiveMaxSelectForValidation(g);
        const minClamped = Math.min(minSel, maxSel);
        const count = optionIds.filter((id) => idSet.has(id)).length;
        if (count > maxSel) {
          return errorResponse('MODIFIER_MAX', `Too many modifiers for "${g.name}"`, 400);
        }
        if (count < minClamped) {
          return errorResponse('MODIFIER_MIN', `Not enough modifiers for "${g.name}"`, 400);
        }
      }

      const allOptions = groups.flatMap((g) => g.modifier_options ?? []);
      let modAdjust = 0;
      const modifiers: ResolvedLine['modifiers'] = [];
      for (const oid of optionIds) {
        const opt = allOptions.find((o) => o.id === oid);
        if (!opt || opt.is_available === false) {
          return errorResponse('INVALID_MODIFIER', `Invalid modifier: ${oid}`, 400);
        }
        modAdjust += Number(opt.price_adjustment ?? 0);
        modifiers.push({
          modifier_group_name: getGroupNameForOption(groups, oid),
          modifier_option_name: opt.name,
          price_adjustment: Number(opt.price_adjustment ?? 0),
        });
      }

      const unitPrice = base + modAdjust;
      subtotal += unitPrice * qty;
      const modSummary = modifiers.map((m) => m.modifier_option_name).join(', ');
      const noteParts = [line.notes, modSummary].filter(Boolean).join(' | ');

      resolvedLines.push({
        product_id: line.productId,
        product_name: String((p as { name: string }).name),
        quantity: qty,
        unit_price: unitPrice,
        total_price: unitPrice * qty,
        notes: noteParts || null,
        modifiers,
      });
    }

    const itemCount = resolvedLines.reduce((s, l) => s + l.quantity, 0);
    const clientRequestHash = await hashDirectOrderRequest({
      source: 'kiosk',
      cart: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        notes: l.notes ?? null,
        modifierOptionIds: l.modifierOptionIds ?? [],
      })),
    });

    const persistSale = {
      order_status: 'pending',
      payment_status: 'unpaid',
      sales_channel_id: channel.id,
      total_price: subtotal,
      quantity: itemCount,
      unit_price: itemCount > 0 ? subtotal / itemCount : subtotal,
      sale_date: new Date().toISOString(),
      notes: '',
    };

    const persisted = await invokePersistDirectOrder(supabase, {
      source: 'kiosk',
      client_request_id: clientRequestId,
      client_request_hash: clientRequestHash,
      sale: persistSale,
      lines: resolvedLines,
    });

    if (!persisted.ok) {
      return errorResponse(persisted.code, persisted.message, persisted.status);
    }

    return jsonResponse({
      displayNumber: persisted.data.display_number,
      saleId: persisted.data.sale_id,
      total: subtotal,
      idempotent: persisted.data.idempotent,
    });
  } catch (e) {
    console.error('kiosk-order-create', e);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
