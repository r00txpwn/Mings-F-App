import type { Sale, SaleItem, SaleItemModifier } from '../lib/supabase';

export type KdsSourceFilter =
  | 'all'
  | 'online_delivery'
  | 'online_takeaway'
  | 'kiosk'
  | 'pos_eat_in'
  | 'pos_takeaway'
  | 'pos_delivery';

export type KdsKitchenOrder = Sale & { sale_items: SaleItem[] };

export type KdsOrderGroups = {
  pending: KdsKitchenOrder[];
  preparing: KdsKitchenOrder[];
  ready: KdsKitchenOrder[];
};

export type KdsChannelLabelKey =
  | 'kdsChannelDelivery'
  | 'kdsChannelTakeaway'
  | 'kdsChannelKiosk'
  | 'kdsChannelPosEatIn'
  | 'kdsChannelPosTakeaway'
  | 'kdsChannelPosDelivery';

export type KdsChannelMeta = {
  labelKey: KdsChannelLabelKey;
  headerClass: string;
};

/** One checkable kitchen line (regular item or flattened combo sub-line). */
export type KdsCheckableLine = {
  id: string;
  saleItemId: string;
  label: string;
  quantity: number;
  groupLabel?: string;
  modifiers?: string[];
  notes?: string | null;
  preparedAt?: string | null;
};

import { ALL_KITCHEN_SOURCES } from '../pos/posSources';

const KITCHEN_SOURCES = new Set<string>(ALL_KITCHEN_SOURCES);

export function groupOrdersByStatus(orders: KdsKitchenOrder[]): KdsOrderGroups {
  const pending: KdsKitchenOrder[] = [];
  const preparing: KdsKitchenOrder[] = [];
  const ready: KdsKitchenOrder[] = [];

  for (const order of orders) {
    const status = order.order_status || 'pending';
    if (status === 'pending') pending.push(order);
    else if (status === 'preparing') preparing.push(order);
    else if (status === 'ready') ready.push(order);
  }

  return { pending, preparing, ready };
}

export function filterOrdersBySource(orders: KdsKitchenOrder[], source: KdsSourceFilter): KdsKitchenOrder[] {
  if (source === 'all') return orders;
  return orders.filter((o) => o.source === source);
}

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/^#+/, '').toLowerCase();
}

export function filterOrdersBySearch(orders: KdsKitchenOrder[], query: string): KdsKitchenOrder[] {
  const q = normalizeSearchQuery(query);
  if (!q) return orders;
  return orders.filter((o) => {
    const num = (o.display_number ?? '').toLowerCase();
    return num.includes(q);
  });
}

export function applyKdsFilters(
  orders: KdsKitchenOrder[],
  source: KdsSourceFilter,
  search: string
): KdsKitchenOrder[] {
  return filterOrdersBySearch(filterOrdersBySource(orders, source), search);
}

export function getChannelMeta(source: string | undefined): KdsChannelMeta {
  switch (source) {
    case 'online_delivery':
      return { labelKey: 'kdsChannelDelivery', headerClass: 'bg-rose-500' };
    case 'online_takeaway':
      return { labelKey: 'kdsChannelTakeaway', headerClass: 'bg-orange-500' };
    case 'kiosk':
      return { labelKey: 'kdsChannelKiosk', headerClass: 'bg-amber-400 text-gray-900' };
    case 'pos_eat_in':
      return { labelKey: 'kdsChannelPosEatIn', headerClass: 'bg-violet-500' };
    case 'pos_takeaway':
      return { labelKey: 'kdsChannelPosTakeaway', headerClass: 'bg-indigo-500' };
    case 'pos_delivery':
      return { labelKey: 'kdsChannelPosDelivery', headerClass: 'bg-fuchsia-500' };
    default:
      return { labelKey: 'kdsChannelKiosk', headerClass: 'bg-amber-400 text-gray-900' };
  }
}

export function flattenLineItems(item: SaleItem): KdsCheckableLine[] {
  const mods = (item as SaleItem & { sale_item_modifiers?: SaleItemModifier[] }).sale_item_modifiers;
  const modNames = mods?.map((m) => m.modifier_option_name).filter(Boolean) as string[] | undefined;

  if (item.is_combo && item.combo_selections) {
    const cs = item.combo_selections as {
      combo?: string;
      items?: Array<{ group: string; item: string; modifiers?: string[] }>;
    };
    const subItems = cs.items ?? [];
    if (subItems.length === 0) {
      return [
        {
          id: item.id,
          saleItemId: item.id,
          label: cs.combo ?? item.product_name,
          quantity: item.quantity,
          modifiers: modNames,
          notes: item.notes,
          preparedAt: item.prepared_at ?? null,
        },
      ];
    }
    return subItems.map((row, index) => ({
      id: `${item.id}:${index}`,
      saleItemId: item.id,
      label: row.item,
      quantity: item.quantity,
      groupLabel: row.group,
      modifiers: row.modifiers?.length ? row.modifiers : undefined,
      notes: item.notes,
      preparedAt: item.prepared_at ?? null,
    }));
  }

  return [
    {
      id: item.id,
      saleItemId: item.id,
      label: item.product_name,
      quantity: item.quantity,
      modifiers: modNames,
      notes: item.notes,
      preparedAt: item.prepared_at ?? null,
    },
  ];
}

export function flattenOrderLines(order: KdsKitchenOrder): KdsCheckableLine[] {
  return (order.sale_items ?? []).flatMap(flattenLineItems);
}

export function allItemsPrepared(lines: KdsCheckableLine[]): boolean {
  if (lines.length === 0) return true;
  return lines.every((line) => Boolean(line.preparedAt));
}

export function isKitchenSource(source: string | undefined): boolean {
  return Boolean(source && KITCHEN_SOURCES.has(source));
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function formatCountdown(msRemaining: number): string {
  const abs = Math.abs(msRemaining);
  const totalSec = Math.floor(abs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const sign = msRemaining < 0 ? '−' : '';
  return `${sign}${min}:${String(sec).padStart(2, '0')}`;
}

export function isOnlineOrder(source: string | undefined): boolean {
  return source === 'online_delivery' || source === 'online_takeaway';
}
