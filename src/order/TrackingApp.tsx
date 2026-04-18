import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Package, Truck } from 'lucide-react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface TrackingPayload {
  sale: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
}

function TrackingContent() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token'), []);

  const load = useCallback(async () => {
    if (!token) return;
    const { data: row, error } = await supabase.rpc('get_sale_tracking_public', {
      p_token: token,
    });
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

  return (
    <div className="neon-shell min-h-screen px-4 py-10 text-slate-100">
      <div className="neon-card mx-auto max-w-md p-6">
        <h1 className="text-xl font-bold text-white">{t.trackingPageTitle}</h1>
        <p className="mt-2 font-mono text-2xl text-cockpit-400">
          {t.trackingOrderLabel} #{display}
        </p>
        <p className="mt-4 text-lg font-semibold leading-snug text-white">{friendly}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t.trackingKitchenStatus}</dt>
            <dd className="font-medium capitalize">{status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t.trackingPayment}</dt>
            <dd className="font-medium">{pay}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">{t.trackingTotal}</dt>
            <dd className="font-mono">₼{total.toFixed(2)}</dd>
          </div>
        </dl>

        {Array.isArray(saleItems) && saleItems.length > 0 ? (
          <ul className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm">
            {saleItems.map((item) => {
              const row = item as {
                id?: string;
                is_combo?: boolean;
                combo_selections?: { combo?: string; items?: Array<{ group: string; item: string }> };
                product_name?: string;
                quantity?: number;
              };
              if (row.is_combo && row.combo_selections) {
                const cs = row.combo_selections;
                return (
                  <li key={String(row.id)} className="rounded-lg border border-amber-500/35 bg-amber-500/5 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-200">{cs.combo ?? row.product_name}</p>
                    {cs.items?.map((line, i) => (
                      <p key={i} className="text-slate-200">
                        {row.quantity ?? 1}× {line.item}{' '}
                        <span className="text-xs text-slate-500">({line.group})</span>
                      </p>
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

        {trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"
          >
            <Truck className="h-5 w-5" />
            {t.trackOnWolt}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function TrackingApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TrackingContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
