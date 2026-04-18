import { ClipboardCopy, ExternalLink, Loader2, Phone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { invokeEdgeFunction } from '../order/invokeEdge';
import type { OrderManagerOrder } from './types';

interface ReadyCardProps {
  order: OrderManagerOrder;
  accessToken: string | null;
  woltPortalBase: string;
  onPickedUp: () => void;
  onDispatched: () => void;
}

export function ReadyCard({ order, accessToken, woltPortalBase, onPickedUp, onDispatched }: ReadyCardProps) {
  const { t } = useLanguage();
  const [trackingUrl, setTrackingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDelivery = order.source === 'online_delivery';
  const canDispatch = Boolean(accessToken && trackingUrl.trim());

  const sourceLabel = useMemo(() => {
    if (order.source === 'online_delivery') return t.omSourceDelivery;
    if (order.source === 'online_takeaway') return t.omSourceTakeaway;
    return t.omSourceKiosk;
  }, [order.source, t]);

  const openWolt = () => {
    const phone = encodeURIComponent((order.customer_phone ?? '').trim());
    const sep = woltPortalBase.includes('?') ? '&' : '?';
    window.open(`${woltPortalBase}${sep}search=${phone}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      const payload = [
        `${t.woltCopyCustomer}: ${order.customer_name ?? '-'}`,
        `${t.woltCopyPhone}: ${order.customer_phone ?? '-'}`,
        `${t.woltCopyAddress}: ${order.delivery_address ?? '-'}`,
        `${t.woltCopyNotes}: ${order.delivery_notes ?? order.notes ?? '-'}`,
      ].join('\n');
      await navigator.clipboard.writeText(payload);
      setCopyFlash(true);
      window.setTimeout(() => setCopyFlash(false), 1500);
    } catch {
      setError(t.woltCopyFailed);
    }
  };

  const handleDispatch = async () => {
    if (!accessToken) return;
    const url = trackingUrl.trim();
    if (!url) return;
    setError(null);
    setSaving(true);
    const res = await invokeEdgeFunction<{ saleId: string; trackingUrl: string }, { ok?: boolean }>(
      'wolt-drive-manual-dispatch',
      { saleId: order.id, trackingUrl: url },
      accessToken
    );
    setSaving(false);
    if (res.ok) {
      onDispatched();
    } else {
      setError(t.woltSaveFailed);
    }
  };

  return (
    <article className="neon-card rounded-xl border border-emerald-500/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
        <span className="text-xs text-emerald-200">{sourceLabel}</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
        {(order.sale_items ?? []).slice(0, 3).map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.product_name}
          </li>
        ))}
      </ul>

      {!isDelivery ? (
        <button
          type="button"
          onClick={onPickedUp}
          className="mt-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500"
        >
          {t.omPickedUp}
        </button>
      ) : (
        <div className="mt-3 space-y-2 rounded-lg border border-white/10 p-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            {copyFlash ? t.woltCopiedAll : t.woltCopyAll}
          </button>
          <button
            type="button"
            onClick={openWolt}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t.woltOpenPortal}
          </button>
          {order.customer_phone ? (
            <p className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Phone className="h-3.5 w-3.5" />
              {order.customer_phone}
            </p>
          ) : null}
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-100"
            placeholder={t.woltTrackingUrlLabel}
          />
          <button
            type="button"
            disabled={!canDispatch || saving}
            onClick={() => void handleDispatch()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cockpit-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cockpit-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {t.omSaveDispatch}
          </button>
          {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
        </div>
      )}
    </article>
  );
}
