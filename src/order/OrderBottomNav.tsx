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
  const item = (id: OrderNavTab, icon: ReactNode, label: string) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => onChange(id)}
        className="group relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold tracking-wide transition-colors"
        aria-current={active ? 'page' : undefined}
      >
        <span
          className={`relative flex h-9 w-14 items-center justify-center rounded-full transition-all duration-200 ${
            active ? 'bg-ming-red text-white shadow-ming' : 'text-ming-ash group-hover:text-ming-bone'
          }`}
        >
          {icon}
          {id === 'cart' && cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-ming-gold px-1 text-[10px] font-bold text-ming-ink">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </span>
        <span className={active ? 'text-ming-bone' : 'text-ming-ash'}>{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-ming-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {item('menu', <UtensilsCrossed className="h-5 w-5" />, labels.menu)}
        {item('cart', <ShoppingBag className="h-5 w-5" />, labels.cart)}
        {item('account', <User className="h-5 w-5" />, labels.account)}
      </div>
    </nav>
  );
}
