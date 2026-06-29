import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getCustomerDisplayName, type OrderManagerOrder } from './types';
import { ALL_KITCHEN_SOURCES } from '../pos/posSources';
import { PosReprintButton } from '../pos/PosReprintButton';

type PastPreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth';
type PastStatus = 'all' | 'ready' | 'completed' | 'dispatched' | 'cancelled';

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildRange(preset: PastPreset): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === 'today') return { start: toIsoDate(start), end: toIsoDate(end) };
  if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }
  if (preset === 'thisMonth') {
    start.setDate(1);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }

  // lastMonth
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(firstThisMonth.getTime() - 24 * 60 * 60 * 1000);
  return { start: toIsoDate(firstLastMonth), end: toIsoDate(endLastMonth) };
}

function statusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-200';
    case 'cancelled':
      return 'bg-rose-500/20 text-rose-200';
    case 'dispatched':
      return 'bg-sky-500/20 text-sky-200';
    default:
      return 'bg-slate-500/20 text-slate-200';
  }
}

function statusLabel(status: string, t: ReturnType<typeof useLanguage>['t']): string {
  switch (status) {
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
      return t.pending;
  }
}

export function PastOrdersTab({ showReprint = false }: { showReprint?: boolean } = {}) {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<PastPreset>('today');
  const [statusFilter, setStatusFilter] = useState<PastStatus>('all');
  const [orders, setOrders] = useState<OrderManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const range = useMemo(() => buildRange(preset), [preset]);
  const selectedStatuses = useMemo(
    () =>
      statusFilter === 'all'
        ? (['ready', 'completed', 'cancelled', 'dispatched'] as const)
        : ([statusFilter] as const),
    [statusFilter]
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sales')
        .select('*, sale_items(*, sale_item_modifiers(*))')
        .in('source', [...ALL_KITCHEN_SOURCES])
        .gte('sale_date', range.start)
        .lte('sale_date', `${range.end}T23:59:59`)
        .in('order_status', [...selectedStatuses])
        .order('created_at', { ascending: false });
      setOrders((data ?? []) as OrderManagerOrder[]);
      setLoading(false);
    })();
  }, [range.end, range.start, selectedStatuses]);

  const presetButtons: Array<{ id: PastPreset; label: string }> = [
    { id: 'today', label: t.omToday },
    { id: 'yesterday', label: t.omYesterday },
    { id: 'last7', label: t.omLast7Days },
    { id: 'thisMonth', label: t.omThisMonth },
    { id: 'lastMonth', label: t.omLastMonth },
  ];
  const statusButtons: Array<{ id: PastStatus; label: string }> = [
    { id: 'all', label: t.omAll },
    { id: 'ready', label: t.omReady },
    { id: 'completed', label: t.completed },
    { id: 'dispatched', label: t.dispatched },
    { id: 'cancelled', label: t.cancelled },
  ];
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0),
    [orders]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {presetButtons.map((button) => (
            <button
              key={button.id}
              type="button"
              onClick={() => setPreset(button.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                preset === button.id ? 'bg-cockpit-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">{t.periodRevenue}</p>
          <p className="text-sm font-bold text-emerald-100">₼{totalRevenue.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {statusButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => setStatusFilter(button.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              statusFilter === button.id ? 'bg-cockpit-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-slate-400">{t.pleaseWait}</p> : null}

      {!loading && orders.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-400">{t.omNoPastOrders}</p>
      ) : null}

      <div className="space-y-2">
        {orders.map((order) => {
          const status = String(order.order_status ?? 'pending');
          const customerDisplay = getCustomerDisplayName(order);
          const source =
            order.source === 'online_delivery'
              ? t.omSourceDelivery
              : order.source === 'online_takeaway'
                ? t.omSourceTakeaway
                : order.source === 'pos_eat_in'
                  ? t.posSourceEatIn
                  : order.source === 'pos_takeaway'
                    ? t.posSourceTakeaway
                    : order.source === 'pos_delivery'
                      ? t.posSourceDelivery
                      : t.omSourceKiosk;
          const ts = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isOpen = Boolean(expanded[order.id]);
          return (
            <article key={order.id} className="neon-card rounded-xl border border-white/10 p-3">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [order.id]: !isOpen }))}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <span className="font-mono text-sm text-white">#{order.display_number ?? '—'}</span>
                  <span className="text-xs text-slate-400">{ts}</span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">{source}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusClass(status)}`}>
                    {statusLabel(status, t)}
                  </span>
                </div>
                <span className="text-xs text-slate-300">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
              </button>
              {isOpen ? (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-300">
                  <ul className="space-y-1">
                    {(order.sale_items ?? []).map((item) => (
                      <li key={item.id}>
                        {item.quantity}x {item.product_name}
                        {item.sale_item_modifiers && item.sale_item_modifiers.length > 0 ? (
                          <span className="text-slate-500">
                            {' '}
                            — {item.sale_item_modifiers.map((m) => m.modifier_option_name).join(', ')}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {customerDisplay ? (
                    <p>
                      {t.woltCopyCustomer}: {customerDisplay}
                    </p>
                  ) : null}
                  {order.customer_phone ? <p>{order.customer_phone}</p> : null}
                  {order.delivery_address ? <p>{order.delivery_address}</p> : null}
                  {order.delivery_notes ? <p>{order.delivery_notes}</p> : null}
                  {showReprint ? <PosReprintButton order={order} /> : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
