import { supabase } from '../../lib/supabase';
import { BAKU_MAP_BOUNDS, isWithinBakuBounds } from '../../lib/bakuMapBounds';

export type OrderLocationSourceFilter = 'all' | 'online_delivery' | 'pos_delivery';

export interface OrderLocationPoint {
  id: string;
  lat: number;
  lng: number;
  source: string;
  saleDate: string;
  totalPrice: number;
  displayNumber: string | null;
  address: string | null;
  orderStatus: string | null;
}

const DELIVERY_SOURCES = ['online_delivery', 'pos_delivery'] as const;

export async function fetchOrderDeliveryLocations(
  startDate: string,
  endDate: string,
  sourceFilter: OrderLocationSourceFilter,
): Promise<OrderLocationPoint[]> {
  const startIso = `${startDate}T00:00:00.000Z`;
  const endIso = `${endDate}T23:59:59.999Z`;

  let query = supabase
    .from('sales')
    .select(
      'id, delivery_lat, delivery_lng, source, sale_date, total_price, display_number, delivery_address, order_status',
    )
    .gte('sale_date', startIso)
    .lte('sale_date', endIso)
    .gte('delivery_lat', BAKU_MAP_BOUNDS.south)
    .lte('delivery_lat', BAKU_MAP_BOUNDS.north)
    .gte('delivery_lng', BAKU_MAP_BOUNDS.west)
    .lte('delivery_lng', BAKU_MAP_BOUNDS.east)
    .not('delivery_lat', 'is', null)
    .not('delivery_lng', 'is', null)
    .neq('order_status', 'cancelled')
    .order('sale_date', { ascending: false })
    .limit(5000);

  if (sourceFilter === 'all') {
    query = query.in('source', [...DELIVERY_SOURCES]);
  } else {
    query = query.eq('source', sourceFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const points: OrderLocationPoint[] = [];
  for (const row of data ?? []) {
    const lat = Number(row.delivery_lat);
    const lng = Number(row.delivery_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (!isWithinBakuBounds(lat, lng)) continue;

    points.push({
      id: row.id,
      lat,
      lng,
      source: String(row.source ?? ''),
      saleDate: String(row.sale_date ?? ''),
      totalPrice: Number(row.total_price ?? 0),
      displayNumber: row.display_number ?? null,
      address: row.delivery_address ?? null,
      orderStatus: row.order_status ?? null,
    });
  }

  return points;
}
