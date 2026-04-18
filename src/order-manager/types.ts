import type { Sale, SaleItem } from '../lib/supabase';

export type OrderManagerStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'completed' | 'cancelled';

export interface OrderManagerOrder extends Sale {
  sale_items: SaleItem[];
  delivery_order?: {
    status?: string | null;
    tracking_url?: string | null;
    wolt_delivery_id?: string | null;
    manually_dispatched?: boolean | null;
  } | null;
}

export function isOnlineOrder(source: string | undefined): boolean {
  return source === 'online_delivery' || source === 'online_takeaway';
}

export function isPendingOnlinePayment(order: OrderManagerOrder): boolean {
  if (!isOnlineOrder(order.source)) return false;
  if ((order.online_payment_method ?? '') !== 'epoint') return false;
  const status = String(order.payment_status ?? '');
  return status !== 'paid' && status !== 'completed';
}
