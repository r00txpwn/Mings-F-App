import type { Translations } from '../translations';
import { isPosSource } from '../pos/posSources';

/** Human-readable channel label for Order Manager order cards. */
export function orderSourceLabel(source: string | undefined, t: Translations): string {
  if (source === 'online_delivery') return t.omSourceDelivery;
  if (source === 'online_takeaway') return t.omSourceTakeaway;
  if (source === 'pos_eat_in') return t.posSourceEatIn;
  if (source === 'pos_takeaway') return t.posSourceTakeaway;
  if (source === 'pos_delivery') return t.posSourceDelivery;
  if (isPosSource(source)) return t.omSourcePos;
  if (source === 'kiosk') return t.omSourceKiosk;
  return t.omSourceKiosk;
}
