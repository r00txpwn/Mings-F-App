/** Kitchen queue sources — keep in sync with src/pos/posSources.ts ALL_KITCHEN_SOURCES */
export const KITCHEN_QUEUE_SOURCES = [
  'kiosk',
  'online_delivery',
  'online_takeaway',
  'pos_eat_in',
  'pos_takeaway',
  'pos_delivery',
] as const;

export const KITCHEN_QUEUE_STATUSES = ['pending', 'preparing', 'ready'] as const;

export function isKitchenQueueSource(source: string | null | undefined): boolean {
  return Boolean(source && (KITCHEN_QUEUE_SOURCES as readonly string[]).includes(source));
}
