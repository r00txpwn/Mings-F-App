/** Mirror of src/lib/directOrderValidation.ts for Edge Functions. Keep in sync. */

export const DIRECT_ORDER_LIMITS = {
  maxBodyBytes: 256 * 1024,
  maxCartLines: 40,
  maxQuantityPerLine: 20,
  maxTotalItems: 99,
  maxModifierIdsPerLine: 30,
} as const;

export const PERSIST_DIRECT_SOURCES = new Set([
  'kiosk',
  'online_delivery',
  'online_takeaway',
]);

export type DirectOrderLineInput = {
  productId?: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
  isCombo?: boolean;
  comboId?: string;
};

export type PersistDirectOrderLine = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  is_combo?: boolean;
  combo_id?: string | null;
  combo_selections?: Record<string, unknown> | null;
  modifiers: Array<{
    modifier_group_name: string;
    modifier_option_name: string;
    price_adjustment: number;
  }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export function assertDirectOrderRequestLimits(
  rawBody: string,
  cartLineCount: number,
  totalItemCount: number,
  maxModifiersOnLine: number
): { ok: true } | { ok: false; code: string; message: string } {
  if (rawBody.length > DIRECT_ORDER_LIMITS.maxBodyBytes) {
    return { ok: false, code: 'REQUEST_TOO_LARGE', message: 'Request body exceeds limit' };
  }
  if (cartLineCount < 1 || cartLineCount > DIRECT_ORDER_LIMITS.maxCartLines) {
    return { ok: false, code: 'CART_LINE_LIMIT', message: 'Cart line count out of range' };
  }
  if (totalItemCount < 1 || totalItemCount > DIRECT_ORDER_LIMITS.maxTotalItems) {
    return { ok: false, code: 'CART_ITEM_LIMIT', message: 'Total item count out of range' };
  }
  if (maxModifiersOnLine > DIRECT_ORDER_LIMITS.maxModifierIdsPerLine) {
    return { ok: false, code: 'MODIFIER_LIMIT', message: 'Too many modifiers on one line' };
  }
  return { ok: true };
}

export function assertLineQuantity(quantity: number): number {
  const q = Math.floor(Number(quantity));
  if (!Number.isFinite(q) || q < 1 || q > DIRECT_ORDER_LIMITS.maxQuantityPerLine) {
    throw new Error('INVALID_LINE_QUANTITY');
  }
  return q;
}

export function assertUniqueModifierIds(ids: string[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!isValidUuid(id)) throw new Error('INVALID_MODIFIER_ID');
    if (seen.has(id)) throw new Error('DUPLICATE_MODIFIER_ID');
    seen.add(id);
  }
  return ids;
}

export async function hashDirectOrderRequest(payload: unknown): Promise<string> {
  const text = JSON.stringify(payload);
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function cartStats(cart: DirectOrderLineInput[]): {
  lineCount: number;
  totalItems: number;
  maxModifiers: number;
} {
  let totalItems = 0;
  let maxModifiers = 0;
  for (const line of cart) {
    totalItems += Math.max(1, Math.floor(Number(line.quantity) || 0));
    maxModifiers = Math.max(maxModifiers, line.modifierOptionIds?.length ?? 0);
  }
  return { lineCount: cart.length, totalItems, maxModifiers };
}
