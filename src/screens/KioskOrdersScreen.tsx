import { useState, useEffect, useCallback } from 'react';
import { Monitor, RefreshCw, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getOrderAppUrl } from '../lib/surfaceRouting';
import { PageHeader } from '../components/cockpit';
import { KioskOrdersBoard, type KioskOrder, type KioskOrderStatus } from '../components/kiosk';
import { DateRangePicker } from '../components/DateRangePicker';

export function KioskOrdersScreen() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
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
        .select('sale_id, status, tracking_url, wolt_delivery_id, manually_dispatched')
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
    channel.subscribe((status) => {
      setRealtimeConnected(status === 'SUBSCRIBED');
    });

    return () => {
      setRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: KioskOrderStatus) => {
    const updates: Record<string, unknown> = { order_status: newStatus };
    if (newStatus === 'preparing') updates.prep_started_at = new Date().toISOString();
    if (newStatus === 'ready') updates.ready_at = new Date().toISOString();
    const { error } = await supabase.from('sales').update(updates).eq('id', orderId);
    if (error) throw new Error(error.message);
    await loadOrders();
  };

  const handleConfirmPayment = async (orderId: string) => {
    const { error } = await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', orderId);
    if (error) throw new Error(error.message);
    await loadOrders();
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.operations}
        title={t.kioskOrders}
        description="Kanban board — drag orders between columns to update status."
        icon={Monitor}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.open(getOrderAppUrl('/'), '_blank')}
              className="cockpit-btn-ghost rounded-xl border border-slate-200 dark:border-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Online order
            </button>
            <button
              type="button"
              onClick={() => window.open(`/kiosk?key=${import.meta.env.VITE_KIOSK_SECRET || ''}`, '_blank')}
              className="cockpit-btn-ghost rounded-xl border border-slate-200 dark:border-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              {t.viewKiosk}
            </button>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cockpit-400"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div className="mb-6">
        <label className="cockpit-label mb-2 block">{t.date}</label>
        <div className="max-w-sm">
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
        orders={orders}
        loading={loading}
        emptyMessage={t.noKioskOrders}
        onStatusChange={handleUpdateStatus}
        onConfirmPayment={handleConfirmPayment}
        staffAccessToken={session?.access_token ?? null}
        onReload={loadOrders}
        realtimeConnected={realtimeConnected}
      />
    </div>
  );
}
