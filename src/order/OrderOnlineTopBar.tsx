import { ShoppingBag, User } from 'lucide-react';
import type { Language } from '../translations';

interface OrderOnlineTopBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  languageLabel: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  cartAriaLabel: string;
  accountAriaLabel: string;
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
}: OrderOnlineTopBarProps) {
  return (
    <div className="neon-topbar sticky top-0 z-20 flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
        <span className="hidden sm:inline">{languageLabel}</span>
        <select
          className="cockpit-select-compact"
          value={language}
          onChange={(e) => void onLanguageChange(e.target.value as Language)}
          aria-label={languageLabel}
        >
          <option value="en">EN</option>
          <option value="az">AZ</option>
          <option value="ru">RU</option>
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenAccount}
          className="rounded-xl p-2.5 text-slate-300 transition hover:bg-violet-500/15 hover:text-white"
          aria-label={accountAriaLabel}
        >
          <User className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-violet-300 transition hover:bg-violet-500/15"
          onClick={onOpenCart}
          aria-label={cartAriaLabel}
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
