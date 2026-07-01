import type { Sale, SaleItem } from '../lib/supabase';
import { isCardOnlinePaymentMethod, isCashLikeOnlineMethod } from '../lib/onlinePaymentMethod';

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

export function isSaleUnpaid(paymentStatus: string | null | undefined): boolean {
  const status = String(paymentStatus ?? '').toLowerCase();
  return status !== 'paid' && status !== 'completed';
}

export function isPendingOnlinePayment(order: OrderManagerOrder): boolean {
  if (!isOnlineOrder(order.source)) return false;
  if (!isCardOnlinePaymentMethod(order.online_payment_method)) return false;
  return isSaleUnpaid(order.payment_status);
}

/** Staff must confirm cash/card collection (OM or Order Support). */
export function needsStaffPaymentConfirmation(order: OrderManagerOrder): boolean {
  if (!isSaleUnpaid(order.payment_status)) return false;
  if (isPendingOnlinePayment(order)) return true;
  const src = String(order.source ?? '');
  if (src.startsWith('pos_') || src === 'kiosk') return true;
  if (isOnlineOrder(src) && isCashLikeOnlineMethod(order.online_payment_method, src)) return true;
  return false;
}

export function getCustomerDisplayName(order: OrderManagerOrder): string | null {
  const direct = String(order.customer_name ?? '').trim();
  if (direct) return direct;

  const noteNameMatch = String(order.notes ?? '').match(/(?:^|\|)\s*Customer:\s*([^|]+)/i);
  if (noteNameMatch && noteNameMatch[1]) {
    const fromNotes = noteNameMatch[1].trim();
    if (fromNotes) return fromNotes;
  }

  const phone = String(order.customer_phone ?? '').trim();
  if (phone) return phone;
  return null;
}
