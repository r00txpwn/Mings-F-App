import { ShoppingBag, User } from 'lucide-react';
import type { Language } from '../translations';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';

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
          <label className="sr-only" htmlFor="ming-lang">
            {languageLabel}
          </label>
          <div className="relative">
            <select
              id="ming-lang"
              value={language}
              onChange={(e) => void onLanguageChange(e.target.value as Language)}
              className="appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 pr-6 text-[11px] font-bold uppercase tracking-wider text-ming-bone transition-colors hover:border-white/20 hover:bg-white/[0.08] focus:border-ming-red/60 focus:outline-none focus:ring-2 focus:ring-ming-red/25 sm:px-2.5 sm:pr-7"
              aria-label={languageLabel}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A6B0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.35rem center',
                backgroundSize: '0.65rem',
              }}
            >
              <option value="en">EN</option>
              <option value="az">AZ</option>
              <option value="ru">RU</option>
            </select>
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
