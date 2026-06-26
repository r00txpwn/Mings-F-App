/** Sale sources shown on POS, KDS, and order-manager kitchen queue. */
export const LEGACY_KITCHEN_SOURCES = ['kiosk', 'online_delivery', 'online_takeaway'] as const;

export const POS_SOURCES = ['pos_eat_in', 'pos_takeaway', 'pos_delivery'] as const;

export type PosSource = (typeof POS_SOURCES)[number];

export const ALL_KITCHEN_SOURCES = [...LEGACY_KITCHEN_SOURCES, ...POS_SOURCES] as const;

export type KitchenSource = (typeof ALL_KITCHEN_SOURCES)[number];

export function isPosSource(source: string | undefined): source is PosSource {
  return Boolean(source && (POS_SOURCES as readonly string[]).includes(source));
}

export function fulfillmentToPosSource(
  fulfillment: 'eat_in' | 'takeaway' | 'delivery'
): PosSource {
  if (fulfillment === 'eat_in') return 'pos_eat_in';
  if (fulfillment === 'takeaway') return 'pos_takeaway';
  return 'pos_delivery';
}
