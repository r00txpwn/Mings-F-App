import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { CartItem } from '../lib/supabase';
import { formatMoneyWithSymbol } from '../lib/money';

interface PosCartSidebarProps {
  cart: CartItem[];
  total: number;
  deliveryFee: number;
  submitting: boolean;
  onUpdateQty: (cartItemKey: string, delta: number) => void;
  onRemove: (cartItemKey: string) => void;
  onSubmit: () => void;
}

export function PosCartSidebar({
  cart,
  total,
  deliveryFee,
  submitting,
  onUpdateQty,
  onRemove,
  onSubmit,
}: PosCartSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/80 p-3">
      <h3 className="mb-2 text-sm font-semibold text-cockpit-200">{t.posCartTitle}</h3>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-sm text-slate-400">{t.posCartEmpty}</p>
        ) : (
          cart.map((item) => {
            const modTotal = Object.values(item.selectedModifiers)
              .flat()
              .reduce((s, o) => s + Number(o.price_adjustment), 0);
            const lineTotal = (Number(item.product.selling_price) + modTotal) * item.quantity;
            const modNames = Object.values(item.selectedModifiers)
              .flat()
              .map((o) => o.name)
              .join(', ');
            return (
              <div key={item.cartItemKey} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-100">{item.product.name}</p>
                    {modNames ? <p className="text-xs text-slate-400">{modNames}</p> : null}
                    <p className="text-xs text-cockpit-300">{formatMoneyWithSymbol(lineTotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.cartItemKey)}
                    className="text-slate-400 hover:text-rose-300"
                    aria-label={t.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.cartItemKey, -1)}
                    className="rounded border border-white/10 p-1"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.cartItemKey, 1)}
                    className="rounded border border-white/10 p-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm">
        {deliveryFee > 0 ? (
          <div className="flex justify-between text-slate-300">
            <span>{t.deliveryFee}</span>
            <span>{formatMoneyWithSymbol(deliveryFee)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold text-slate-100">
          <span>{t.total}</span>
          <span>{formatMoneyWithSymbol(total)}</span>
        </div>
      </div>
      <button
        type="button"
        disabled={submitting || cart.length === 0}
        onClick={onSubmit}
        className="mt-3 w-full rounded-lg bg-cockpit-500 py-2.5 text-sm font-bold text-white hover:bg-cockpit-400 disabled:opacity-50"
      >
        {submitting ? t.pleaseWait : t.posSubmitOrder}
      </button>
    </aside>
  );
}
