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
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';
import { DateRangePicker } from '../components/DateRangePicker';
import { getOrderAppUrl } from '../lib/surfaceRouting';

type OrderSupportStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

type OrderSource = 'kiosk' | 'online_delivery' | 'online_takeaway';

interface SaleItem {
  id: string;
  product_name?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  is_combo?: boolean | null;
  sale_item_modifiers?: Array<{
    id: string;
    modifier_name?: string | null;
  }> | null;
}

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
  track_token?: string | null;
  sale_items?: SaleItem[] | null;
  delivery_order?: DeliveryOrder | null;
}

type StatusFilter = 'all' | 'active' | 'dispatched' | 'completed' | 'cancelled';
type SourceFilter = 'all' | OrderSource;

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'active',
  'dispatched',
  'completed',
  'cancelled',
];

function fmtTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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

function SourceIcon({ source }: { source: OrderSource }) {
  if (source === 'online_delivery') return <Truck className="h-3.5 w-3.5 text-blue-400" />;
  if (source === 'online_takeaway') return <ShoppingBag className="h-3.5 w-3.5 text-cockpit-400" />;
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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .in('source', ['kiosk', 'online_delivery', 'online_takeaway'])
      .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
      .lte('created_at', `${dateRange.end}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    if (data?.length) {
      const ids = data.map((s) => s.id);
      const { data: dels } = await supabase
        .from('delivery_orders')
        .select('sale_id, status, tracking_url, wolt_delivery_id, manually_dispatched')
        .in('sale_id', ids);
      const map = new Map((dels ?? []).map((d) => [d.sale_id as string, d]));
      const merged = data.map((s) => ({
        ...s,
        delivery_order: map.get(s.id) ?? null,
      })) as AdminOrder[];
      setOrders(merged);
    } else {
      setOrders([]);
    }
    setLoading(false);
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

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === 'active') {
        if (!['pending', 'preparing', 'ready'].includes(o.order_status)) return false;
      } else if (statusFilter !== 'all') {
        if (o.order_status !== statusFilter) return false;
      }

      if (sourceFilter !== 'all' && o.source !== sourceFilter) return false;

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
                statusFilter === f
                  ? 'bg-cockpit-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
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
                onClick={() => setSelectedOrder(order)}
                className="grid w-full grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-1.5">
                  <SourceIcon source={order.source} />
                  <span className="font-mono text-xs font-bold text-white">
                    #{order.display_number ?? '—'}
                  </span>
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

                <span className="truncate text-xs text-slate-400">
                  {itemsSummary(order.sale_items)}
                </span>

                <span className="font-mono text-xs font-semibold text-white">
                  ₼{Number(order.total_price ?? 0).toFixed(2)}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(order.order_status)}`}
                >
                  {order.order_status}
                </span>

                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
            aria-hidden
          />
          <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-mono text-lg font-bold text-white">
                  #{selectedOrder.display_number ?? '—'}
                </p>
                <p className="text-xs text-slate-500">{fmtTime(selectedOrder.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                aria-label={t.cancel}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="py-8 text-center text-sm text-slate-400">
                {t.orderSupportDrawerComingSoon}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
