import { useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import type { Category, Product } from '../lib/supabase';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentHeroCard } from './OrderFulfillmentHeroCard';
import { OrderVenueSidebar } from './OrderVenueSidebar';

const ALL = '__all__';

export interface OrderMenuBrowseLabels {
  allCategories: string;
  orderChooseFulfillmentTitle: string;
  orderFulfillmentTakeaway: string;
  orderFulfillmentDelivery: string;
  orderSearchMenu: string;
  orderVenueInfoTitle: string;
  orderVenueHours: string;
  orderVenueAddress: string;
  orderVenuePhone: string;
  orderAddToCart: string;
  orderSearchNoResults: string;
}

interface OrderMenuBrowseViewProps {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  fulfillment: OnlineFulfillmentType;
  onFulfillmentChange: (f: OnlineFulfillmentType) => void;
  showTakeaway: boolean;
  showDelivery: boolean;
  hoursLine: string | null;
  venueAddress: string;
  venuePhone: string;
  labels: OrderMenuBrowseLabels;
  onAddProduct: (p: Product) => void;
  /** When false but user chose delivery, show admin hint (DB must enable delivery). */
  serverAllowsDelivery: boolean;
  deliveryDisabledHint: string;
}

function ProductRow({
  product,
  addLabel,
  onAdd,
}: {
  product: Product;
  addLabel: string;
  onAdd: () => void;
}) {
  const modHint =
    product.modifier_groups && product.modifier_groups.length > 0 ? ' · +' : '';
  return (
    <div className="group relative flex gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-950/80 p-4 pb-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-amber-500/25 hover:shadow-lg hover:shadow-black/40">
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-white">{product.name}</h3>
        <p className="mt-1 font-mono text-base font-semibold text-amber-400">
          ₼{Number(product.selling_price).toFixed(2)}
          {modHint ? <span className="text-xs font-normal text-slate-500">{modHint}</span> : null}
        </p>
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{product.description}</p>
        ) : null}
      </div>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800 shadow-inner sm:h-28 sm:w-28">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-10 w-10 text-zinc-600" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-xl border border-amber-500/50 bg-black/50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-amber-300 backdrop-blur-sm transition hover:border-amber-400 hover:bg-amber-500/15 hover:text-amber-200"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

export function OrderMenuBrowseView({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  fulfillment,
  onFulfillmentChange,
  showTakeaway,
  showDelivery,
  hoursLine,
  venueAddress,
  venuePhone,
  labels,
  onAddProduct,
  serverAllowsDelivery,
  deliveryDisabledHint,
}: OrderMenuBrowseViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [products, searchQuery]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const venueSidebar = (
    <OrderVenueSidebar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      hoursLine={hoursLine}
      address={venueAddress}
      phone={venuePhone}
      labels={{
        search: labels.orderSearchMenu,
        hours: labels.orderVenueHours,
        address: labels.orderVenueAddress,
        phone: labels.orderVenuePhone,
        infoTitle: labels.orderVenueInfoTitle,
      }}
    />
  );

  const renderProducts = () => {
    const searching = searchQuery.trim().length > 0;

    if (searching) {
      return (
        <div className="space-y-3">
          {searchFiltered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">{labels.orderSearchNoResults}</p>
          ) : (
            searchFiltered.map((p) => (
              <ProductRow key={p.id} product={p} addLabel={labels.orderAddToCart} onAdd={() => onAddProduct(p)} />
            ))
          )}
        </div>
      );
    }

    if (selectedCategoryId === ALL) {
      return (
        <div className="space-y-10">
          {categories.map((cat) => {
            const list = searchFiltered.filter((p) => p.master_category_id === cat.id);
            if (list.length === 0) return null;
            return (
              <section key={cat.id} id={`order-cat-${cat.id}`} className="scroll-mt-28">
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-amber-400/95 drop-shadow-sm">
                  {cat.name}
                </h2>
                <div className="space-y-3">
                  {list.map((p) => (
                    <ProductRow key={p.id} product={p} addLabel={labels.orderAddToCart} onAdd={() => onAddProduct(p)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      );
    }

    const list = searchFiltered.filter((p) => p.master_category_id === selectedCategoryId);
    const title = categoryNameById.get(selectedCategoryId) ?? labels.allCategories;
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-amber-400/95">{title}</h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.allCategories}</p>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <ProductRow key={p.id} product={p} addLabel={labels.orderAddToCart} onAdd={() => onAddProduct(p)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const railBtn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        onSelectCategory(id);
        if (id !== ALL) {
          const el = document.getElementById(`order-cat-${id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        selectedCategoryId === id
          ? 'bg-gradient-to-r from-amber-500/20 to-cockpit-600/20 text-white ring-1 ring-amber-500/30'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 pb-32 lg:flex-row lg:gap-8 lg:pb-40 lg:pt-2">
      <aside className="w-full shrink-0 space-y-4 px-4 lg:sticky lg:top-0 lg:w-64 lg:self-start lg:px-0 lg:pr-1">
        <OrderFulfillmentHeroCard
          fulfillment={fulfillment}
          onChange={onFulfillmentChange}
          showTakeaway={showTakeaway}
          showDelivery={showDelivery}
          label={labels.orderChooseFulfillmentTitle}
          takeawayLabel={labels.orderFulfillmentTakeaway}
          deliveryLabel={labels.orderFulfillmentDelivery}
          hoursLine={hoursLine}
        />

        {!serverAllowsDelivery && fulfillment === 'delivery' ? (
          <p
            role="status"
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95"
          >
            {deliveryDisabledHint}
          </p>
        ) : null}

        <nav className="hidden flex-col gap-1 lg:flex" aria-label="Categories">
          {railBtn(ALL, labels.allCategories)}
          {categories.map((c) => railBtn(c.id, c.name))}
        </nav>

        <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin lg:hidden" aria-label="Categories">
          <button
            type="button"
            onClick={() => onSelectCategory(ALL)}
            className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              selectedCategoryId === ALL ? 'bg-cockpit-600 text-white' : 'bg-white/5 text-slate-300'
            }`}
          >
            {labels.allCategories}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelectCategory(c.id);
              }}
              className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategoryId === c.id ? 'bg-cockpit-600 text-white' : 'bg-white/5 text-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-8">
        <div className="px-4 lg:hidden">{venueSidebar}</div>

        <main className="min-w-0 flex-1 space-y-6 px-4 lg:px-0">{renderProducts()}</main>

        <aside className="hidden w-full shrink-0 lg:block lg:w-72 lg:px-0">{venueSidebar}</aside>
      </div>
    </div>
  );
}

export { ALL as ORDER_MENU_ALL_CATEGORY_ID };
