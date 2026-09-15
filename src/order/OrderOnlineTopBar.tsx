import { ShoppingBag, User } from 'lucide-react';
import type { Language } from '../translations';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';
import { OrderLangChips } from './OrderLangChips';

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
  const fulfillmentPicker = (
    <OrderFulfillmentPicker
      fulfillment={fulfillment}
      onChange={onFulfillmentChange}
      showTakeaway={showTakeaway}
      showDelivery={showDelivery}
      label={fulfillmentLabel}
      takeawayLabel={takeawayLabel}
      deliveryLabel={deliveryLabel}
    />
  );

  const langs = (
    <OrderLangChips language={language} onChange={onLanguageChange} label={languageLabel} />
  );

  const actions = (
    <div className="flex shrink-0 items-center gap-1.5">
      {hideAccountButton ? null : (
        <button type="button" onClick={onOpenAccount} className="sf-icon-btn" aria-label={accountAriaLabel}>
          <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      )}
      {hideCartButton ? null : (
        <button type="button" onClick={onOpenCart} className="sf-icon-btn" aria-label={cartAriaLabel}>
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {cartCount > 0 ? <span className="sf-cart-count">{cartCount > 99 ? '99+' : cartCount}</span> : null}
        </button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-surface">
      <div className="mx-auto w-full max-w-[390px] md:hidden">
        <div className="flex min-h-14 items-center gap-2.5 px-4 py-2">
          <p className="sf-logo">
            Ming&apos;<span>s</span>
          </p>
          <div className="ml-auto">{actions}</div>
        </div>
        <div className="flex items-center gap-2.5 px-4 pb-2.5">
          {fulfillmentPicker}
          {langs}
        </div>
      </div>
      <div className="mx-auto hidden w-full max-w-[1080px] grid-cols-[auto_auto_1fr_auto_auto] items-center gap-x-4 px-6 py-2.5 md:grid">
        <p className="sf-logo">
          Ming&apos;<span>s</span>
        </p>
        {fulfillmentPicker}
        <span aria-hidden />
        {langs}
        {actions}
      </div>
    </header>
  );
}
