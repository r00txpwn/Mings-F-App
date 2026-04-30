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
import { orderBrandAssets } from './orderDesign';

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
      <div className="ming-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="ming-shell order-bg-graphics flex min-h-screen items-center justify-center p-6 text-center">
        <div className="ming-card relative z-10 w-full max-w-sm p-6 sm:p-7">
          <img src={orderBrandAssets.wordmark} alt="Ming's" className="mx-auto h-14 w-auto rounded-3xl bg-white p-3 shadow-[6px_6px_0_rgba(40,20,20,0.16)]" />
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[color:var(--order-coral)] text-white shadow-[6px_6px_0_var(--order-ink)]">
            <Package className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xl font-black text-[color:var(--order-ink)]">{t.trackingMissingToken}</p>
          <p className="mx-auto mt-3 max-w-[280px] text-sm font-semibold leading-6 text-[rgba(40,20,20,0.64)]">
            {t.trackingMissingTokenHint}
          </p>
          <a href="/order" className="ming-btn-primary mt-6 w-full py-3">
            {t.trackingOrderAgain}
          </a>
          <p className="mt-4 text-xs font-bold text-[rgba(40,20,20,0.54)]">{t.trackingNeedHelp}</p>
        </div>
      </div>
    );
  }

  if (err || !data?.sale) {
    return (
      <div className="ming-shell order-bg-graphics flex min-h-screen items-center justify-center p-6 text-center">
        <div className="ming-card relative z-10 w-full max-w-sm p-6 sm:p-7">
          <img src={orderBrandAssets.wordmark} alt="Ming's" className="mx-auto h-14 w-auto rounded-3xl bg-white p-3 shadow-[6px_6px_0_rgba(40,20,20,0.16)]" />
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[color:var(--order-coral)] text-white shadow-[6px_6px_0_var(--order-ink)]">
            <Package className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xl font-black text-[color:var(--order-ink)]">{err ?? t.trackingNotFound}</p>
          <p className="mx-auto mt-3 max-w-[280px] text-sm font-semibold leading-6 text-[rgba(40,20,20,0.64)]">
            {t.trackingMissingTokenHint}
          </p>
          <a href="/order" className="ming-btn-primary mt-6 w-full py-3">
            {t.trackingOrderAgain}
          </a>
          <p className="mt-4 text-xs font-bold text-[rgba(40,20,20,0.54)]">{t.trackingNeedHelp}</p>
        </div>
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
      <div className="ming-shell order-bg-graphics min-h-screen px-4 py-10">
        <div className="ming-card relative z-[1] mx-auto max-w-md p-6 text-center">
          <img src={orderBrandAssets.wordmark} alt="Ming's" className="mx-auto h-14 w-auto rounded-3xl bg-white p-3 shadow-[6px_6px_0_rgba(40,20,20,0.16)]" />
          <XCircle className="mx-auto mt-6 h-14 w-14 text-[color:var(--order-coral)]" aria-hidden />
          <p className="mt-3 text-center font-mono text-lg font-black text-[color:var(--order-coral)]">
            {t.trackingOrderLabel} #{display}
          </p>
          <h1 className="mt-4 text-center text-xl font-black text-[color:var(--order-ink)]">{t.orderCancelledTitle}</h1>
          <p className="mt-3 text-center text-sm font-semibold leading-relaxed text-[rgba(40,20,20,0.7)]">
            {t.orderCancelledReason.replace('{reason}', cancellationReason)}
          </p>
          {pay === 'paid' ? (
            <p className="mt-4 text-center text-sm font-semibold text-[rgba(40,20,20,0.7)]">{t.orderCancelledRefundNote}</p>
          ) : null}
          <a
            href="/order"
            className="ming-btn-primary mt-6 flex w-full items-center justify-center py-4 text-center"
          >
            {t.trackingOrderAgain}
          </a>
          <p className="mt-4 text-center text-xs font-semibold text-[rgba(40,20,20,0.55)]">{t.trackingCancelledContact}</p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="ming-shell order-bg-graphics min-h-screen px-4 py-10">
        <div className="ming-card relative z-[1] mx-auto max-w-md p-6">
          <img src={orderBrandAssets.wordmark} alt="Ming's" className="h-12 w-auto rounded-3xl bg-white p-3 shadow-[5px_5px_0_rgba(40,20,20,0.16)]" />
          <h1 className="mt-5 text-xl font-black text-[color:var(--order-ink)]">{t.trackingPageTitle}</h1>
          <p className="mt-2 font-mono text-2xl font-black text-[color:var(--order-coral)]">
            {t.trackingOrderLabel} #{display}
          </p>
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
            <p className="text-sm font-semibold leading-relaxed text-[rgba(40,20,20,0.72)]">{t.orderCancelledGeneric}</p>
            <a
              href="/order"
              className="ming-btn-primary mt-4 flex w-full items-center justify-center py-3 text-center text-sm"
            >
              {t.trackingOrderAgain}
            </a>
            <p className="mt-3 text-center text-xs font-semibold text-[rgba(40,20,20,0.55)]">{t.trackingCancelledContact}</p>
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
    <div className="ming-shell order-bg-graphics min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="relative z-[1] flex items-center justify-between">
          <div className="flex w-32 items-center rounded-2xl bg-white px-3 py-2 shadow-[5px_5px_0_rgba(40,20,20,0.18)]">
            <img src={orderBrandAssets.wordmark} alt="Ming's" className="w-full object-contain" />
          </div>
          <span className="order-sticker rotate-6">live</span>
        </div>

        <div className="ming-card p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[color:var(--order-coral)]">{t.trackingOrderLabel}</p>
          <p className="mt-1 font-mono text-3xl font-black text-[color:var(--order-ink)]">#{display}</p>

          <p className="mt-3 ming-display text-3xl leading-[0.9] text-[color:var(--order-ink)]">{friendly}</p>
          {isScheduled && scheduledFor ? (
            <p className="mt-2 text-sm font-semibold text-[rgba(40,20,20,0.68)]">
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
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-700" />
              <span className="text-sm font-bold text-emerald-800">
                {t.trackEtaLabel} {etaTime}
              </span>
            </div>
          ) : null}
        </div>

        <div className="ming-card p-5">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-[rgba(40,20,20,0.52)]">{t.trackTimelineTitle}</p>
          <ol className="space-y-0">
            {stages.map((stage, idx) => {
              const isLast = idx === stages.length - 1;
              return (
                <li key={stage.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        stage.status === 'done'
                          ? 'border-[color:var(--order-coral)] bg-red-400/10'
                          : stage.status === 'active'
                            ? 'border-[color:var(--order-coral)] bg-white'
                            : 'border-black/15 bg-white'
                      }`}
                    >
                      {stage.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-[color:var(--order-coral)]" />
                      ) : stage.status === 'active' ? (
                        <div className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--order-coral)]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[rgba(40,20,20,0.22)]" />
                      )}
                    </div>
                    {!isLast ? (
                      <div
                        className={`mt-1 min-h-[24px] w-0.5 flex-1 rounded-full ${
                          stage.status === 'done' ? 'bg-red-400/35' : 'bg-black/10'
                        }`}
                      />
                    ) : null}
                  </div>

                  <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                    <p
                      className={`text-sm font-semibold ${
                        stage.status === 'done'
                          ? 'text-[color:var(--order-ink)]'
                          : stage.status === 'active'
                            ? 'text-[color:var(--order-coral)]'
                            : 'text-[rgba(40,20,20,0.5)]'
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.timestamp ? (
                      <p className="mt-0.5 text-xs font-semibold text-[rgba(40,20,20,0.52)]">{fmt(stage.timestamp)}</p>
                    ) : null}
                    {stage.sublabel && stage.status !== 'done' ? (
                      <p className="mt-0.5 text-xs font-bold text-[color:var(--order-coral)]">{stage.sublabel}</p>
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm font-black text-[color:var(--order-ink)] shadow-[4px_4px_0_rgba(40,20,20,0.14)] transition-colors hover:bg-[color:var(--order-mint)]"
            >
              <Truck className="h-4 w-4" />
              {t.trackOnWolt}
            </a>
          ) : null}
        </div>

        <div className="ming-card p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-[rgba(40,20,20,0.52)]">{t.orderDetails}</p>
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
                    <li key={String(row.id)} className="rounded-2xl border border-orange-400/35 bg-orange-400/10 p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-[color:var(--order-coral)]">
                        {cs.combo ?? row.product_name}
                      </p>
                      {cs.items?.map((line, i) => (
                        <div key={i}>
                          <p className="text-[color:var(--order-ink)]">
                            {row.quantity ?? 1}× {line.item}{' '}
                            <span className="text-xs text-[rgba(40,20,20,0.55)]">({line.group})</span>
                          </p>
                          {line.modifiers && line.modifiers.length > 0 ? (
                            <p className="ml-4 text-xs text-[rgba(40,20,20,0.55)]">{line.modifiers.join(', ')}</p>
                          ) : null}
                        </div>
                      ))}
                    </li>
                  );
                }
                return (
                  <li key={String(row.id)} className="flex justify-between gap-2 text-[color:var(--order-ink)]">
                    <span>
                      {row.quantity ?? 1}× {row.product_name}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-4 flex justify-between border-t border-black/10 pt-3 text-sm">
            <span className="font-semibold text-[rgba(40,20,20,0.62)]">{t.trackingTotal}</span>
            <Price amount={total} className="font-mono font-black text-[color:var(--order-ink)]" />
          </div>
        </div>

        <a
          href="/order"
          className="ming-btn-ghost flex w-full items-center justify-center gap-2 py-3 text-sm"
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
