import { useState, useEffect, useRef, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SecretGate } from '../components/SecretGate';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { supabase, Sale, SaleItem } from '../lib/supabase';
import { KdsHeader } from './KdsHeader';
import { OrderCard } from './OrderCard';

interface KioskOrder extends Sale {
  sale_items: SaleItem[];
}

function KdsContent() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [now, setNow] = useState(Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting'>('reconnecting');
  const [channelHealth, setChannelHealth] = useState<string>('CONNECTING');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // audio not available
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .in('source', ['kiosk', 'online_delivery', 'online_takeaway'])
      .in('order_status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (data) {
      setOrders(data as KioskOrder[]);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    loadOrders();

    const channel = supabase.channel('kds-orders');
    channelRef.current = channel;
    for (const src of ['kiosk', 'online_delivery', 'online_takeaway'] as const) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales', filter: `source=eq.${src}` },
        () => {
          playBeep();
          loadOrders();
        }
      );
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sales', filter: `source=eq.${src}` },
        () => {
          loadOrders();
        }
      );
    }
    channel.subscribe((status) => {
      setChannelHealth(status);
      setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'reconnecting');
    });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [loadOrders, playBeep]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    opts?: { prepMinutes?: number }
  ) => {
    const updates: Record<string, unknown> = { order_status: newStatus };
    if (newStatus === 'preparing') {
      updates.prep_started_at = new Date().toISOString();
      if (opts?.prepMinutes != null) {
        updates.estimated_ready_at = new Date(Date.now() + opts.prepMinutes * 60_000).toISOString();
      }
    }
    if (newStatus === 'ready') {
      updates.ready_at = new Date().toISOString();
    }

    await supabase.from('sales').update(updates).eq('id', orderId);
    loadOrders();
  };

  const reconnectRealtime = () => {
    const ch = channelRef.current;
    if (ch) {
      ch.subscribe();
    } else {
      void loadOrders();
    }
  };

  const pendingCount = orders.filter((o) => o.order_status === 'pending').length;
  const preparingCount = orders.filter((o) => o.order_status === 'preparing').length;
  const readyCount = orders.filter((o) => o.order_status === 'ready').length;

  const showOfflineBanner = channelHealth !== 'SUBSCRIBED';

  return (
    <div className="neon-shell fixed inset-0 flex flex-col overflow-hidden">
      {showOfflineBanner ? (
        <button
          type="button"
          onClick={() => reconnectRealtime()}
          className="flex h-12 w-full shrink-0 items-center justify-center gap-2 bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600"
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
          {t.kdsConnectionLostBanner}
        </button>
      ) : null}
      <KdsHeader
        pendingCount={pendingCount}
        preparingCount={preparingCount}
        readyCount={readyCount}
        realtimeStatus={realtimeStatus}
        now={now}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xl text-slate-400">{t.noKioskOrders}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                now={now}
                ordersInPrepCount={preparingCount}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function KitchenDisplay() {
  const secret = import.meta.env.VITE_KDS_SECRET || '';

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SecretGate secretKey={secret}>
          <KdsContent />
        </SecretGate>
        <Analytics />
      </LanguageProvider>
    </ThemeProvider>
  );
}
