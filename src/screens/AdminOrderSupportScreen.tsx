import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Package,
  XCircle,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  User,
  Phone,
  MapPin,
  Clock3,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { adminUpdate } from '../lib/adminApi';
import { buildMarkPaidPatch } from '../lib/cashPayment';
import type { SaleItem } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';
import { DateRangePicker } from '../components/DateRangePicker';
import { getOrderAppUrl } from '../lib/surfaceRouting';
import { OrderItemSummary } from '../order-manager/OrderItemSummary';
import { isCardOnlinePaymentMethod } from '../lib/onlinePaymentMethod';
import { getCustomerDisplayName, type OrderManagerOrder } from '../order-manager/types';

type OrderSupportStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

const POS_SOURCES = ['pos_eat_in', 'pos_takeaway', 'pos_delivery'] as const;
type PosSource = (typeof POS_SOURCES)[number];
type OrderSource = 'kiosk' | 'online_delivery' | 'online_takeaway' | PosSource;

const ORDER_SUPPORT_SOURCES: OrderSource[] = [
  'kiosk',
  'online_delivery',
  'online_takeaway',
  ...POS_SOURCES,
];

interface DeliveryOrder {
  sale_id: string;
  status?: string | null;
  tracking_url?: string | null;
  wolt_delivery_id?: string | null;
  manually_dispatched?: boolean | null;
}

interface AdminOrder {
  id: string;
  display_number?: string | null;
  created_at: string;
  source: OrderSource;
  order_status: OrderSupportStatus;
  payment_status?: string | null;
  payment_method?: string | null;
  online_payment_method?: string | null;
  total_price?: number | null;
  delivery_fee?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_notes?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  cancellation_reason?: string | null;
  refund_requested?: boolean | null;
  prep_started_at?: string | null;
  estimated_ready_at?: string | null;
  ready_at?: string | null;
  dispatched_at?: string | null;
  completed_at?: string | null;
  scheduled_for?: string | null;
  track_token?: string | null;
  sale_items?: SaleItem[] | null;
  delivery_order?: DeliveryOrder | null;
}

type StatusFilter = 'all' | 'active' | 'dispatched' | 'completed' | 'cancelled';
type SourceFilter = 'all' | 'pos' | OrderSource;

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'active',
  'dispatched',
  'completed',
  'cancelled',
];

const PREP_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

function fmtTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function fmtDateTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadgeClass(status: OrderSupportStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'preparing':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'ready':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'dispatched':
      return 'bg-cockpit-500/15 text-cockpit-300 border-cockpit-500/30';
    case 'completed':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    case 'cancelled':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}

function orderStatusLabel(t: ReturnType<typeof useLanguage>['t'], status: OrderSupportStatus): string {
  switch (status) {
    case 'pending':
      return t.pending;
    case 'preparing':
      return t.preparing;
    case 'ready':
      return t.ready;
    case 'dispatched':
      return t.dispatched;
    case 'completed':
      return t.completed;
    case 'cancelled':
      return t.cancelled;
    default:
      return status;
  }
}

function SourceIcon({ source }: { source: OrderSource }) {
  if (source === 'online_delivery') return <Truck className="h-3.5 w-3.5 text-blue-400" />;
  if (source === 'online_takeaway') return <ShoppingBag className="h-3.5 w-3.5 text-cockpit-400" />;
  if (POS_SOURCES.includes(source as PosSource)) {
    return <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />;
  }
  return <UtensilsCrossed className="h-3.5 w-3.5 text-slate-400" />;
}

function itemsSummary(items: SaleItem[] | null | undefined): string {
  if (!items?.length) return '—';
  const names = items
    .slice(0, 2)
    .map((i) => `${i.quantity ?? 1}× ${i.product_name ?? 'Item'}`);
  const extra = items.length > 2 ? ` +${items.length - 2}` : '';
  return names.join(', ') + extra;
}

function isPendingOnlinePayment(order: AdminOrder): boolean {
  const src = order.source;
  if (src !== 'online_delivery' && src !== 'online_takeaway') return false;
  if (!isCardOnlinePaymentMethod(order.online_payment_method)) return false;
  const st = String(order.payment_status ?? '');
  return st !== 'paid' && st !== 'completed';
}

type OrderSupportDrawerProps = {
  order: AdminOrder;
  onClose: () => void;
  /** Reload list and return the same sale row if it still exists (otherwise null). */
  refreshOrder: () => Promise<AdminOrder | null>;
};

function OrderSupportOrderDrawer({ order, onClose, refreshOrder }: OrderSupportDrawerProps) {
  const { t } = useLanguage();
  const [prepMinutes, setPrepMinutes] = useState<number>(15);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const omOrder = order as OrderManagerOrder;
  const customerDisplay = getCustomerDisplayName(omOrder);
  const pendingPay = isPendingOnlinePayment(order);
  const isScheduledPending = order.order_status === 'pending' && Boolean(order.scheduled_for);
  const isTerminal = order.order_status === 'completed' || order.order_status === 'cancelled';
  const trackingUrl = order.delivery_order?.tracking_url ?? '';

  const runUpdate = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await adminUpdate('sales', order.id, patch);
      if (!result.ok) {
        setActionError(`${t.errorOccurred}: ${result.error ?? 'Update failed'}`);
        return;
      }
      const next = await refreshOrder();
      if (!next) onClose();
    } catch (e) {
      setActionError(`${t.errorOccurred}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const acceptWithPrep = async (minutes: number) => {
    const nowIso = new Date().toISOString();
    const etaIso = new Date(Date.now() + minutes * 60_000).toISOString();
    await runUpdate({
      order_status: 'preparing',
      prep_started_at: nowIso,
      estimated_ready_at: etaIso,
    });
  };

  const confirmReject = async () => {
    if (!rejectReason) return;
    const reasonLabels: Record<string, string> = {
      item_unavailable: 'Item unavailable',
      too_busy: 'Kitchen is too busy right now',
      zone_issue: 'Outside our delivery zone',
      customer_request: 'Cancelled by customer request',
      other: rejectNote.trim() || 'Order cancelled',
    };
    await runUpdate({
      order_status: 'cancelled',
      cancellation_reason: reasonLabels[rejectReason] ?? 'Order cancelled',
    });
    setShowReject(false);
    setRejectReason('');
    setRejectNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="order-support-drawer">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
        aria-hidden
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-slate-900 shadow-2xl"
        data-testid="order-support-drawer-panel"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-start gap-2">
            <SourceIcon source={order.source} />
            <div>
              <p className="font-mono text-lg font-bold text-white">#{order.display_number ?? '—'}</p>
              <p className="text-xs text-slate-500">
                <Clock3 className="mr-1 inline h-3 w-3" />
                {fmtDateTime(order.created_at)}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(order.order_status)}`}
              >
                {orderStatusLabel(t, order.order_status)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-50"
            aria-label={t.cancel}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5" data-testid="order-support-drawer-content">
            {actionError ? (
              <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {actionError}
              </div>
            ) : null}

            {customerDisplay ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t.orderSupportColCustomer}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-100">
                  <User className="h-4 w-4 text-slate-400" />
                  {customerDisplay}
                </p>
                {order.customer_phone ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="h-3.5 w-3.5" />
                    {order.customer_phone}
                  </p>
                ) : null}
              </div>
            ) : order.customer_phone ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t.orderSupportColCustomer}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-100">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {order.customer_phone}
                </p>
              </div>
            ) : null}

            {order.source === 'online_delivery' && order.delivery_address ? (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-200/80">{t.woltCopyAddress}</p>
                <p className="mt-1 inline-flex items-start gap-2 text-sm text-blue-100">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  <span>{order.delivery_address}</span>
                </p>
                {order.delivery_notes ? (
                  <p className="mt-2 text-xs text-blue-200/90">
                    {t.woltCopyNotes}: {order.delivery_notes}
                  </p>
                ) : null}
              </div>
            ) : null}

            {(order.notes || order.admin_notes) && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                {order.notes ? <p className="whitespace-pre-wrap">{order.notes}</p> : null}
                {order.admin_notes ? (
                  <p className="mt-2 whitespace-pre-wrap text-slate-400">{order.admin_notes}</p>
                ) : null}
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{t.orderDetails}</p>
              <div data-testid="order-support-drawer-items">
                <OrderItemSummary items={order.sale_items ?? []} />
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t.orderSupportColTotal}</p>
                <p className="font-mono text-xl font-bold text-white">₼{Number(order.total_price ?? 0).toFixed(2)}</p>
                {order.delivery_fee != null && Number(order.delivery_fee) > 0 ? (
                  <p className="text-xs text-slate-500">
                    {t.deliveryZoneFieldFee}: ₼{Number(order.delivery_fee).toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>

            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cockpit-300 hover:text-cockpit-200"
              >
                <ExternalLink className="h-4 w-4" />
                {t.trackOnWolt}
              </a>
            ) : null}
          </div>

          {!isTerminal ? (
            <div className="border-t border-white/10 bg-slate-950/80 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t.orderSupportOrderActions}
              </p>
              {busy ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
                </div>
              ) : (
                <div className="space-y-3" data-testid="order-support-drawer-actions">
                  {isScheduledPending ? (
                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-xs text-amber-100/95">{t.orderSupportScheduledHint}</p>
                      <button
                        type="button"
                        onClick={() => window.open(getOrderAppUrl('/order-manager'), '_blank')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-500/30"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t.adminAccessGoToOrderManager}
                      </button>
                    </div>
                  ) : null}

                  {order.order_status === 'pending' && !isScheduledPending ? (
                    <>
                      {pendingPay ? (
                        <button
                          type="button"
                          onClick={() => void runUpdate(buildMarkPaidPatch(order))}
                          className="w-full rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/25"
                        >
                          {t.confirmPayment}
                        </button>
                      ) : null}
                      {!pendingPay ? (
                        <>
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {t.omPrepTime}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {PREP_OPTIONS.map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setPrepMinutes(v)}
                                  className={`min-h-[40px] min-w-[44px] rounded-md px-2 py-1.5 text-sm font-semibold transition-colors ${
                                    prepMinutes === v
                                      ? 'bg-cockpit-500 text-white'
                                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => void acceptWithPrep(prepMinutes)}
                              className="flex-1 rounded-lg bg-cockpit-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cockpit-500"
                            >
                              {t.omAccept}
                            </button>
                            <button
                              type="button"
                              onClick={() => void acceptWithPrep(15)}
                              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
                            >
                              {t.orderSupportPrepareQuick}
                            </button>
                          </div>
                        </>
                      ) : null}
                      {!showReject ? (
                        <button
                          type="button"
                          onClick={() => setShowReject(true)}
                          className="w-full text-left text-xs text-rose-400 underline underline-offset-2 hover:text-rose-300"
                        >
                          {t.omRejectOrder}
                        </button>
                      ) : (
                        <div className="space-y-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3">
                          <select
                            value={rejectReason}
                            onChange={(e) => {
                              setRejectReason(e.target.value);
                              if (e.target.value !== 'other') setRejectNote('');
                            }}
                            className="cockpit-select w-full"
                          >
                            <option value="" disabled>
                              {t.omRejectSelectReason}
                            </option>
                            <option value="item_unavailable">{t.omRejectReasonItemUnavailable}</option>
                            <option value="too_busy">{t.omRejectReasonTooBusy}</option>
                            <option value="zone_issue">{t.omRejectReasonZoneIssue}</option>
                            <option value="customer_request">{t.omRejectReasonCustomerRequest}</option>
                            <option value="other">{t.omRejectReasonOther}</option>
                          </select>
                          {rejectReason === 'other' ? (
                            <textarea
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value.slice(0, 200))}
                              placeholder={t.omRejectNotePlaceholder}
                              rows={2}
                              maxLength={200}
                              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cockpit-500 focus:outline-none"
                            />
                          ) : null}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowReject(false);
                                setRejectReason('');
                                setRejectNote('');
                              }}
                              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                            >
                              {t.omRejectCancel}
                            </button>
                            <button
                              type="button"
                              disabled={!rejectReason}
                              onClick={() => void confirmReject()}
                              className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                            >
                              {t.omRejectConfirm}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}

                  {order.order_status === 'preparing' ? (
                    <button
                      type="button"
                      onClick={() =>
                        void runUpdate({
                          order_status: 'ready',
                          ready_at: new Date().toISOString(),
                        })
                      }
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      {t.omMarkReady}
                    </button>
                  ) : null}

                  {order.order_status === 'ready' ? (
                    order.source === 'online_delivery' ? (
                      <button
                        type="button"
                        onClick={() =>
                          void runUpdate({
                            order_status: 'dispatched',
                            dispatched_at: new Date().toISOString(),
                          })
                        }
                        className="w-full rounded-lg bg-cockpit-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cockpit-500"
                      >
                        {t.omConfirmSelfDispatch}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void runUpdate({
                            order_status: 'completed',
                            completed_at: new Date().toISOString(),
                          })
                        }
                        className="w-full rounded-lg bg-cockpit-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cockpit-500"
                      >
                        {t.omPickedUp}
                      </button>
                    )
                  ) : null}

                  {order.order_status === 'dispatched' ? (
                    <button
                      type="button"
                      onClick={() =>
                        void runUpdate({
                          order_status: 'completed',
                          completed_at: new Date().toISOString(),
                        })
                      }
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      {t.omDelivered}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function AdminOrderSupportScreen() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  });

  const loadOrders = useCallback(async (): Promise<AdminOrder[]> => {
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .in('source', ORDER_SUPPORT_SOURCES)
      .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
      .lte('created_at', `${dateRange.end}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    let next: AdminOrder[] = [];
    if (data?.length) {
      const ids = data.map((s) => s.id);
      const { data: dels } = await supabase
        .from('delivery_orders')
        .select('sale_id, status, tracking_url, wolt_delivery_id, manually_dispatched')
        .in('sale_id', ids);
      const map = new Map((dels ?? []).map((d) => [d.sale_id as string, d]));
      next = data.map((s) => ({
        ...s,
        delivery_order: map.get(s.id) ?? null,
      })) as AdminOrder[];
      setOrders(next);
    } else {
      setOrders([]);
    }
    setLoading(false);
    return next;
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    void loadOrders();
    const channel = supabase.channel('admin-order-support');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      () => void loadOrders(),
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const refreshSelectedOrder = useCallback(async (): Promise<AdminOrder | null> => {
    const id = selectedOrder?.id;
    if (!id) return null;
    const list = await loadOrders();
    const next = list.find((o) => o.id === id) ?? null;
    setSelectedOrder(next);
    return next;
  }, [loadOrders, selectedOrder?.id]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === 'active') {
        if (!['pending', 'preparing', 'ready'].includes(o.order_status)) return false;
      } else if (statusFilter !== 'all') {
        if (o.order_status !== statusFilter) return false;
      }

      if (sourceFilter !== 'all') {
        if (sourceFilter === 'pos') {
          if (!POS_SOURCES.includes(o.source as PosSource)) return false;
        } else if (o.source !== sourceFilter) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesNumber = String(o.display_number ?? '').toLowerCase().includes(q);
        const matchesPhone = String(o.customer_phone ?? '').toLowerCase().includes(q);
        const matchesName = String(o.customer_name ?? '').toLowerCase().includes(q);
        if (!matchesNumber && !matchesPhone && !matchesName) return false;
      }

      return true;
    });
  }, [orders, statusFilter, sourceFilter, search]);

  const filterLabel = (f: StatusFilter): string => {
    switch (f) {
      case 'all':
        return t.orderSupportFilter_all;
      case 'active':
        return t.orderSupportFilter_active;
      case 'dispatched':
        return t.orderSupportFilter_dispatched;
      case 'completed':
        return t.orderSupportFilter_completed;
      case 'cancelled':
        return t.orderSupportFilter_cancelled;
    }
  };

  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        eyebrow={t.operations}
        title={t.orderSupport}
        description={t.orderSupportDescription}
        icon={ClipboardList}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.open(getOrderAppUrl('/order'), '_blank')}
              className="cockpit-btn-ghost inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              {t.orderSupportOpenOrderPage}
            </button>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cockpit-400"
              aria-label={t.orderSupportOrdersFound}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-cockpit-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
          className="cockpit-select h-11 min-w-[180px]"
        >
          <option value="all">{t.orderSupportSourceAll}</option>
          <option value="kiosk">{t.omSourceKiosk}</option>
          <option value="pos">{t.omSourcePos}</option>
          <option value="online_delivery">{t.omSourceDelivery}</option>
          <option value="online_takeaway">{t.omSourceTakeaway}</option>
        </select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.orderSupportSearch}
            className="w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
          />
        </div>

        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onStartChange={(start) => setDateRange((prev) => ({ ...prev, start }))}
          onEndChange={(end) => setDateRange((prev) => ({ ...prev, end }))}
          startLabel={t.startDate}
          endLabel={t.endDate}
        />
      </div>

      <p className="text-sm text-slate-500">
        {filteredOrders.length} {t.orderSupportOrdersFound}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-cockpit-400" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-500">{t.orderSupportNoOrders}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>#</span>
            <span>{t.orderSupportColTime}</span>
            <span>{t.orderSupportColCustomer}</span>
            <span>{t.orderSupportColItems}</span>
            <span>{t.orderSupportColTotal}</span>
            <span>{t.orderSupportColStatus}</span>
            <span></span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                data-order-row
                data-order-id={order.id}
                onClick={() => setSelectedOrder(order)}
                className="grid w-full grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-1.5">
                  <SourceIcon source={order.source} />
                  <span className="font-mono text-xs font-bold text-white">#{order.display_number ?? '—'}</span>
                </div>

                <span className="text-xs text-slate-400">{fmtTime(order.created_at)}</span>

                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-300">
                    {order.customer_name || order.customer_phone || '—'}
                  </p>
                  {order.customer_phone && order.customer_name && (
                    <p className="truncate text-[11px] text-slate-600">{order.customer_phone}</p>
                  )}
                </div>

                <span className="truncate text-xs text-slate-400">{itemsSummary(order.sale_items)}</span>

                <span className="font-mono text-xs font-semibold text-white">
                  ₼{Number(order.total_price ?? 0).toFixed(2)}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(order.order_status)}`}
                >
                  {orderStatusLabel(t, order.order_status)}
                </span>

                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOrder ? (
        <OrderSupportOrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          refreshOrder={refreshSelectedOrder}
        />
      ) : null}
    </div>
  );
}
