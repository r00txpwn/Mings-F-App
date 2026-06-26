import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { Analytics } from '@vercel/analytics/react';

import { Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from '../contexts/AuthContext';

import { ThemeProvider } from '../contexts/ThemeContext';

import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

import { supabase } from '../lib/supabase';

import { LoginScreen } from '../screens/LoginScreen';

import { StaffAccessDeniedScreen } from '../screens/StaffAccessDeniedScreen';

import { KdsHeader } from './KdsHeader';

import { KdsBoard } from './KdsBoard';

import { KdsHistoryDrawer } from './KdsHistoryDrawer';

import { KdsUndoToast } from './KdsUndoToast';

import {

  applyKdsFilters,

  type KdsKitchenOrder,

  type KdsSourceFilter,

} from './kdsBoardUtils';

import { ALL_KITCHEN_SOURCES } from '../pos/posSources';

const UNDO_MS = 5000;



type UndoSnapshot = {

  order: KdsKitchenOrder;

  timeoutId: ReturnType<typeof setTimeout>;

};



function KdsContent({ onSignOut }: { onSignOut: () => void }) {

  const { t } = useLanguage();

  const [orders, setOrders] = useState<KdsKitchenOrder[]>([]);

  const [now, setNow] = useState(Date.now());

  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting'>('reconnecting');

  const [channelHealth, setChannelHealth] = useState<string>('CONNECTING');

  const [actionError, setActionError] = useState<string | null>(null);

  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<string>>(() => new Set());

  const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(() => new Set());

  const [sourceFilter, setSourceFilter] = useState<KdsSourceFilter>('all');

  const [searchQuery, setSearchQuery] = useState('');

  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);

  const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [historyOrders, setHistoryOrders] = useState<KdsKitchenOrder[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const undoRef = useRef<UndoSnapshot | null>(null);

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



  const clearUndo = useCallback(() => {

    const snap = undoRef.current;

    if (snap) {

      clearTimeout(snap.timeoutId);

      undoRef.current = null;

    }

    setUndoSnapshot(null);

    setUndoSecondsLeft(0);

  }, []);



  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .in('source', [...ALL_KITCHEN_SOURCES])
      .in('order_status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (data) {
      setOrders(data as KdsKitchenOrder[]);
    }
  }, []);



  const loadCompletedToday = useCallback(async () => {

    setHistoryLoading(true);

    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    const { data } = await supabase

      .from('sales')

      .select('*, sale_items(*, sale_item_modifiers(*))')

      .in('source', [...ALL_KITCHEN_SOURCES])

      .eq('order_status', 'completed')

      .gte('ready_at', startOfDay.toISOString())

      .order('ready_at', { ascending: false })

      .limit(50);



    setHistoryOrders((data as KdsKitchenOrder[]) ?? []);

    setHistoryLoading(false);

  }, []);



  useEffect(() => {

    document.documentElement.classList.add('dark');

    loadOrders();



    const channel = supabase.channel('kds-orders');

    channelRef.current = channel;

    for (const src of ALL_KITCHEN_SOURCES) {

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

    channel.on(

      'postgres_changes',

      { event: 'UPDATE', schema: 'public', table: 'sale_items' },

      () => {

        loadOrders();

      }

    );

    channel.subscribe((status) => {

      setChannelHealth(status);

      setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'reconnecting');

      if (status === 'SUBSCRIBED') {

        void loadOrders();

      }

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



  useEffect(() => {

    if (!undoSnapshot || undoSecondsLeft <= 0) return;

    const id = window.setInterval(() => {

      setUndoSecondsLeft((s) => Math.max(0, s - 1));

    }, 1000);

    return () => window.clearInterval(id);

  }, [undoSnapshot, undoSecondsLeft]);



  useEffect(() => {

    if (historyOpen) void loadCompletedToday();

  }, [historyOpen, loadCompletedToday]);



  useEffect(() => () => clearUndo(), [clearUndo]);



  const setOrderUpdating = useCallback((orderId: string, updating: boolean) => {

    setUpdatingOrderIds((prev) => {

      const next = new Set(prev);

      if (updating) next.add(orderId);

      else next.delete(orderId);

      return next;

    });

  }, []);



  const setItemUpdating = useCallback((itemId: string, updating: boolean) => {

    setUpdatingItemIds((prev) => {

      const next = new Set(prev);

      if (updating) next.add(itemId);

      else next.delete(itemId);

      return next;

    });

  }, []);



  const applyOptimisticStatus = useCallback(

    (orderId: string, newStatus: string, opts?: { prepMinutes?: number }) => {

      setOrders((prev) => {

        if (newStatus === 'completed') {

          return prev.filter((o) => o.id !== orderId);

        }

        const nowIso = new Date().toISOString();

        return prev.map((o) => {

          if (o.id !== orderId) return o;

          const patch: Partial<KdsKitchenOrder> = { order_status: newStatus };

          if (newStatus === 'preparing') {

            patch.prep_started_at = nowIso;

            if (opts?.prepMinutes != null) {

              patch.estimated_ready_at = new Date(Date.now() + opts.prepMinutes * 60_000).toISOString();

            }

            patch.sale_items = o.sale_items?.map((item) => ({ ...item, prepared_at: null }));

          }

          if (newStatus === 'ready') {

            patch.ready_at = nowIso;

          }

          return { ...o, ...patch };

        });

      });

    },

    []

  );



  const startUndoWindow = useCallback(

    (order: KdsKitchenOrder) => {

      clearUndo();

      const readyOrder: KdsKitchenOrder = { ...order, order_status: 'ready' };

      const timeoutId = setTimeout(() => {

        undoRef.current = null;

        setUndoSnapshot(null);

        setUndoSecondsLeft(0);

      }, UNDO_MS);

      const snap: UndoSnapshot = { order: readyOrder, timeoutId };

      undoRef.current = snap;

      setUndoSnapshot(snap);

      setUndoSecondsLeft(Math.ceil(UNDO_MS / 1000));

    },

    [clearUndo]

  );



  const handleUpdateStatus = async (

    orderId: string,

    newStatus: string,

    opts?: { prepMinutes?: number }

  ) => {

    if (updatingOrderIds.has(orderId)) return;



    const previousOrder = orders.find((o) => o.id === orderId);

    setActionError(null);

    setOrderUpdating(orderId, true);



    if (newStatus === 'completed' && previousOrder) {

      applyOptimisticStatus(orderId, newStatus, opts);

      startUndoWindow(previousOrder);

    } else {

      if (newStatus === 'ready') clearUndo();

      applyOptimisticStatus(orderId, newStatus, opts);

    }



    const { data, error } = await supabase.functions.invoke('kds-order-status-update', {
      body: {
        saleId: orderId,
        nextStatus: newStatus,
        prepMinutes: opts?.prepMinutes,
      },
    });



    if (error) {

      setActionError(`${t.errorOccurred}: ${error.message}`);

      clearUndo();

      await loadOrders();

      setOrderUpdating(orderId, false);

      return;

    }



    if (data && typeof data === 'object' && 'ok' in data && data.ok === false) {

      const details = data as { error?: { message?: string } };

      setActionError(`${t.errorOccurred}: ${details.error?.message ?? 'Status update failed'}`);

      clearUndo();

      await loadOrders();

      setOrderUpdating(orderId, false);

      return;

    }



    setOrderUpdating(orderId, false);

    void loadOrders();

  };



  const handleUndoComplete = async () => {
    if (!undoSnapshot) return;
    const { order } = undoSnapshot;
    clearUndo();
    setOrderUpdating(order.id, true);
    applyOptimisticStatus(order.id, 'ready');
    const { data, error } = await supabase.functions.invoke('kds-order-status-update', {
      body: { saleId: order.id, nextStatus: 'ready' },
    });
    if (error) {
      setActionError(`${t.errorOccurred}: ${error.message}`);
      await loadOrders();
      setOrderUpdating(order.id, false);
      return;
    }
    if (data && typeof data === 'object' && 'ok' in data && data.ok === false) {
      const details = data as { error?: { message?: string } };
      setActionError(`${t.errorOccurred}: ${details.error?.message ?? 'Status update failed'}`);
      await loadOrders();
      setOrderUpdating(order.id, false);
      return;
    }
    setOrderUpdating(order.id, false);
    void loadOrders();
  };



  const handleToggleItemPrep = async (saleItemId: string, prepared: boolean) => {

    if (updatingItemIds.has(saleItemId)) return;



    setActionError(null);

    setItemUpdating(saleItemId, true);

    const preparedAt = prepared ? new Date().toISOString() : null;



    setOrders((prev) =>

      prev.map((order) => ({

        ...order,

        sale_items: order.sale_items?.map((item) =>

          item.id === saleItemId ? { ...item, prepared_at: preparedAt } : item

        ),

      }))

    );



    const { data, error } = await supabase.functions.invoke('kds-item-prep-toggle', {
      body: { saleItemId, prepared },
    });



    if (error) {

      setActionError(`${t.errorOccurred}: ${error.message}`);

      await loadOrders();

      setItemUpdating(saleItemId, false);

      return;

    }



    if (data && typeof data === 'object' && 'ok' in data && data.ok === false) {

      const details = data as { error?: { message?: string } };

      setActionError(`${t.errorOccurred}: ${details.error?.message ?? 'Item prep toggle failed'}`);

      await loadOrders();

      setItemUpdating(saleItemId, false);

      return;

    }



    setItemUpdating(saleItemId, false);

  };



  const reconnectRealtime = () => {

    const ch = channelRef.current;

    if (ch) {

      ch.subscribe();

    } else {

      void loadOrders();

    }

  };



  const undoOrderId = undoSnapshot?.order.id;
  const boardOrders = useMemo(
    () => (undoOrderId ? orders.filter((o) => o.id !== undoOrderId) : orders),
    [orders, undoOrderId]
  );

  const filteredOrders = useMemo(() => {
    return applyKdsFilters(boardOrders, sourceFilter, searchQuery);
  }, [boardOrders, sourceFilter, searchQuery]);

  const pendingCount = boardOrders.filter((o) => o.order_status === 'pending').length;
  const preparingCount = boardOrders.filter((o) => o.order_status === 'preparing').length;
  const readyCount = boardOrders.filter((o) => o.order_status === 'ready').length;



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

      {actionError ? (

        <div className="shrink-0 bg-amber-900/90 px-4 py-2 text-center text-sm text-amber-100">

          {actionError}

        </div>

      ) : null}

      <KdsHeader

        pendingCount={pendingCount}

        preparingCount={preparingCount}

        readyCount={readyCount}

        realtimeStatus={realtimeStatus}

        now={now}

        sourceFilter={sourceFilter}

        onSourceFilterChange={setSourceFilter}

        searchQuery={searchQuery}

        onSearchChange={setSearchQuery}

        onRefresh={() => void loadOrders()}

        onHistoryOpen={() => setHistoryOpen(true)}

        onSignOut={onSignOut}

      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950/40">
        <KdsBoard
          orders={filteredOrders}
          now={now}
          preparingCount={preparingCount}
          updatingOrderIds={updatingOrderIds}
          updatingItemIds={updatingItemIds}
          hasAnyOrders={boardOrders.length > 0}
          isFilteredEmpty={filteredOrders.length === 0 && boardOrders.length > 0}
          onUpdateStatus={handleUpdateStatus}
          onToggleItemPrep={handleToggleItemPrep}
        />
      </div>

      {undoSnapshot ? (

        <KdsUndoToast

          displayNumber={undoSnapshot.order.display_number ?? '—'}

          secondsLeft={undoSecondsLeft}

          onUndo={() => void handleUndoComplete()}

          onDismiss={clearUndo}

        />

      ) : null}

      <KdsHistoryDrawer

        open={historyOpen}

        orders={historyOrders}

        loading={historyLoading}

        onClose={() => setHistoryOpen(false)}

      />

    </div>

  );

}



function KdsShell() {
  const { user, isStaff, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="neon-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  if (!isStaff) return <StaffAccessDeniedScreen />;

  return <KdsContent onSignOut={() => void signOut()} />;
}

export function KitchenDisplay() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <KdsShell />
          <Analytics />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}


