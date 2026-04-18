import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Sale, SaleItem, SaleItemModifier } from '../lib/supabase';
import { getUrgencyColor, remainingMinutes } from '../utils/urgency';

const PREP_MINUTES = [3, 5, 7, 10, 12, 15, 18, 20, 25] as const;

interface OrderCardProps {
  order: Sale & { sale_items: SaleItem[] };
  now: number;
  ordersInPrepCount: number;
  onUpdateStatus: (orderId: string, newStatus: string, opts?: { prepMinutes?: number }) => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function formatCountdown(msRemaining: number): string {
  const abs = Math.abs(msRemaining);
  const totalSec = Math.floor(abs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const sign = msRemaining < 0 ? '−' : '';
  return `${sign}${min}:${String(sec).padStart(2, '0')}`;
}

function isOnlineOrder(source: string | undefined): boolean {
  return source === 'online_delivery' || source === 'online_takeaway';
}

export function OrderCard({ order, now, ordersInPrepCount, onUpdateStatus }: OrderCardProps) {
  const { t } = useLanguage();
  const [prepPickerOpen, setPrepPickerOpen] = useState(false);
  const status = order.order_status || 'pending';
  const pay = order.payment_status || 'paid';
  const isPaid = pay === 'paid';
  const online = isOnlineOrder(order.source);
  const method = order.online_payment_method || '';
  const epointUnpaid = online && method === 'epoint' && pay !== 'paid';
  const codFlow = online && (method === 'cod' || method === 'cash');
  const canStartPrepPending =
    isPaid || (codFlow && (pay === 'unpaid' || pay === 'pending'));

  const referenceTime =
    status === 'preparing' && order.prep_started_at
      ? new Date(order.prep_started_at).getTime()
      : new Date(order.created_at).getTime();
  const elapsedMs = now - referenceTime;
  const elapsedMin = elapsedMs / 60000;

  const estRem = remainingMinutes(order.estimated_ready_at ?? null, now);
  const estMs =
    order.estimated_ready_at != null
      ? new Date(order.estimated_ready_at).getTime() - now
      : null;

  let borderColor = 'border-gray-600';
  let bgColor = 'bg-gray-800';
  let pulse = false;

  if (status === 'pending') {
    borderColor = 'border-gray-600';
    bgColor = 'bg-gray-800';
  } else if (status === 'preparing') {
    if (estRem != null) {
      const u = getUrgencyColor(estRem);
      borderColor = u.border;
      bgColor = u.bg;
      pulse = u.pulse;
    } else {
      if (elapsedMin > 12) {
        borderColor = 'border-red-500';
        bgColor = 'bg-red-900/20';
      } else if (elapsedMin > 8) {
        borderColor = 'border-orange-500';
        bgColor = 'bg-orange-900/20';
      } else {
        borderColor = 'border-blue-500';
        bgColor = 'bg-blue-900/20';
      }
    }
  } else if (status === 'ready') {
    borderColor = 'border-emerald-500';
    bgColor = 'bg-emerald-900/20';
  }

  const paymentBadge = () => {
    if (!online) return null;
    if (method === 'epoint' && pay !== 'paid') {
      return (
        <div className="mb-2 rounded border border-red-500/50 bg-red-950/40 px-2 py-1 text-center text-xs font-semibold text-red-300">
          {t.kdsPaymentPendingOnline}
        </div>
      );
    }
    if (method === 'cod' || method === 'cash') {
      return (
        <div className="mb-2 rounded border border-emerald-500/60 bg-emerald-950/30 px-2 py-1 text-center text-xs font-semibold text-emerald-300">
          {t.kdsPaymentCashCod}
        </div>
      );
    }
    if (pay === 'paid') {
      return (
        <div className="mb-2 rounded border border-emerald-500/60 bg-emerald-950/30 px-2 py-1 text-center text-xs font-semibold text-emerald-300">
          {t.kdsPaymentConfirmed}
        </div>
      );
    }
    return null;
  };

  const renderAction = () => {
    if (status === 'pending' && !isPaid && !online) {
      return (
        <div className="rounded-lg bg-gray-700 px-3 py-2 text-center text-xs font-medium text-gray-400">
          {t.awaitingPayment}
        </div>
      );
    }
    if (status === 'pending' && epointUnpaid) {
      return (
        <div className="rounded-lg bg-gray-700 px-3 py-2 text-center text-xs font-medium text-gray-400">
          {t.awaitingPayment}
        </div>
      );
    }
    if (status === 'pending' && canStartPrepPending) {
      if (prepPickerOpen) {
        const suggest20 = ordersInPrepCount >= 5;
        return (
          <div className="space-y-2">
            <p className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {t.kdsPrepTimeLabel}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {PREP_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onUpdateStatus(order.id, 'preparing', { prepMinutes: m });
                    setPrepPickerOpen(false);
                  }}
                  className={`min-h-[44px] min-w-[56px] rounded-lg text-lg font-semibold transition-colors ${
                    suggest20 && m === 20
                      ? 'bg-cockpit-600 ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
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
              onClick={() => setPrepPickerOpen(false)}
              className="w-full text-xs text-gray-500 hover:text-gray-300"
            >
              {t.cancel}
            </button>
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={() => setPrepPickerOpen(true)}
          className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.startPreparing}
        </button>
      );
    }
    if (status === 'preparing') {
      return (
        <button
          type="button"
          onClick={() => onUpdateStatus(order.id, 'ready')}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {t.markReady}
        </button>
      );
    }
    if (status === 'ready') {
      return (
        <button
          type="button"
          onClick={() => onUpdateStatus(order.id, 'completed')}
          className="w-full rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {t.markCompleted}
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

  return (
    <div className={`${bgColor} border-2 ${borderColor}${pulseClass} flex flex-col rounded-xl p-4 transition-all`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl font-bold text-white">{order.display_number}</span>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{timerLabel}</span>
        </div>
      </div>

      {paymentBadge()}

      <div className="mb-3 flex-1 space-y-1.5">
        {order.sale_items?.map((item) => {
          const mods = (item as SaleItem & { sale_item_modifiers?: SaleItemModifier[] }).sale_item_modifiers;
          if (item.is_combo && item.combo_selections) {
            const cs = item.combo_selections as {
              combo?: string;
              items?: Array<{ group: string; item: string }>;
            };
            return (
              <div key={item.id} className="rounded-lg border border-amber-600/40 bg-black/20 p-2">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">
                  {cs.combo ?? item.product_name}
                </p>
                {cs.items?.map((row, i) => (
                  <p key={i} className="ml-1 text-sm text-gray-200">
                    <span className="text-emerald-400">{item.quantity}×</span> {row.item}{' '}
                    <span className="text-xs text-gray-500">({row.group})</span>
                  </p>
                ))}
              </div>
            );
          }
          return (
            <div key={item.id}>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-sm font-bold text-emerald-400">{item.quantity}×</span>
                <span className="text-sm text-gray-200">{item.product_name}</span>
              </div>
              {mods && mods.length > 0 && (
                <p className="ml-7 text-xs text-gray-500">{mods.map((m) => m.modifier_option_name).join(', ')}</p>
              )}
            </div>
          );
        })}
      </div>

      {order.delivery_notes ? (
        <p className="mb-2 text-xs text-amber-200/90">
          <span className="font-semibold">{t.kdsCourierNoteLabel}:</span> {order.delivery_notes}
        </p>
      ) : null}

      {!isPaid && status === 'pending' && !online && (
        <div className="mb-2 rounded border border-yellow-600/30 bg-yellow-900/30 px-2 py-1 text-center text-xs text-yellow-400">
          {t.unpaid}
        </div>
      )}

      {renderAction()}
    </div>
  );
}
