import type { Product } from '../lib/supabase';
import { formatMoneyWithSymbol } from '../lib/money';

interface PosProductGridProps {
  products: Product[];
  onProductTap: (product: Product) => void;
  cartQtyByProduct: (productId: string) => number;
}

export function PosProductGrid({ products, onProductTap, cartQtyByProduct }: PosProductGridProps) {
  if (!products.length) {
    return <p className="text-sm text-slate-400">—</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const qty = cartQtyByProduct(product.id);
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onProductTap(product)}
            className="relative rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cockpit-500/40 hover:bg-white/10"
          >
            {qty > 0 ? (
              <span className="absolute right-2 top-2 rounded-full bg-cockpit-500 px-2 py-0.5 text-xs font-bold text-white">
                {qty}
              </span>
            ) : null}
            <p className="line-clamp-2 text-sm font-semibold text-slate-100">{product.name}</p>
            <p className="mt-1 text-xs text-cockpit-300">{formatMoneyWithSymbol(Number(product.selling_price))}</p>
          </button>
        );
      })}
    </div>
  );
}
