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
        className="group relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-black uppercase tracking-wide transition-colors"
        aria-current={active ? 'page' : undefined}
      >
        <span
          className={`relative flex h-9 w-14 items-center justify-center rounded-full transition-all duration-200 ${
            active
              ? 'bg-[color:var(--order-coral)] text-white shadow-[4px_4px_0_var(--order-ink)]'
              : 'bg-white text-[rgba(40,20,20,0.62)] shadow-[2px_2px_0_rgba(40,20,20,0.12)] group-hover:text-[color:var(--order-ink)]'
          }`}
        >
          {icon}
          {id === 'cart' && cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[color:var(--order-orange)] px-1 text-[10px] font-black text-[color:var(--order-ink)]">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </span>
        <span className={active ? 'text-[color:var(--order-ink)]' : 'text-[rgba(40,20,20,0.58)]'}>{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-[rgba(180,230,220,0.92)] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(40,20,20,0.10)] backdrop-blur-xl lg:hidden"
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
