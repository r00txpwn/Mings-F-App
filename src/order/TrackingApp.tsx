import { useEffect, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface TrackingPayload {
  sale: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
}

function TrackingContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setErr('Missing token');
      setLoading(false);
      return;
    }
    void (async () => {
      const { data: row, error } = await supabase.rpc('get_sale_tracking_public', {
        p_token: token,
      });
      if (error) setErr(error.message);
      else setData(row as TrackingPayload);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="neon-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
      </div>
    );
  }

  if (err || !data?.sale) {
    return (
      <div className="neon-shell flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
        <Package className="h-12 w-12 text-slate-600" />
        <p>{err ?? 'Order not found'}</p>
      </div>
    );
  }

  const sale = data.sale;
  const delivery = data.delivery;
  const display = String(sale.display_number ?? '—');
  const status = String(sale.order_status ?? 'pending');
  const pay = String(sale.payment_status ?? '');
  const total = Number(sale.total_price ?? 0);

  return (
    <div className="neon-shell min-h-screen px-4 py-10 text-slate-100">
      <div className="neon-card mx-auto max-w-md p-6">
        <h1 className="text-xl font-bold text-white">Order status</h1>
        <p className="mt-2 font-mono text-2xl text-cockpit-400">#{display}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Kitchen status</dt>
            <dd className="font-medium capitalize">{status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Payment</dt>
            <dd className="font-medium">{pay}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Total</dt>
            <dd className="font-mono">₼{total.toFixed(2)}</dd>
          </div>
        </dl>
        {delivery && (delivery.tracking_url as string | null) ? (
          <a
            href={String(delivery.tracking_url)}
            target="_blank"
            rel="noreferrer"
            className="neon-btn-primary mt-6 block w-full py-3 text-center"
          >
            Wolt tracking
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
