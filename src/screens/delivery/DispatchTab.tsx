import { useCallback, useState } from 'react';
import { Copy, ExternalLink, Loader2, Truck, UserCog } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { DispatchOrderRow } from './useDeliveryAdmin';

export interface DispatchTabTranslations {
  title: string;
  description: string;
  empty: string;
  colOrder: string;
  colCustomer: string;
  colAddress: string;
  colStatus: string;
  colActions: string;
  noWolt: string;
  manuallyDispatched: string;
  trackOpen: string;
  trackCopy: string;
  trackCopied: string;
  actionDispatch: string;
  actionMarkManual: string;
  actionCancel: string;
  toastInvokeError: string;
  toastInvokeOk: string;
  trackingUrlPrompt: string;
  trackingUrlInvalid: string;
}

interface DispatchTabProps {
  orders: DispatchOrderRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  t: DispatchTabTranslations;
  onError: (message: string) => void;
  onInfo: (message: string) => void;
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function statusBadge(status: string | null | undefined): string {
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

export function DispatchTab({ orders, loading, refresh, t, onError, onInfo }: DispatchTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const invoke = useCallback(
    async (
      saleId: string,
      fn: 'wolt-drive-create' | 'wolt-drive-cancel' | 'wolt-drive-manual-dispatch',
      trackingUrl?: string,
    ) => {
      setBusyId(saleId);
      const body =
        fn === 'wolt-drive-manual-dispatch'
          ? { saleId, trackingUrl: trackingUrl?.trim() }
          : { saleId };
      const { data, error } = await supabase.functions.invoke(fn, { body });
      setBusyId(null);
      if (error) {
        onError(`${t.toastInvokeError}: ${error.message}`);
        return;
      }
      const payload = data as { error?: string } | null;
      if (payload?.error) {
        onError(`${t.toastInvokeError}: ${payload.error}`);
        return;
      }
      onInfo(t.toastInvokeOk);
      await refresh();
    },
    [refresh, onError, onInfo, t.toastInvokeError, t.toastInvokeOk],
  );

  const markManualDispatch = useCallback(
    (saleId: string) => {
      const trackingUrl = window.prompt(t.trackingUrlPrompt);
      if (trackingUrl == null) return;
      const trimmed = trackingUrl.trim();
      if (!trimmed) return;
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('invalid protocol');
        }
      } catch {
        onError(t.trackingUrlInvalid);
        return;
      }
      void invoke(saleId, 'wolt-drive-manual-dispatch', trimmed);
    },
    [invoke, onError, t.trackingUrlInvalid, t.trackingUrlPrompt],
  );

  const copyTracking = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t.title}</h2>
        <p className="text-sm text-slate-500">{t.description}</p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-500">
          …
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-10 text-center">
          <Truck className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-sm text-slate-400">{t.empty}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[auto_1fr_2fr_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>{t.colOrder}</span>
            <span>{t.colCustomer}</span>
            <span>{t.colAddress}</span>
            <span>{t.colStatus}</span>
            <span>{t.colActions}</span>
          </div>
          <div className="divide-y divide-white/5">
            {orders.map((order) => {
              const dOrder = order.delivery_order;
              const tracking = dOrder?.tracking_url ?? null;
              const woltStatus = dOrder?.status ?? null;
              const manual = Boolean(dOrder?.manually_dispatched);
              const fullAddress = [order.delivery_address, order.delivery_apartment, order.delivery_floor]
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[auto_1fr_2fr_auto_auto] items-start gap-3 px-4 py-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs font-bold text-white">
                      #{order.display_number ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-500">{fmtTime(order.created_at)}</p>
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-xs text-slate-200">
                      {order.customer_name || order.customer_phone || '—'}
                    </p>
                    {order.customer_phone && order.customer_name ? (
                      <p className="truncate text-[11px] text-slate-500">{order.customer_phone}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-xs text-slate-300">{fullAddress || '—'}</p>
                    {order.delivery_notes ? (
                      <p className="truncate text-[11px] text-slate-500">{order.delivery_notes}</p>
                    ) : null}
                    <div className="flex items-center gap-2 pt-0.5">
                      {dOrder?.wolt_delivery_id ? (
                        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                          wolt {woltStatus ?? ''}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase text-slate-600">{t.noWolt}</span>
                      )}
                      {manual ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                          <UserCog className="h-3 w-3" />
                          {t.manuallyDispatched}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge(order.order_status)}`}
                  >
                    {order.order_status ?? '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    {tracking ? (
                      <>
                        <a
                          href={tracking}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cockpit-400"
                          aria-label={t.trackOpen}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void copyTracking(order.id, tracking)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cockpit-400"
                          aria-label={copiedId === order.id ? t.trackCopied : t.trackCopy}
                          title={copiedId === order.id ? t.trackCopied : t.trackCopy}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                    {!dOrder?.wolt_delivery_id ? (
                      <button
                        type="button"
                        onClick={() => void invoke(order.id, 'wolt-drive-create')}
                        disabled={busyId === order.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/5 disabled:opacity-40"
                      >
                        {busyId === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Truck className="h-3 w-3" />
                        )}
                        {t.actionDispatch}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void invoke(order.id, 'wolt-drive-cancel')}
                        disabled={busyId === order.id}
                        className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                      >
                        {t.actionCancel}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markManualDispatch(order.id)}
                      disabled={busyId === order.id || manual}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                    >
                      <UserCog className="h-3 w-3" />
                      {t.actionMarkManual}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
