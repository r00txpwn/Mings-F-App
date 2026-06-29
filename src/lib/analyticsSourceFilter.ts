import type { AnalyticsSourceFilter } from '../types/analytics';
import type { Translations } from '../translations';

export const ANALYTICS_SOURCE_OPTIONS: AnalyticsSourceFilter[] = [
  'all',
  'manual',
  'kiosk',
  'online_delivery',
  'online_takeaway',
  'pos_eat_in',
  'pos_takeaway',
  'pos_delivery',
];

export function labelForAnalyticsSource(t: Translations, src: AnalyticsSourceFilter): string {
  switch (src) {
    case 'all':
      return t.allStatuses;
    case 'manual':
      return t.manual;
    case 'kiosk':
      return t.kiosk;
    case 'online_delivery':
      return t.onlineDelivery;
    case 'online_takeaway':
      return t.onlineTakeaway;
    case 'pos_eat_in':
      return `${t.pos} · ${t.posFulfillmentEatIn}`;
    case 'pos_takeaway':
      return `${t.pos} · ${t.posFulfillmentTakeaway}`;
    case 'pos_delivery':
      return `${t.pos} · ${t.posFulfillmentDelivery}`;
  }
}

type SourceFilterQuery<T> = {
  eq: (col: string, val: string) => T;
};

export function applyAnalyticsSourceFilter<T extends SourceFilterQuery<T>>(
  query: T,
  source?: AnalyticsSourceFilter,
): T {
  if (!source || source === 'all') {
    return query;
  }
  return query.eq('source', source);
}
