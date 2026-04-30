import { ShoppingBag, User } from 'lucide-react';
import type { Language } from '../translations';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';
import { orderBrandAssets } from './orderDesign';

const LANGUAGES: { code: Language; srLabel: string; flag: string }[] = [
  { code: 'en', srLabel: 'English', flag: '🇬🇧' },
  { code: 'az', srLabel: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'ru', srLabel: 'Russian', flag: '🇷🇺' },
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
  const activeLanguage = LANGUAGES.find((lang) => lang.code === language) ?? LANGUAGES[0];
  const nextLanguage = LANGUAGES[(LANGUAGES.findIndex((lang) => lang.code === language) + 1) % LANGUAGES.length];

  return (
    <div className="sticky top-0 z-30 border-b border-black/5 bg-[rgba(180,230,220,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-1.5 px-2.5 py-2 sm:gap-3 sm:px-5 sm:py-2.5 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span aria-hidden className="flex h-9 w-[5.6rem] shrink-0 items-center justify-center rounded-2xl bg-white px-2 shadow-[4px_4px_0_rgba(40,20,20,0.18)] sm:w-28">
            <img src={orderBrandAssets.wordmark} alt="" className="max-h-5 w-full object-contain" />
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
          <button
            type="button"
            onClick={() => onLanguageChange(nextLanguage.code)}
            aria-label={languageLabel}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-2 text-[11px] font-black uppercase text-[color:var(--order-ink)] shadow-[3px_3px_0_rgba(40,20,20,0.12)] sm:hidden"
          >
            {activeLanguage.code}
          </button>
          <div
            className="hidden items-center gap-0.5 rounded-2xl border border-black/10 bg-white p-0.5 shadow-[3px_3px_0_rgba(40,20,20,0.12)] sm:inline-flex"
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
                  aria-label={lang.srLabel}
                  aria-pressed={active}
                  className={`rounded-lg px-2 py-1.5 text-base leading-none transition-colors sm:px-2.5 ${
                    active
                      ? 'bg-[color:var(--order-coral)] text-white'
                      : 'text-[color:var(--order-ink)] hover:bg-[color:var(--order-mint)]'
                  }`}
                >
                  <span aria-hidden>{lang.flag}</span>
                </button>
              );
            })}
          </div>

          {hideAccountButton ? null : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="ming-iconbtn hidden sm:inline-flex"
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
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[color:var(--order-coral)] px-1 text-[10px] font-black text-white shadow-[2px_2px_0_var(--order-ink)]">
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
