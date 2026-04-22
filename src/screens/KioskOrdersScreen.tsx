import { useState, useEffect, useCallback, useMemo } from 'react';
import { Monitor, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';
import { KioskOrdersBoard, type KioskOrder, type KioskOrderStatus } from '../components/kiosk';
import { DateRangePicker } from '../components/DateRangePicker';
import { getPublicKioskEntryUrl, getPublicOrderUrl } from '../lib/surfaceHost';

export function KioskOrdersScreen() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'kiosk' | 'online_delivery' | 'online_takeaway'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
      .gte('sale_date', dateRange.start)
      .lte('sale_date', `${dateRange.end}T23:59:59`)
      .order('created_at', { ascending: false });

    if (data?.length) {
      const ids = data.map((s) => s.id);
      const { data: dels } = await supabase
        .from('delivery_orders')
        .select('sale_id, status, tracking_url, wolt_delivery_id, wolt_booking_locked_until')
        .in('sale_id', ids);
      const map = new Map((dels ?? []).map((d) => [d.sale_id as string, d]));
      const merged = data.map((s) => ({
        ...s,
        delivery_order: map.get(s.id) ?? null,
      })) as KioskOrder[];
      setOrders(merged);
    } else {
      setOrders([]);
    }
    setLoading(false);
  }, [dateRange.end, dateRange.start]);

  useEffect(() => {
    void loadOrders();

    const channel = supabase.channel('admin-kiosk-orders');
    for (const src of ['kiosk', 'online_delivery', 'online_takeaway'] as const) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `source=eq.${src}` },
        () => void loadOrders()
      );
    }
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'delivery_orders' },
      () => void loadOrders()
    );
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: KioskOrderStatus) => {
    const updates: Record<string, unknown> = { order_status: newStatus };
    if (newStatus === 'preparing') updates.prep_started_at = new Date().toISOString();
    if (newStatus === 'ready') updates.ready_at = new Date().toISOString();
    await supabase.from('sales').update(updates).eq('id', orderId);
    await loadOrders();
  };

  const handleConfirmPayment = async (orderId: string) => {
    await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', orderId);
    await loadOrders();
  };

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const inQueue = orders.filter((order) => ['pending', 'preparing', 'ready'].includes(order.order_status ?? 'pending')).length;
    const awaitingPayment = orders.filter((order) => ['unpaid', 'pending'].includes(order.payment_status ?? 'paid')).length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
    return { totalOrders, inQueue, awaitingPayment, totalRevenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (sourceFilter !== 'all' && order.source !== sourceFilter) {
        return false;
      }

      if (paymentFilter !== 'all') {
        const isUnpaid = ['unpaid', 'pending'].includes(order.payment_status ?? 'paid');
        if (paymentFilter === 'unpaid' && !isUnpaid) return false;
        if (paymentFilter === 'paid' && isUnpaid) return false;
      }

      if (!needle) return true;

      const displayNumber = String(order.display_number ?? '').toLowerCase();
      const customerPhone = String(order.customer_phone ?? '').toLowerCase();
      const fallbackId = String(order.id ?? '').toLowerCase();
      return displayNumber.includes(needle) || customerPhone.includes(needle) || fallbackId.includes(needle);
    });
  }, [orders, sourceFilter, paymentFilter, searchQuery]);

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader
        eyebrow={t.operations}
        title={t.orderManagerTitle}
        description={t.orderManagerDescription}
        icon={Monitor}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.open(getPublicOrderUrl(), '_blank')}
              className="cockpit-btn-ghost rounded-xl border border-slate-200 dark:border-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              {t.openOnlineOrder}
            </button>
            <button
              type="button"
              onClick={() => window.open(getPublicKioskEntryUrl(), '_blank')}
              className="cockpit-btn-ghost rounded-xl border border-slate-200 dark:border-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              {t.viewKiosk}
            </button>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cockpit-400"
              aria-label={t.refreshOrders}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/20 via-violet-400/5 to-transparent p-4 dark:border-violet-400/25">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">{t.totalOrders}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.totalOrders}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-sky-300/40 bg-gradient-to-br from-sky-500/20 via-sky-400/5 to-transparent p-4 dark:border-sky-400/25">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-200">{t.ordersInQueue}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.inQueue}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-500/20 via-amber-400/5 to-transparent p-4 dark:border-amber-400/25">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">{t.awaitingPayment}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{stats.awaitingPayment}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/20 via-emerald-400/5 to-transparent p-4 dark:border-emerald-400/25">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">{t.todayRevenue}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">₼{stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/45 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none ring-cockpit-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            placeholder={t.searchOrderManagerPlaceholder}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{t.orderSource}</span>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
            className="cockpit-select h-11 w-full"
          >
            <option value="all">{t.allSources}</option>
            <option value="kiosk">{t.kiosk}</option>
            <option value="online_delivery">{t.onlineDelivery}</option>
            <option value="online_takeaway">{t.onlineTakeaway}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{t.payment}</span>
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)}
            className="cockpit-select h-11 w-full"
          >
            <option value="all">{t.allPayments}</option>
            <option value="unpaid">{t.unpaidOnly}</option>
            <option value="paid">{t.paidOnly}</option>
          </select>
        </label>

        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{t.date}</span>
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onStartChange={(start) => setDateRange((prev) => ({ ...prev, start }))}
            onEndChange={(end) => setDateRange((prev) => ({ ...prev, end }))}
            startLabel={t.startDate}
            endLabel={t.endDate}
          />
        </div>
      </div>

      <KioskOrdersBoard
        orders={filteredOrders}
        loading={loading}
        emptyMessage={t.noKioskOrders}
        onStatusChange={handleUpdateStatus}
        onConfirmPayment={handleConfirmPayment}
        staffAccessToken={null}
        onReload={loadOrders}
      />
    </div>
  );
}
