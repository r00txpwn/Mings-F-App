import { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isCardOnlinePaymentMethod,
  isCashDeliveryMethod,
  isCashPickupMethod,
} from '../lib/onlinePaymentMethod';
import { getUrgencyColor, remainingMinutes } from '../utils/urgency';
import {
  allItemsPrepared,
  flattenOrderLines,
  formatCountdown,
  formatElapsed,
  getChannelMeta,
  isOnlineOrder,
  type KdsKitchenOrder,
} from './kdsBoardUtils';
import { KdsLineItem } from './KdsLineItem';

const PREP_MINUTES = [3, 5, 7, 10, 12, 15, 18, 20, 25] as const;

const CHANNEL_ACCENT: Record<string, string> = {
  online_delivery: 'border-l-rose-500',
  online_takeaway: 'border-l-orange-500',
  kiosk: 'border-l-amber-400',
  pos_eat_in: 'border-l-violet-500',
  pos_takeaway: 'border-l-indigo-500',
  pos_delivery: 'border-l-fuchsia-500',
};

const CHANNEL_PILL: Record<string, string> = {
  online_delivery: 'text-rose-300',
  online_takeaway: 'text-orange-300',
  kiosk: 'text-amber-300',
  pos_eat_in: 'text-violet-300',
  pos_takeaway: 'text-indigo-300',
  pos_delivery: 'text-fuchsia-300',
};

interface KdsOrderCardProps {
  order: KdsKitchenOrder;
  now: number;
  ordersInPrepCount: number;
  isUpdating?: boolean;
  updatingItemIds?: Set<string>;
  onUpdateStatus: (orderId: string, newStatus: string, opts?: { prepMinutes?: number }) => void;
  onToggleItemPrep?: (saleItemId: string, prepared: boolean) => void;
}

export function KdsOrderCard({
  order,
  now,
  ordersInPrepCount,
  isUpdating = false,
  updatingItemIds,
  onUpdateStatus,
  onToggleItemPrep,
}: KdsOrderCardProps) {
  const { t } = useLanguage();
  const [prepPickerOpen, setPrepPickerOpen] = useState(false);
  const status = order.order_status || 'pending';
  const pay = (order.payment_status ?? '').trim() || 'pending';
  const isPaid = pay === 'paid';
  const online = isOnlineOrder(order.source);
  const method = order.online_payment_method || '';
  const cardUnpaid = online && isCardOnlinePaymentMethod(method) && pay !== 'paid';
  const cashFlow =
    online &&
    (isCashPickupMethod(method, order.source) || isCashDeliveryMethod(method, order.source));
  const canStartPrepPending = isPaid || (cashFlow && (pay === 'unpaid' || pay === 'pending'));

  const channel = getChannelMeta(order.source);
  const channelLabel = t[channel.labelKey];
  const sourceKey = order.source ?? 'kiosk';
  const accentBorder = CHANNEL_ACCENT[sourceKey] ?? CHANNEL_ACCENT.kiosk;
  const channelText = CHANNEL_PILL[sourceKey] ?? CHANNEL_PILL.kiosk;

  const referenceTime =
    status === 'preparing' && order.prep_started_at
      ? new Date(order.prep_started_at).getTime()
      : new Date(order.created_at).getTime();
  const elapsedMs = now - referenceTime;
  const elapsedMin = elapsedMs / 60000;

  const estRem = remainingMinutes(order.estimated_ready_at ?? null, now);
  const estMs =
    order.estimated_ready_at != null ? new Date(order.estimated_ready_at).getTime() - now : null;

  let urgencyRing = '';
  let pulse = false;

  if (status === 'preparing') {
    if (estRem != null) {
      const u = getUrgencyColor(estRem);
      urgencyRing = u.border.replace('border-', 'ring-');
      pulse = u.pulse;
    } else if (elapsedMin > 12) {
      urgencyRing = 'ring-red-500/50';
    } else if (elapsedMin > 8) {
      urgencyRing = 'ring-orange-500/40';
    }
  } else if (status === 'ready') {
    urgencyRing = 'ring-emerald-500/40';
  }

  const lines = flattenOrderLines(order);
  const everyItemPrepared = allItemsPrepared(lines);
  const showItemToggles = status === 'preparing' && Boolean(onToggleItemPrep);

  const paymentLabel = (): string | null => {
    if (!online) return null;
    if (isPaid) return t.kdsPaymentConfirmed;
    if (isCardOnlinePaymentMethod(method)) return t.payMethodBadgeCardAuthorizing;
    if (isCashPickupMethod(method, order.source)) return t.payMethodBadgeCashPickup;
    if (isCashDeliveryMethod(method, order.source)) return t.payMethodBadgeCashDelivery;
    return null;
  };

  const paymentTone = (): string => {
    if (isPaid || cashFlow) return 'text-emerald-400';
    if (isCardOnlinePaymentMethod(method)) return 'text-red-400';
    return 'text-slate-400';
  };

  const actionButtonClass = (color: 'blue' | 'emerald' | 'teal', highlight = false) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
      emerald: highlight
        ? 'bg-emerald-500 ring-2 ring-emerald-300/80 animate-pulse hover:bg-emerald-400'
        : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700',
      teal: 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700',
    };
    return `flex min-h-[44px] w-full shrink-0 touch-manipulation select-none items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors ${colors[color]} disabled:cursor-not-allowed disabled:opacity-60`;
  };

  const updatingLabel = (
    <>
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>{t.kdsStatusUpdating}</span>
    </>
  );

  const renderAction = () => {
    if (status === 'pending' && !isPaid && !online) {
      return (
        <div className="min-h-[44px] rounded-lg bg-slate-800/80 px-3 py-2 text-center text-xs font-medium leading-snug text-slate-400 flex items-center justify-center">
          {t.awaitingPayment}
        </div>
      );
    }
    if (status === 'pending' && cardUnpaid) {
      return (
        <div className="min-h-[44px] rounded-lg bg-slate-800/80 px-3 py-2 text-center text-xs font-medium leading-snug text-slate-400 flex items-center justify-center">
          {t.awaitingPayment}
        </div>
      );
    }
    if (status === 'pending' && canStartPrepPending) {
      if (prepPickerOpen) {
        const suggest20 = ordersInPrepCount >= 5;
        return (
          <div className="space-y-1.5">
            <p className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {t.kdsPrepTimeLabel}
            </p>
            <div className="flex flex-wrap justify-center gap-1">
              {PREP_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    setPrepPickerOpen(false);
                    onUpdateStatus(order.id, 'preparing', { prepMinutes: m });
                  }}
                  className={`min-h-[44px] min-w-[48px] touch-manipulation rounded-lg text-base font-bold disabled:opacity-50 ${
                    suggest20 && m === 20
                      ? 'bg-violet-600 text-white ring-2 ring-amber-400'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {suggest20 ? (
              <p className="text-center text-[10px] text-amber-300/90">{t.kdsBusyKitchenHint}</p>
            ) : null}
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setPrepPickerOpen(false)}
              className="w-full py-1 text-xs text-slate-500 hover:text-slate-300"
            >
              {t.cancel}
            </button>
          </div>
        );
      }
      if (isUpdating) {
        return (
          <div className={actionButtonClass('blue')} aria-busy="true">
            {updatingLabel}
          </div>
        );
      }
      return (
        <button type="button" onClick={() => setPrepPickerOpen(true)} className={actionButtonClass('blue')}>
          {t.startPreparing}
        </button>
      );
    }
    if (status === 'preparing') {
      return (
        <div className="space-y-1">
          {everyItemPrepared && lines.length > 0 ? (
            <p className="text-center text-[11px] font-medium text-emerald-400">{t.kdsAllItemsPrepared}</p>
          ) : null}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.id, 'ready')}
            className={actionButtonClass('emerald', everyItemPrepared && lines.length > 0)}
            aria-busy={isUpdating}
          >
            {isUpdating ? updatingLabel : t.markReady}
          </button>
        </div>
      );
    }
    if (status === 'ready') {
      return (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onUpdateStatus(order.id, 'completed')}
          className={actionButtonClass('teal')}
          aria-busy={isUpdating}
        >
          {isUpdating ? updatingLabel : t.markCompleted}
        </button>
      );
    }
    return null;
  };

  const timerLabel =
    status === 'preparing' && estMs != null && !Number.isNaN(estMs)
      ? formatCountdown(estMs)
      : formatElapsed(elapsedMs);

  const pulseClass = pulse ? ' animate-pulse' : '';
  const payLabel = paymentLabel();

  return (
    <article
      className={`flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-700/70 border-l-[4px] bg-slate-900/95 ${accentBorder} shadow-sm${pulseClass}${isUpdating ? ' opacity-90' : ''} ${urgencyRing ? `ring-1 ${urgencyRing}` : ''}`}
    >
      {/* Header: order # + timer, then meta line */}
      <header className="border-b border-slate-800/80 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-white">
            {order.display_number}
          </p>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-slate-950/80 px-2 py-1 text-slate-300">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span className="font-mono text-sm font-semibold tabular-nums">{timerLabel}</span>
          </div>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-semibold leading-tight">
          <span className={`uppercase tracking-wide ${channelText}`}>{channelLabel}</span>
          {payLabel ? (
            <>
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
              <span className={`${paymentTone()} normal-case`}>{payLabel}</span>
            </>
          ) : null}
        </p>
        {order.customer_name || order.customer_phone ? (
          <p className="mt-1 truncate text-xs text-slate-500">
            {[order.customer_name, order.customer_phone].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </header>

      {/* Items — primary scan zone */}
      <ul className="space-y-0 divide-y divide-slate-800/80 px-3 py-1">
        {showItemToggles
          ? lines.map((line) => (
              <li key={line.id} className="py-1.5">
                <KdsLineItem
                  line={line}
                  isUpdating={updatingItemIds?.has(line.saleItemId)}
                  onToggle={onToggleItemPrep}
                />
              </li>
            ))
          : lines.map((line) => (
              <li key={line.id} className="flex gap-2 py-1.5 leading-snug">
                <span className="w-9 shrink-0 text-right text-lg font-bold tabular-nums text-emerald-400">
                  {line.quantity}×
                </span>
                <div className="min-w-0 flex-1">
                  {line.groupLabel ? (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/70">
                      {line.groupLabel}
                    </p>
                  ) : null}
                  <p className="text-[15px] font-medium text-white">{line.label}</p>
                  {line.modifiers && line.modifiers.length > 0 ? (
                    <p className="text-xs text-slate-500">{line.modifiers.join(', ')}</p>
                  ) : null}
                  {line.notes ? <p className="text-xs text-amber-200/90">{line.notes}</p> : null}
                </div>
              </li>
            ))}
      </ul>

      {/* Footer: notes + action */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/50 px-3 py-2">
        {order.delivery_notes ? (
          <p className="mb-1.5 text-xs leading-snug text-amber-200/90">
            <span className="font-semibold text-amber-300">{t.kdsCourierNoteLabel}:</span>{' '}
            {order.delivery_notes}
          </p>
        ) : null}
        {!isPaid && status === 'pending' && !online ? (
          <p className="mb-1.5 text-center text-xs font-medium text-amber-400">{t.unpaid}</p>
        ) : null}
        {renderAction()}
      </footer>
    </article>
  );
}
