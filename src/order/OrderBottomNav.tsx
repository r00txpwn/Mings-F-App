import type { ReactNode } from 'react';
import { UtensilsCrossed, ShoppingBag, User } from 'lucide-react';

export type OrderNavTab = 'menu' | 'cart' | 'account';

interface OrderBottomNavProps {
  tab: OrderNavTab;
  onChange: (t: OrderNavTab) => void;
  cartCount: number;
  labels: { menu: string; cart: string; account: string };
}

export function OrderBottomNav({ tab, onChange, cartCount, labels }: OrderBottomNavProps) {
  const item = (t: OrderNavTab, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(t)}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors ${
        tab === t ? 'text-violet-300' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <span className="relative">
        {icon}
        {t === 'cart' && cartCount > 0 ? (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-fuchsia-500 px-0.5 text-[9px] text-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-violet-500/25 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {item('menu', <UtensilsCrossed className="h-6 w-6" />, labels.menu)}
        {item('cart', <ShoppingBag className="h-6 w-6" />, labels.cart)}
        {item('account', <User className="h-6 w-6" />, labels.account)}
      </div>
    </nav>
  );
}
