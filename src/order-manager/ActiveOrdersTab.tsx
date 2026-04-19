import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { InDeliveryCard } from './InDeliveryCard';
import { InProgressCard } from './InProgressCard';
import { NewOrderCard } from './NewOrderCard';
import { ReadyCard } from './ReadyCard';
import { ScheduledOrderCard } from './ScheduledOrderCard';
import type { OrderManagerOrder } from './types';

interface ActiveOrdersTabProps {
  accessToken: string | null;
}

type NewSubTab = 'new' | 'scheduled';
type ReadySubTab = 'ready' | 'delivery';

const WOLT_PORTAL_BASE =
  (import.meta.env.VITE_WOLT_PORTAL_URL as string | undefined)?.replace(/\/$/, '') || 'https://portal.wolt.com';

function emptyState(label: string) {
  return <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-400">{label}</p>;
}

export function ActiveOrdersTab({ accessToken }: ActiveOrdersTabProps) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubTab, setNewSubTab] = useState<NewSubTab>('new');
  const [readySubTab, setReadySubTab] = useState<ReadySubTab>('ready');
  const [nowMs, setNowMs] = useState(Date.now());
  const [channelHealth, setChannelHealth] = useState('CONNECTING');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [channelRef, setChannelRef] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);

  const playNewOrderRingtone = useCallback(() => {
    try {
      if (!ringtoneCtxRef.current) {
        ringtoneCtxRef.current = new AudioContext();
      }
      const ctx = ringtoneCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const scheduleTone = (frequency: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const startAt = ctx.currentTime + startOffset;
        const endAt = startAt + duration;
        gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        osc.start(startAt);
        osc.stop(endAt + 0.02);
      };
      scheduleTone(880, 0, 0.25);
      scheduleTone(988, 0.3, 0.25);
    } catch {
      // audio can fail on restricted browsers until user interacts
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!initialLoadDone) setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .in('source', ['kiosk', 'online_delivery', 'online_takeaway'])
      .in('order_status', ['pending', 'preparing', 'ready', 'dispatched'])
      .order('created_at', { ascending: true });

    if (!data?.length) {
      setOrders([]);
      setLoading(false);
      setInitialLoadDone(true);
      return;
    }

    const saleIds = data.map((row) => row.id);
    const { data: deliveryRows } = await supabase
      .from('delivery_orders')
      .select('sale_id, status, tracking_url, wolt_delivery_id, manually_dispatched')
      .in('sale_id', saleIds);
    const deliveryMap = new Map((deliveryRows ?? []).map((row) => [String(row.sale_id), row]));

    setOrders(
      data.map((row) => ({
        ...row,
        delivery_order: deliveryMap.get(String(row.id)) ?? null,
      })) as OrderManagerOrder[]
    );
    setLoading(false);
    setInitialLoadDone(true);
  }, [initialLoadDone]);

  const updateSale = useCallback(async (orderId: string, patch: Record<string, unknown>) => {
    setBusyOrderId(orderId);
    await supabase.from('sales').update(patch).eq('id', orderId);
    setBusyOrderId(null);
    await loadOrders();
  }, [loadOrders]);

  const acceptNew = useCallback(
    async (orderId: string, prepMinutes: number) => {
      const nowIso = new Date().toISOString();
      const etaIso = new Date(Date.now() + prepMinutes * 60_000).toISOString();
      await updateSale(orderId, {
        order_status: 'preparing',
        prep_started_at: nowIso,
        estimated_ready_at: etaIso,
      });
    },
    [updateSale]
  );

  const acceptScheduled = useCallback(
    async (order: OrderManagerOrder, reminderMinutes: number) => {
      if (!order.scheduled_for) return;
      const reminderAt = new Date(new Date(order.scheduled_for).getTime() - reminderMinutes * 60_000).toISOString();
      await updateSale(order.id, { reminder_at: reminderAt });
    },
    [updateSale]
  );

  const promoteDueScheduled = useCallback(async () => {
    const pendingScheduled = orders.filter((o) => o.order_status === 'pending' && o.scheduled_for && o.reminder_at);
    if (pendingScheduled.length === 0) return;
    const due = pendingScheduled.filter((o) => new Date(o.reminder_at as string).getTime() <= Date.now());
    if (due.length === 0) return;

    for (const order of due) {
      const nowIso = new Date().toISOString();
      const estimated = order.scheduled_for ?? nowIso;
      await supabase
        .from('sales')
        .update({
          order_status: 'preparing',
          prep_started_at: nowIso,
          estimated_ready_at: estimated,
        })
        .eq('id', order.id)
        .eq('order_status', 'pending');
    }
    await loadOrders();
  }, [loadOrders, orders]);

  useEffect(() => {
    void loadOrders();
    const channel = supabase.channel('order-manager-active');
    setChannelRef(channel);
    for (const src of ['kiosk', 'online_delivery', 'online_takeaway'] as const) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `source=eq.${src}` },
        () => void loadOrders()
      );
    }
    channel.subscribe((status) => {
      setChannelHealth(status);
    });
    return () => {
      setChannelRef(null);
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const reconnectRealtime = useCallback(() => {
    if (channelRef) {
      channelRef.subscribe((status) => {
        setChannelHealth(status);
      });
      return;
    }
    void loadOrders();
  }, [channelRef, loadOrders]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void promoteDueScheduled();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [promoteDueScheduled]);

  const grouped = useMemo(() => {
    const newOrders = orders.filter((o) => o.order_status === 'pending' && !o.scheduled_for);
    const scheduledOrders = orders.filter((o) => o.order_status === 'pending' && o.scheduled_for);
    const preparingOrders = orders.filter((o) => o.order_status === 'preparing');
    const readyOrders = orders.filter((o) => o.order_status === 'ready');
    const deliveryOrders = orders.filter((o) => o.order_status === 'dispatched');
    return { newOrders, scheduledOrders, preparingOrders, readyOrders, deliveryOrders };
  }, [orders]);

  useEffect(() => {
    if (grouped.newOrders.length > 0) {
      playNewOrderRingtone();
      if (ringtoneIntervalRef.current == null) {
        ringtoneIntervalRef.current = window.setInterval(() => {
          playNewOrderRingtone();
        }, 10_000);
      }
      return;
    }
    if (ringtoneIntervalRef.current != null) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, [grouped.newOrders.length, playNewOrderRingtone]);

  useEffect(() => {
    return () => {
      if (ringtoneIntervalRef.current != null) {
        window.clearInterval(ringtoneIntervalRef.current);
        ringtoneIntervalRef.current = null;
      }
      if (ringtoneCtxRef.current) {
        void ringtoneCtxRef.current.close();
        ringtoneCtxRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-cockpit-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {channelHealth !== 'SUBSCRIBED' ? (
        <button
          type="button"
          onClick={reconnectRealtime}
          className="flex w-full items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-left text-xs font-semibold text-red-200 hover:bg-red-500/20"
        >
          <WifiOff className="h-4 w-4" />
          {t.kdsConnectionLostBanner}
        </button>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-3">
        <section className="cockpit-panel rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-cockpit-300">
              {t.omNewOrders} ({newSubTab === 'new' ? grouped.newOrders.length : grouped.scheduledOrders.length})
            </p>
            <div className="rounded-lg bg-white/5 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setNewSubTab('new')}
                className={`rounded-md px-2 py-1 ${newSubTab === 'new' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
              >
                {t.new}
              </button>
              <button
                type="button"
                onClick={() => setNewSubTab('scheduled')}
                className={`rounded-md px-2 py-1 ${newSubTab === 'scheduled' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
              >
                {t.omScheduledOrders}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {newSubTab === 'new'
              ? grouped.newOrders.map((order) => (
                  <NewOrderCard
                    key={order.id}
                    order={order}
                    disabled={busyOrderId === order.id}
                    onMarkPaid={() => void updateSale(order.id, { payment_status: 'paid' })}
                    onAccept={(minutes) => void acceptNew(order.id, minutes)}
                  />
                ))
              : grouped.scheduledOrders.map((order) => (
                  <ScheduledOrderCard
                    key={order.id}
                    order={order}
                    disabled={busyOrderId === order.id}
                    onAccept={(minutes) => void acceptScheduled(order, minutes)}
                  />
                ))}
            {(newSubTab === 'new' && grouped.newOrders.length === 0 && emptyState(t.omNoActiveOrders)) ||
              (newSubTab === 'scheduled' && grouped.scheduledOrders.length === 0 && emptyState(t.omNoScheduledOrders))}
          </div>
        </section>

        <section className="cockpit-panel rounded-xl p-3">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cockpit-300">
            {t.omInProgress} ({grouped.preparingOrders.length})
          </p>
          <div className="space-y-2">
            {grouped.preparingOrders.map((order) => (
              <InProgressCard
                key={order.id}
                order={order}
                nowMs={nowMs}
                disabled={busyOrderId === order.id}
                onReady={() => void updateSale(order.id, { order_status: 'ready', ready_at: new Date().toISOString() })}
              />
            ))}
            {grouped.preparingOrders.length === 0 ? emptyState(t.omNoActiveOrders) : null}
          </div>
        </section>

        <section className="cockpit-panel rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-cockpit-300">
              {t.omReady} ({readySubTab === 'ready' ? grouped.readyOrders.length : grouped.deliveryOrders.length})
            </p>
            <div className="rounded-lg bg-white/5 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setReadySubTab('ready')}
                className={`rounded-md px-2 py-1 ${readySubTab === 'ready' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
              >
                {t.omReady}
              </button>
              <button
                type="button"
                onClick={() => setReadySubTab('delivery')}
                className={`rounded-md px-2 py-1 ${readySubTab === 'delivery' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
              >
                {t.omInDelivery}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {readySubTab === 'ready'
              ? grouped.readyOrders.map((order) => (
                  <ReadyCard
                    key={order.id}
                    order={order}
                    accessToken={accessToken}
                    woltPortalBase={WOLT_PORTAL_BASE}
                    onPickedUp={() => void updateSale(order.id, { order_status: 'completed' })}
                    onDispatched={() => void loadOrders()}
                  />
                ))
              : grouped.deliveryOrders.map((order) => (
                  <InDeliveryCard
                    key={order.id}
                    order={order}
                    onDelivered={() => void updateSale(order.id, { order_status: 'completed' })}
                  />
                ))}
            {(readySubTab === 'ready' && grouped.readyOrders.length === 0 && emptyState(t.omNoActiveOrders)) ||
              (readySubTab === 'delivery' && grouped.deliveryOrders.length === 0 && emptyState(t.omNoActiveOrders))}
          </div>
        </section>
      </div>
    </div>
  );
}
