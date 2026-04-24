import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartItem } from '../lib/supabase';
import { Price } from '../components/Price';
import { formatMoneyWithSymbol } from '../lib/money';

interface OrderCartViewProps {
  cart: CartItem[];
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  showDeliveryFee: boolean;
  onUpdateQty: (cartItemKey: string, delta: number) => void;
  onUpdateNotes: (cartItemKey: string, notes: string) => void;
  onRemoveLine: (cartItemKey: string) => void;
  onCheckout: () => void;
  /** Overrides `labels.continueCheckout` (e.g. schedule fallback CTA). */
  checkoutCtaLabel?: string;
  /** Extra classes on checkout CTA (e.g. closing-soon pulse). */
  checkoutCtaClassName?: string;
  userLoggedIn: boolean;
  onBackToMenu: () => void;
  labels: {
    title: string;
    empty: string;
    emptyAction: string;
    subtotal: string;
    deliveryFee: string;
    total: string;
    continueCheckout: string;
    authRequired: string;
    itemNotes: string;
    itemNotesPlaceholder: string;
    removeLine: string;
    decreaseQty: string;
    increaseQty: string;
    itemsCountLabel: string;
  };
  /** Render as persistent desktop side panel instead of full view. */
  variant?: 'view' | 'panel';
}

export function OrderCartView({
  cart,
  cartTotal,
  deliveryFee,
  grandTotal,
  showDeliveryFee,
  onUpdateQty,
  onUpdateNotes,
  onRemoveLine,
  onCheckout,
  checkoutCtaLabel,
  checkoutCtaClassName,
  userLoggedIn,
  onBackToMenu,
  labels,
  variant = 'view',
}: OrderCartViewProps) {
  const isPanel = variant === 'panel';
  const isEmpty = cart.length === 0;
  const checkoutLabel = checkoutCtaLabel ?? labels.continueCheckout;

  const summary = !isEmpty && (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ming-ash">{labels.subtotal}</span>
        <Price amount={cartTotal} className="ming-mono font-semibold text-ming-bone" />
      </div>
      {showDeliveryFee ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ming-ash">{labels.deliveryFee}</span>
          <Price amount={deliveryFee} className="ming-mono font-semibold text-ming-bone" />
        </div>
      ) : null}
      <div className="ming-divider my-2" />
      <div className="flex items-baseline justify-between">
        <span className="ming-label">{labels.total}</span>
        <Price
          amount={grandTotal}
          className="ming-display text-2xl text-ming-gold"
          valueClassName="ming-mono"
          symbolClassName="text-base"
        />
      </div>
    </div>
  );

  const items = (
    <ul className="space-y-2.5">
      {cart.map((item) => {
        const modTotal = Object.values(item.selectedModifiers)
          .flat()
          .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
        const linePrice = (Number(item.product.selling_price) + modTotal) * item.quantity;
        const groupOrder = new Map<string, number>(
          (item.product.modifier_groups ?? []).map((group, index) => [group.id, index])
        );
        const modNames = Object.entries(item.selectedModifiers)
          .sort(([groupA], [groupB]) => (groupOrder.get(groupA) ?? 999) - (groupOrder.get(groupB) ?? 999))
          .map(([groupId, options]) => {
            const groupName =
              (item.product.modifier_groups ?? []).find((group) => group.id === groupId)?.name?.trim() ?? '';
            const optionCounts = new Map<string, number>();
            options.forEach((option) => {
              const name = String(option.name ?? '').trim();
              if (!name) return;
              optionCounts.set(name, (optionCounts.get(name) ?? 0) + 1);
            });
            const optionSummary = Array.from(optionCounts.entries())
              .map(([name, count]) => (count > 1 ? `${count} x ${name}` : name))
              .join(', ');
            if (!optionSummary) return '';
            return groupName ? `${groupName}: ${optionSummary}` : optionSummary;
          })
          .filter(Boolean)
          .join(' · ');
        return (
          <li
            key={item.cartItemKey}
            className="ming-card flex items-start gap-3 p-3"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ming-graphite">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ming-mute">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-[15px] font-semibold text-ming-bone">
                  {item.product.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveLine(item.cartItemKey)}
                  className="shrink-0 rounded-lg p-1.5 text-ming-mute transition-colors hover:bg-white/[0.06] hover:text-ming-red"
                  aria-label={labels.removeLine}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {modNames ? (
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ming-ash">{modNames}</p>
              ) : null}
              <label className="mt-2 block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ming-ash">
                  {labels.itemNotes}
                </span>
                <textarea
                  value={item.notes}
                  onChange={(e) => onUpdateNotes(item.cartItemKey, e.target.value)}
                  placeholder={labels.itemNotesPlaceholder}
                  className="ming-input min-h-[64px] resize-y py-2.5 text-[13px]"
                />
              </label>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="ming-stepper">
                  <button
                    type="button"
                    className="ming-stepper-btn"
                    onClick={() => onUpdateQty(item.cartItemKey, -1)}
                    aria-label={labels.decreaseQty}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="ming-mono min-w-[1.75rem] text-center text-[14px] font-bold text-ming-bone">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="ming-stepper-btn"
                    onClick={() => onUpdateQty(item.cartItemKey, 1)}
                    aria-label={labels.increaseQty}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Price amount={linePrice} className="ming-mono text-[15px] font-bold text-ming-bone" />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
        <ShoppingBag className="h-7 w-7 text-ming-mute" />
      </div>
      <div>
        <p className="ming-display text-[20px] text-ming-bone">{labels.empty}</p>
      </div>
      <button type="button" onClick={onBackToMenu} className="ming-btn-ghost">
        {labels.emptyAction}
      </button>
    </div>
  );

  if (isPanel) {
    return (
      <aside className="ming-card flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="ming-display text-lg text-ming-bone">{labels.title}</h2>
          {!isEmpty ? (
            <span className="ming-label">
              {cart.reduce((s, i) => s + i.quantity, 0)} {labels.itemsCountLabel}
            </span>
          ) : null}
        </div>
        <div className="ming-scroll relative flex-1 overflow-y-auto px-5 py-4 ming-fade-b">
          {isEmpty ? emptyState : items}
        </div>
        {!isEmpty ? (
          <div className="border-t border-white/[0.06] bg-ming-ink/30 p-5">
            {summary}
            {!userLoggedIn ? (
              <p className="mt-3 rounded-lg border border-ming-gold/40 bg-ming-gold/10 px-3 py-2 text-[12px] text-ming-gold">
                {labels.authRequired}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onCheckout}
              className={`ming-btn-primary mt-4 w-full ${checkoutCtaClassName ?? ''}`}
            >
              {checkoutLabel}
            </button>
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-40 pt-6 sm:px-6 lg:pb-20">
      <header>
        <p className="ming-eyebrow mb-1">Ming&apos;s · Cart</p>
        <h1 className="ming-display text-[28px] leading-tight text-ming-bone sm:text-[32px]">
          {labels.title}
        </h1>
      </header>
      {isEmpty ? emptyState : items}
      {!isEmpty ? (
        <div className="ming-card p-5">
          {summary}
          {!userLoggedIn ? (
            <p className="mt-3 rounded-lg border border-ming-gold/40 bg-ming-gold/10 px-3 py-2 text-[12px] text-ming-gold">
              {labels.authRequired}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onCheckout}
            className={`ming-btn-primary mt-5 w-full py-4 ${checkoutCtaClassName ?? ''}`}
          >
            {checkoutLabel} · {formatMoneyWithSymbol(grandTotal)}
          </button>
        </div>
      ) : null}
    </div>
  );
}
