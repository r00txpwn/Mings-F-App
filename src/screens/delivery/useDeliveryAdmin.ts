import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { adminDelete, adminInsert, adminUpdate, type AdminMutateResult } from '../../lib/adminApi';
import { expireOnlineKitchenPauseIfDue } from '../../order/orderOnlineSettings';
import type {
  DeliveryZoneRow,
  OnlineSettingsRow,
} from '../../types/online';

export interface DispatchOrderRow {
  id: string;
  display_number: string | null;
  created_at: string;
  total_price: number | null;
  delivery_fee: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_apartment: string | null;
  delivery_floor: string | null;
  delivery_notes: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  order_status: string | null;
  delivery_order: {
    id: string;
    status: string | null;
    wolt_delivery_id: string | null;
    tracking_url: string | null;
    manually_dispatched: boolean | null;
  } | null;
}

interface State {
  zones: DeliveryZoneRow[];
  settings: OnlineSettingsRow | null;
  dispatchOrders: DispatchOrderRow[];
  loading: boolean;
  error: string | null;
}

const INITIAL: State = {
  zones: [],
  settings: null,
  dispatchOrders: [],
  loading: true,
  error: null,
};

function asDbResult<T = unknown>(result: AdminMutateResult<T>) {
  return {
    data: result.data ?? null,
    error: result.ok ? null : { message: result.error ?? 'Request failed' },
  };
}

export function useDeliveryAdmin() {
  const [state, setState] = useState<State>(INITIAL);
  const mountedRef = useRef(true);

  const setIfMounted = useCallback((updater: (s: State) => State) => {
    if (mountedRef.current) setState(updater);
  }, []);

  const loadZones = useCallback(async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      setIfMounted((s) => ({ ...s, error: error.message }));
      return;
    }
    setIfMounted((s) => ({ ...s, zones: (data ?? []) as DeliveryZoneRow[] }));
  }, [setIfMounted]);

  const loadSettings = useCallback(async () => {
    await expireOnlineKitchenPauseIfDue(supabase);
    const { data, error } = await supabase
      .from('online_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) {
      setIfMounted((s) => ({ ...s, error: error.message }));
      return;
    }
    setIfMounted((s) => ({ ...s, settings: (data ?? null) as OnlineSettingsRow | null }));
  }, [setIfMounted]);

  const loadDispatchOrders = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('sales')
      .select(
        'id, display_number, created_at, total_price, delivery_fee, customer_name, customer_phone, delivery_address, delivery_apartment, delivery_floor, delivery_notes, delivery_lat, delivery_lng, order_status, delivery_order:delivery_orders(id, status, wolt_delivery_id, tracking_url, manually_dispatched)',
      )
      .eq('source', 'online_delivery')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) {
      setIfMounted((s) => ({ ...s, error: error.message }));
      return;
    }
    const rows = (data ?? []).map((r) => {
      const raw = r as unknown as Omit<DispatchOrderRow, 'delivery_order'> & {
        delivery_order: DispatchOrderRow['delivery_order'] | DispatchOrderRow['delivery_order'][];
      };
      const deliveryOrder = Array.isArray(raw.delivery_order)
        ? raw.delivery_order[0] ?? null
        : raw.delivery_order ?? null;
      return { ...raw, delivery_order: deliveryOrder } as DispatchOrderRow;
    });
    setIfMounted((s) => ({ ...s, dispatchOrders: rows }));
  }, [setIfMounted]);

  const refreshAll = useCallback(async () => {
    setIfMounted((s) => ({ ...s, loading: true, error: null }));
    await Promise.all([loadZones(), loadSettings(), loadDispatchOrders()]);
    setIfMounted((s) => ({ ...s, loading: false }));
  }, [loadZones, loadSettings, loadDispatchOrders, setIfMounted]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshAll();

    const channel = supabase.channel('delivery-admin');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'delivery_zones' },
      () => void loadZones(),
    );
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'online_settings' },
      () => void loadSettings(),
    );
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'delivery_orders' },
      () => void loadDispatchOrders(),
    );
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      () => void loadDispatchOrders(),
    );
    channel.subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [refreshAll, loadZones, loadSettings, loadDispatchOrders]);

  // Mutations — return the supabase response so callers can show toasts.

  const upsertZone = useCallback(
    async (zone: Partial<DeliveryZoneRow> & { name: string; polygon: DeliveryZoneRow['polygon'] }) => {
      const payload = { ...zone };
      if (payload.id) {
        return asDbResult(await adminUpdate('delivery_zones', payload.id, payload));
      }
      return asDbResult(await adminInsert('delivery_zones', payload));
    },
    [],
  );

  const setZoneActive = useCallback(async (id: string, isActive: boolean) => {
    return asDbResult(await adminUpdate('delivery_zones', id, { is_active: isActive }));
  }, []);

  const deleteZone = useCallback(async (id: string) => {
    return asDbResult(await adminDelete('delivery_zones', id));
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<OnlineSettingsRow>) => {
      const settings = state.settings;
      if (!settings?.id) {
        return asDbResult(await adminInsert('online_settings', patch as Record<string, unknown>));
      }
      return asDbResult(await adminUpdate('online_settings', settings.id, patch));
    },
    [state.settings],
  );

  return {
    ...state,
    refreshAll,
    upsertZone,
    setZoneActive,
    deleteZone,
    updateSettings,
  };
}
