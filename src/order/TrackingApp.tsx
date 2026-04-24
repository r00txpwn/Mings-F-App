import { useEffect, useMemo, useState, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, Package, Truck, XCircle } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  estimateDeliveryMinutes,
  formatEta,
  getKitchenLocationFromSettings,
  type KitchenLocation,
} from '../order-manager/deliveryUtils';
import { Price } from '../components/Price';

interface TrackingPayload {
  sale: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
}

type StageStatus = 'done' | 'active' | 'pending';

interface TimelineStage {
  key: string;
  label: string;
  sublabel?: string;
  timestamp: string | null;
  status: StageStatus;
}

function TrackingContent() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [kitchenLocation, setKitchenLocation] = useState<KitchenLocation>(() =>
    getKitchenLocationFromSettings(null),
  );
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token'), []);

  const load = useCallback(async () => {
    if (!token) return;
    const [{ data: row, error }, { data: settingsData }] = await Promise.all([
      supabase.rpc('get_sale_tracking_public', {
        p_token: token,
      }),
      supabase.from('online_settings').select('kitchen_lat, kitchen_lng').limit(1).maybeSingle(),
    ]);
    setKitchenLocation(getKitchenLocationFromSettings(settingsData));
    if (error) setErr(error.message);
    else setData(row as TrackingPayload);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void load();
  }, [token, load]);

  const saleId = data?.sale?.id as string | undefined;

  useEffect(() => {
    if (!saleId) return;
    const channel = supabase
      .channel(`track-sale-${saleId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sales', filter: `id=eq.${saleId}` },
        () => void load()
      );
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [saleId, load]);

  if (loading) {
    return (
      <div className="neon-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="neon-shell flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
        <Package className="h-12 w-12 text-slate-600" />
        <p>{t.trackingMissingToken}</p>
      </div>
    );
  }

  if (err || !data?.sale) {
    return (
      <div className="neon-shell flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
        <Package className="h-12 w-12 text-slate-600" />
        <p>{err ?? t.trackingNotFound}</p>
      </div>
    );
  }

  const sale = data.sale;
  const delivery = data.delivery;
  const display = String(sale.display_number ?? '—');
  const status = String(sale.order_status ?? 'pending');
  const pay = String(sale.payment_status ?? '');
  const total = Number(sale.total_price ?? 0);
  const trackingUrl = delivery && delivery.tracking_url ? String(delivery.tracking_url) : '';
  const cancellationReasonRaw = (sale as { cancellation_reason?: string | null }).cancellation_reason;
  const cancellationReason =
    cancellationReasonRaw != null && String(cancellationReasonRaw).trim()
      ? String(cancellationReasonRaw).trim()
      : '';
  const friendly =
    status === 'preparing'
      ? t.trackStatusPreparing
      : status === 'ready'
        ? t.trackStatusReady
        : status === 'dispatched'
          ? t.trackStatusDispatched
          : status === 'completed'
            ? t.trackStatusCompleted
            : status === 'cancelled'
              ? t.cancelled
              : t.trackStatusPending;

  const saleItems = (sale as { sale_items?: Array<Record<string, unknown>> }).sale_items;

  if (status === 'cancelled' && cancellationReason) {
    return (
      <div className="neon-shell min-h-screen px-4 py-10 text-slate-100">
        <div className="neon-card mx-auto max-w-md border-rose-500/40 bg-rose-500/10 p-6 text-rose-100">
          <XCircle className="mx-auto h-14 w-14 text-rose-400" aria-hidden />
          <p className="mt-3 text-center font-mono text-lg text-cockpit-400">
            {t.trackingOrderLabel} #{display}
          </p>
          <h1 className="mt-4 text-center text-xl font-bold text-white">{t.orderCancelledTitle}</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-rose-100/95">
            {t.orderCancelledReason.replace('{reason}', cancellationReason)}
          </p>
          {pay === 'paid' ? (
            <p className="mt-4 text-center text-sm text-rose-100/90">{t.orderCancelledRefundNote}</p>
          ) : null}
          <a
            href="/order"
            className="neon-btn-primary mt-6 flex w-full items-center justify-center py-4 text-center font-semibold text-white"
          >
            {t.trackingOrderAgain}
          </a>
          <p className="mt-4 text-center text-xs text-slate-500">{t.trackingCancelledContact}</p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="neon-shell min-h-screen px-4 py-10 text-slate-100">
        <div className="neon-card mx-auto max-w-md p-6">
          <h1 className="text-xl font-bold text-white">{t.trackingPageTitle}</h1>
          <p className="mt-2 font-mono text-2xl text-cockpit-400">
            {t.trackingOrderLabel} #{display}
          </p>
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-100">
            <p className="text-sm leading-relaxed text-rose-100/95">{t.orderCancelledGeneric}</p>
            <a
              href="/order"
              className="neon-btn-primary mt-4 flex w-full items-center justify-center py-3 text-center text-sm font-semibold"
            >
              {t.trackingOrderAgain}
            </a>
            <p className="mt-3 text-center text-xs text-slate-500">{t.trackingCancelledContact}</p>
          </div>
        </div>
      </div>
    );
  }

  const isDelivery = String(sale.source ?? '') === 'online_delivery';
  const createdAt = sale.created_at as string | null;
  const scheduledFor = sale.scheduled_for as string | null;
  const isScheduled = Boolean((sale.is_scheduled as boolean | null) ?? scheduledFor);
  const prepStartedAt = sale.prep_started_at as string | null;
  const readyAt = sale.ready_at as string | null;
  const dispatchedAt = sale.dispatched_at as string | null;
  const completedAt = sale.completed_at as string | null;
  const deliveryLat = sale.delivery_lat as number | null;
  const deliveryLng = sale.delivery_lng as number | null;

  const estimatedMinutes = isDelivery ? estimateDeliveryMinutes(deliveryLat, deliveryLng, kitchenLocation) : null;

  const etaTime = dispatchedAt && estimatedMinutes ? formatEta(dispatchedAt, estimatedMinutes) : null;

  const fmt = (ts: string | null): string => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('az-AZ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const stages: TimelineStage[] = isDelivery
    ? [
        {
          key: 'placed',
          label: t.trackStageOrderPlaced,
          timestamp: createdAt,
          status: 'done',
        },
        {
          key: 'preparing',
          label: t.trackStagePreparing,
          timestamp: prepStartedAt,
          status: prepStartedAt ? 'done' : status === 'preparing' ? 'active' : 'pending',
        },
        {
          key: 'ready',
          label: t.trackStageReady,
          timestamp: readyAt,
          status: readyAt ? 'done' : status === 'ready' ? 'active' : 'pending',
        },
        {
          key: 'dispatched',
          label: t.trackStageOutForDelivery,
          sublabel: estimatedMinutes
            ? t.trackStageEtaMinutes.replace('{min}', String(estimatedMinutes))
            : undefined,
          timestamp: dispatchedAt,
          status: dispatchedAt ? 'done' : status === 'dispatched' ? 'active' : 'pending',
        },
        {
          key: 'delivered',
          label: t.trackStageDelivered,
          sublabel: etaTime ? t.trackStageArrivingAround.replace('{time}', etaTime) : undefined,
          timestamp: completedAt,
          status: completedAt ? 'done' : status === 'completed' ? 'done' : 'pending',
        },
      ]
    : [
        {
          key: 'placed',
          label: t.trackStageOrderPlaced,
          timestamp: createdAt,
          status: 'done',
        },
        {
          key: 'preparing',
          label: t.trackStagePreparing,
          timestamp: prepStartedAt,
          status: prepStartedAt ? 'done' : status === 'preparing' ? 'active' : 'pending',
        },
        {
          key: 'ready',
          label: t.trackStageReadyForPickup,
          timestamp: readyAt,
          status: readyAt ? 'done' : status === 'ready' ? 'active' : 'pending',
        },
        {
          key: 'collected',
          label: t.trackStageCollected,
          timestamp: completedAt,
          status: completedAt ? 'done' : status === 'completed' ? 'done' : 'pending',
        },
      ];

  return (
    <div className="neon-shell min-h-screen px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-md space-y-4">
        <div className="neon-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.trackingOrderLabel}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cockpit-400">#{display}</p>

          <p className="mt-3 text-lg font-semibold text-white">{friendly}</p>
          {isScheduled && scheduledFor ? (
            <p className="mt-2 text-sm text-cockpit-300">
              {t.trackScheduledForLabel}{' '}
              <span className="font-semibold">
                {new Date(scheduledFor).toLocaleString('az-AZ', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </span>
            </p>
          ) : null}

          {status === 'dispatched' && etaTime ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cockpit-500/30 bg-cockpit-500/10 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-cockpit-400" />
              <span className="text-sm font-semibold text-cockpit-300">
                {t.trackEtaLabel} {etaTime}
              </span>
            </div>
          ) : null}
        </div>

        <div className="neon-card p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">{t.trackTimelineTitle}</p>
          <ol className="space-y-0">
            {stages.map((stage, idx) => {
              const isLast = idx === stages.length - 1;
              return (
                <li key={stage.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        stage.status === 'done'
                          ? 'border-cockpit-500 bg-cockpit-500/20'
                          : stage.status === 'active'
                            ? 'border-cockpit-400 bg-cockpit-400/10'
                            : 'border-white/15 bg-transparent'
                      }`}
                    >
                      {stage.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-cockpit-400" />
                      ) : stage.status === 'active' ? (
                        <div className="h-2 w-2 animate-pulse rounded-full bg-cockpit-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-white/20" />
                      )}
                    </div>
                    {!isLast ? (
                      <div
                        className={`mt-1 min-h-[24px] w-0.5 flex-1 rounded-full ${
                          stage.status === 'done' ? 'bg-cockpit-500/40' : 'bg-white/10'
                        }`}
                      />
                    ) : null}
                  </div>

                  <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                    <p
                      className={`text-sm font-semibold ${
                        stage.status === 'done'
                          ? 'text-white'
                          : stage.status === 'active'
                            ? 'text-cockpit-300'
                            : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.timestamp ? (
                      <p className="mt-0.5 text-xs text-slate-500">{fmt(stage.timestamp)}</p>
                    ) : null}
                    {stage.sublabel && stage.status !== 'done' ? (
                      <p className="mt-0.5 text-xs text-cockpit-400">{stage.sublabel}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          {trackingUrl && (status === 'dispatched' || status === 'completed') ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-3 py-3 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-600/30"
            >
              <Truck className="h-4 w-4" />
              {t.trackOnWolt}
            </a>
          ) : null}
        </div>

        <div className="neon-card p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">{t.orderDetails}</p>
          {Array.isArray(saleItems) && saleItems.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {saleItems.map((item) => {
                const row = item as {
                  id?: string;
                  is_combo?: boolean;
                  combo_selections?: {
                    combo?: string;
                    items?: Array<{
                      group: string;
                      item: string;
                      modifiers?: string[];
                    }>;
                  };
                  product_name?: string;
                  quantity?: number;
                };
                if (row.is_combo && row.combo_selections) {
                  const cs = row.combo_selections;
                  return (
                    <li key={String(row.id)} className="rounded-lg border border-amber-500/35 bg-amber-500/5 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-200">
                        {cs.combo ?? row.product_name}
                      </p>
                      {cs.items?.map((line, i) => (
                        <div key={i}>
                          <p className="text-slate-200">
                            {row.quantity ?? 1}× {line.item}{' '}
                            <span className="text-xs text-slate-500">({line.group})</span>
                          </p>
                          {line.modifiers && line.modifiers.length > 0 ? (
                            <p className="ml-4 text-xs text-slate-500">{line.modifiers.join(', ')}</p>
                          ) : null}
                        </div>
                      ))}
                    </li>
                  );
                }
                return (
                  <li key={String(row.id)} className="flex justify-between gap-2 text-slate-200">
                    <span>
                      {row.quantity ?? 1}× {row.product_name}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-slate-400">{t.trackingTotal}</span>
            <Price
              amount={total}
              className="font-mono font-bold text-white"
              symbolPosition="prefix"
            />
          </div>
        </div>

        <a
          href="/order"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
        >
          {t.trackingOrderAgain}
        </a>
      </div>
    </div>
  );
}

export function TrackingApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TrackingContent />
        <Analytics />
      </LanguageProvider>
    </ThemeProvider>
  );
}
