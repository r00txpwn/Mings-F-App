/**
 * Pure mapping: sale + line items → local print agent label payloads.
 */
import type { Sale, SaleItem, SaleItemModifier } from '../lib/supabase';
import { isPosSource } from './posSources';

export type PrintLabelItem = {
  jobLineId: string;
  displayNumber: string;
  platformBadge: string;
  productName: string;
  quantity: number;
  modifiers: string[];
  note: string | null;
  printedAt: string;
};

export function sourceToPlatformBadge(source: string | undefined): string {
  switch (source) {
    case 'pos_eat_in':
      return 'POS · Eat In';
    case 'pos_takeaway':
      return 'POS · Takeaway';
    case 'pos_delivery':
      return 'POS · Delivery';
    case 'kiosk':
      return 'Kiosk';
    case 'online_takeaway':
      return 'Website · Takeaway';
    case 'online_delivery':
      return 'Website · Delivery';
    case 'wolt':
      return 'Wolt';
    case 'bolt':
      return 'Bolt';
    default:
      if (isPosSource(source)) return 'POS';
      return source ? String(source) : 'Order';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function buildPrintLabelsFromSale(
  sale: Pick<Sale, 'display_number' | 'source' | 'notes' | 'created_at'>,
  items: Array<
    SaleItem & {
      sale_item_modifiers?: SaleItemModifier[];
    }
  >,
  opts?: { orderNotes?: string | null; now?: Date }
): PrintLabelItem[] {
  const displayNumber = String(sale.display_number ?? '').trim() || '—';
  const platformBadge = sourceToPlatformBadge(sale.source);
  const printedAt = formatTime((opts?.now ?? new Date()).toISOString());
  const orderNote = [opts?.orderNotes, sale.notes].filter(Boolean).join(' · ') || null;

  const labels: PrintLabelItem[] = [];

  for (const item of items) {
    const mods =
      item.sale_item_modifiers
        ?.map((m) => m.modifier_option_name)
        .filter(Boolean) as string[] | undefined;
    const modifierText = mods?.length ? mods : [];
    const lineNote = [item.notes, orderNote].filter(Boolean).join(' · ') || null;
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));

    for (let copy = 0; copy < qty; copy += 1) {
      labels.push({
        jobLineId: `${item.id}:${copy}`,
        displayNumber,
        platformBadge,
        productName: item.product_name,
        quantity: 1,
        modifiers: modifierText,
        note: lineNote,
        printedAt,
      });
    }
  }

  return labels;
}

export type PosOrderCreateSaleItem = {
  id: string;
  productName: string;
  quantity: number;
  modifiers: string[];
  notes: string | null;
};

export function buildPrintLabelsFromCreateResponse(
  displayNumber: string,
  source: string | undefined,
  saleItems: PosOrderCreateSaleItem[],
  orderNotes?: string | null
): PrintLabelItem[] {
  const platformBadge = sourceToPlatformBadge(source);
  const printedAt = formatTime(new Date().toISOString());
  const orderNote = orderNotes?.trim() || null;
  const labels: PrintLabelItem[] = [];

  for (const item of saleItems) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    for (let copy = 0; copy < qty; copy += 1) {
      labels.push({
        jobLineId: `${item.id}:${copy}`,
        displayNumber,
        platformBadge,
        productName: item.productName,
        quantity: 1,
        modifiers: item.modifiers ?? [],
        note: [item.notes, orderNote].filter(Boolean).join(' · ') || null,
        printedAt,
      });
    }
  }

  return labels;
}
