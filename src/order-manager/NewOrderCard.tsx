import { MapPin, Phone, ShoppingBag, Truck, User, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  isCashDeliveryMethod,
  isCashPickupMethod,
} from '../lib/onlinePaymentMethod';
import { getCustomerDisplayName, isPendingOnlinePayment, type OrderManagerOrder } from './types';
import { OrderItemSummary } from './OrderItemSummary';

const PREP_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

interface NewOrderCardProps {
  order: OrderManagerOrder;
  onAccept: (prepMinutes: number) => void;
  onMarkPaid: () => void;
  onReject?: (reason: string, note?: string) => void;
  disabled?: boolean;
}

export function NewOrderCard({ order, onAccept, onMarkPaid, onReject, disabled }: NewOrderCardProps) {
  const { t } = useLanguage();
  const [prepMinutes, setPrepMinutes] = useState<number>(5);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const pendingCard = isPendingOnlinePayment(order);

  const sourceLabel = useMemo(() => {
    if (order.source === 'online_delivery') return t.omSourceDelivery;
    if (order.source === 'online_takeaway') return t.omSourceTakeaway;
    return t.omSourceKiosk;
  }, [order.source, t]);
  const sourceVisual = useMemo(() => {
    if (order.source === 'online_delivery') {
      return {
        borderClass: 'border-blue-500/50',
        badgeClass: 'bg-blue-500/20 text-blue-300',
        Icon: Truck,
        iconClass: 'text-blue-300',
      };
    }
    if (order.source === 'online_takeaway') {
      return {
        borderClass: 'border-white/10',
        badgeClass: 'bg-cockpit-500/15 text-cockpit-300',
        Icon: ShoppingBag,
        iconClass: 'text-cockpit-300',
      };
    }
    return {
      borderClass: 'border-white/10',
      badgeClass: 'bg-slate-500/20 text-slate-300',
      Icon: UtensilsCrossed,
      iconClass: 'text-slate-300',
    };
  }, [order.source]);
  const customerDisplay = getCustomerDisplayName(order);

  const resetRejectPanel = () => {
    setShowRejectPanel(false);
    setRejectReason('');
    setRejectNote('');
  };

  const handleConfirmReject = () => {
    if (!rejectReason || !onReject) return;
    onReject(rejectReason, rejectReason === 'other' ? rejectNote : undefined);
  };

  return (
    <article className={`neon-card flex flex-col gap-2 rounded-xl border p-3 ${sourceVisual.borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${sourceVisual.badgeClass}`}
            >
              <sourceVisual.Icon className={`h-3 w-3 ${sourceVisual.iconClass}`} />
              {sourceLabel}
            </span>
            <span className="text-xs text-slate-400">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
          </div>
          {(order.source === 'online_delivery' || order.source === 'online_takeaway') && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {pendingCard ? (
                <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  {t.payMethodBadgeCardAuthorizing}
                </span>
              ) : isCashPickupMethod(order.online_payment_method, order.source) ? (
                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                  {t.payMethodBadgeCashPickup}
                </span>
              ) : isCashDeliveryMethod(order.online_payment_method, order.source) ? (
                <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                  {t.payMethodBadgeCashDelivery}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {customerDisplay ? (
        <p className="inline-flex items-center gap-1 text-xs text-slate-300">
          <User className="h-3 w-3" />
          {t.woltCopyCustomer}: {customerDisplay}
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.orderDetails}</p>
        <OrderItemSummary items={order.sale_items} />
      </div>

      {order.customer_phone ? (
        <p className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Phone className="h-3 w-3" />
          {order.customer_phone}
        </p>
      ) : null}
      {order.delivery_address ? (
        <p
          className={`inline-flex items-start gap-1 text-xs ${
            order.source === 'online_delivery' ? 'text-blue-200' : 'text-slate-400'
          }`}
        >
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{order.delivery_address}</span>
        </p>
      ) : null}

      {!showRejectPanel ? (
        <div className="mt-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.omPrepTime}</p>
          <div className="flex flex-wrap gap-1.5">
            {PREP_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPrepMinutes(v)}
                className={`min-h-[40px] min-w-[44px] rounded-md px-2 py-1.5 text-sm font-semibold transition-colors ${
                  prepMinutes === v
                    ? 'bg-cockpit-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!showRejectPanel && pendingCard ? (
        <button
          type="button"
          onClick={onMarkPaid}
          disabled={disabled}
          className="mt-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-60"
        >
          {t.confirmPayment}
        </button>
      ) : null}

      {!showRejectPanel ? (
        <button
          type="button"
          onClick={() => onAccept(prepMinutes)}
          disabled={disabled || pendingCard}
          className="neon-btn-primary mt-1 rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.omAccept}
        </button>
      ) : null}

      {!showRejectPanel && onReject ? (
        <button
          type="button"
          onClick={() => setShowRejectPanel(true)}
          disabled={disabled}
          className="text-left text-xs text-rose-400 underline underline-offset-2 hover:text-rose-300 disabled:opacity-50"
        >
          {t.omRejectOrder}
        </button>
      ) : null}

      {showRejectPanel && onReject ? (
        <div className="mt-1 space-y-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3">
          <select
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              if (e.target.value !== 'other') setRejectNote('');
            }}
            disabled={disabled}
            className="cockpit-select w-full"
          >
            <option value="" disabled>
              {t.omRejectSelectReason}
            </option>
            <option value="item_unavailable">{t.omRejectReasonItemUnavailable}</option>
            <option value="too_busy">{t.omRejectReasonTooBusy}</option>
            <option value="zone_issue">{t.omRejectReasonZoneIssue}</option>
            <option value="customer_request">{t.omRejectReasonCustomerRequest}</option>
            <option value="other">{t.omRejectReasonOther}</option>
          </select>

          {rejectReason === 'other' ? (
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value.slice(0, 200))}
              placeholder={t.omRejectNotePlaceholder}
              rows={2}
              maxLength={200}
              disabled={disabled}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cockpit-500 focus:outline-none"
            />
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetRejectPanel}
              disabled={disabled}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              {t.omRejectCancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={disabled || !rejectReason}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.omRejectConfirm}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
