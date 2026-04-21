import { ShoppingBag, User } from 'lucide-react';
import type { Language } from '../translations';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

interface OrderOnlineTopBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  languageLabel: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  cartAriaLabel: string;
  accountAriaLabel: string;

  fulfillment: OnlineFulfillmentType;
  onFulfillmentChange: (f: OnlineFulfillmentType) => void;
  showTakeaway: boolean;
  showDelivery: boolean;
  fulfillmentLabel: string;
  takeawayLabel: string;
  deliveryLabel: string;

  /** Hide cart/account on surfaces where bottom nav already owns them (mobile menu tab). */
  hideAccountButton?: boolean;
  hideCartButton?: boolean;
}

export function OrderOnlineTopBar({
  language,
  onLanguageChange,
  languageLabel,
  cartCount,
  onOpenCart,
  onOpenAccount,
  cartAriaLabel,
  accountAriaLabel,
  fulfillment,
  onFulfillmentChange,
  showTakeaway,
  showDelivery,
  fulfillmentLabel,
  takeawayLabel,
  deliveryLabel,
  hideAccountButton,
  hideCartButton,
}: OrderOnlineTopBarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-ming-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ming-red text-white shadow-ming">
            <span className="ming-display text-[15px] leading-none">M</span>
          </span>
          <div className="min-w-0 flex-1">
            <OrderFulfillmentPicker
              fulfillment={fulfillment}
              onChange={onFulfillmentChange}
              showTakeaway={showTakeaway}
              showDelivery={showDelivery}
              label={fulfillmentLabel}
              takeawayLabel={takeawayLabel}
              deliveryLabel={deliveryLabel}
              variant="pill"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div
            className="inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-0.5"
            role="group"
            aria-label={languageLabel}
          >
            {LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange(lang.code)}
                  aria-pressed={active}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors sm:px-2.5 ${
                    active
                      ? 'bg-ming-red/25 text-ming-bone ring-1 ring-ming-red/60'
                      : 'text-ming-ash hover:bg-white/[0.08] hover:text-ming-bone'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          {hideAccountButton ? null : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="ming-iconbtn"
              aria-label={accountAriaLabel}
            >
              <User className="h-4.5 w-4.5" />
            </button>
          )}

          {hideCartButton ? null : (
            <button
              type="button"
              onClick={onOpenCart}
              className="ming-iconbtn"
              aria-label={cartAriaLabel}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ming-red px-1 text-[10px] font-bold text-white shadow-ming">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
