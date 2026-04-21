import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Package, Plus, Search, X } from 'lucide-react';
import type { Category, Product } from '../lib/supabase';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderVenueInfo } from './OrderVenueInfo';

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
  halalBadge: string;
  favoriteAdd: string;
  favoriteRemove: string;
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
  favoriteProductIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  /** When false but user chose delivery, show admin hint (DB must enable delivery). */
  serverAllowsDelivery: boolean;
  deliveryDisabledHint: string;
  /** Right-side slot reserved for persistent cart panel (desktop only). */
  sideSlot?: React.ReactNode;
}

function ProductCard({
  product,
  addLabel,
  halalLabel,
  favoriteAddLabel,
  favoriteRemoveLabel,
  isFavorite,
  onToggleFavorite,
  onAdd,
}: {
  product: Product;
  addLabel: string;
  halalLabel: string;
  favoriteAddLabel: string;
  favoriteRemoveLabel: string;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  onAdd: () => void;
}) {
  const hasMods = (product.modifier_groups?.length ?? 0) > 0;
  return (
    <article
      className="ming-product group cursor-pointer"
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      <div className="ming-product-image">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ming-mute">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="ming-display text-[17px] leading-[1.15] text-ming-bone">{product.name}</h3>
          {product.is_halal ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              {halalLabel}
            </span>
          ) : null}
        </div>
        {product.description ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ming-ash">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-baseline gap-1">
              <span className="ming-price">
                {Number(product.selling_price).toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-ming-red">₼</span>
            </div>
            {hasMods ? (
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ming-mute">
                +options
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={addLabel}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ming-red px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-ming transition-all hover:bg-ming-red-700 hover:shadow-ming-glow active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
          {onToggleFavorite ? (
            <button
              type="button"
              aria-label={isFavorite ? favoriteRemoveLabel : favoriteAddLabel}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                isFavorite
                  ? 'border-ming-red/60 bg-ming-red/20 text-ming-red'
                  : 'border-white/10 bg-white/[0.04] text-ming-ash hover:text-ming-bone'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function OrderMenuBrowseView({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  labels,
  onAddProduct,
  favoriteProductIds = [],
  onToggleFavorite,
  serverAllowsDelivery,
  deliveryDisabledHint,
  fulfillment,
  hoursLine,
  venueAddress,
  venuePhone,
  sideSlot,
}: OrderMenuBrowseViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const chipsRef = useRef<HTMLDivElement | null>(null);

  const fuzzyMatch = (text: string, query: string): boolean => {
    const source = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (source.includes(q)) return true;
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) return tokens.every((token) => source.includes(token));
    let qi = 0;
    for (let i = 0; i < source.length && qi < q.length; i += 1) {
      if (source[i] === q[qi]) qi += 1;
    }
    return qi === q.length;
  };

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        fuzzyMatch(p.name, q) ||
        fuzzyMatch(p.description ?? '', q)
    );
  }, [products, searchQuery]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  useEffect(() => {
    if (selectedCategoryId === ALL) return;
    const host = chipsRef.current;
    if (!host) return;
    const active = host.querySelector<HTMLElement>(`[data-cat-id="${selectedCategoryId}"]`);
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedCategoryId]);

  const handlePickCategory = (id: string) => {
    onSelectCategory(id);
    if (id !== ALL) {
      const el = document.getElementById(`ming-cat-${id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const chip = (id: string, label: string) => {
    const active = selectedCategoryId === id;
    return (
      <button
        key={id}
        data-cat-id={id}
        type="button"
        onClick={() => handlePickCategory(id)}
        className={`ming-chip snap-start ${active ? 'ming-chip-active' : ''}`}
      >
        {label}
      </button>
    );
  };

  const renderProducts = () => {
    const searching = searchQuery.trim().length > 0;

    if (searching) {
      if (searchFiltered.length === 0) {
        return (
          <div className="ming-card flex flex-col items-center gap-2 p-10 text-center">
            <Search className="h-6 w-6 text-ming-mute" />
            <p className="text-sm text-ming-ash">{labels.orderSearchNoResults}</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
          {searchFiltered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              addLabel={labels.orderAddToCart}
              halalLabel={labels.halalBadge}
              favoriteAddLabel={labels.favoriteAdd}
              favoriteRemoveLabel={labels.favoriteRemove}
              isFavorite={favoriteProductIds.includes(p.id)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(p.id) : undefined}
              onAdd={() => onAddProduct(p)}
            />
          ))}
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
              <section
                key={cat.id}
                id={`ming-cat-${cat.id}`}
                className="scroll-mt-[168px] lg:scroll-mt-24"
              >
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 className="ming-section-title">{cat.name}</h2>
                  <span className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-ming-mute sm:block">
                    {list.length} {list.length === 1 ? 'dish' : 'dishes'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                  {list.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      addLabel={labels.orderAddToCart}
                      halalLabel={labels.halalBadge}
                      favoriteAddLabel={labels.favoriteAdd}
                      favoriteRemoveLabel={labels.favoriteRemove}
                      isFavorite={favoriteProductIds.includes(p.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(p.id) : undefined}
                      onAdd={() => onAddProduct(p)}
                    />
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
      <section>
        <h2 className="ming-section-title mb-4">{title}</h2>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.06] bg-ming-charcoal p-8 text-center text-sm text-ming-ash">
            {labels.orderSearchNoResults}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                addLabel={labels.orderAddToCart}
                halalLabel={labels.halalBadge}
                favoriteAddLabel={labels.favoriteAdd}
                favoriteRemoveLabel={labels.favoriteRemove}
                isFavorite={favoriteProductIds.includes(p.id)}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(p.id) : undefined}
                onAdd={() => onAddProduct(p)}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-0 lg:flex-row lg:gap-8 lg:px-10">
      {/* Sticky category chip rail — always visible */}
      <div className="sticky top-[48px] z-20 -mx-0 border-b border-white/[0.04] bg-ming-ink/85 backdrop-blur-xl lg:static lg:top-0 lg:order-1 lg:hidden">
        <div className="relative">
          <div
            ref={chipsRef}
            className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-3 sm:px-5"
            aria-label="Categories"
            role="tablist"
          >
            {chip(ALL, labels.allCategories)}
            {categories.map((c) => chip(c.id, c.name))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ming-ink/90 to-transparent"
          />
        </div>
      </div>

      {/* Desktop left rail */}
      <aside className="hidden shrink-0 pt-6 lg:block lg:w-60 lg:pt-8">
        <div className="sticky top-20 space-y-2">
          <p className="ming-eyebrow mb-3 px-2">Menu</p>
          <nav aria-label="Categories" className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handlePickCategory(ALL)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                selectedCategoryId === ALL
                  ? 'bg-white/[0.08] text-ming-bone'
                  : 'text-ming-ash hover:bg-white/[0.04] hover:text-ming-bone'
              }`}
            >
              {labels.allCategories}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handlePickCategory(c.id)}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  selectedCategoryId === c.id
                    ? 'bg-white/[0.08] text-ming-bone'
                    : 'text-ming-ash hover:bg-white/[0.04] hover:text-ming-bone'
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main column */}
      <main className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-5 lg:order-2 lg:px-0 lg:pb-24 lg:pt-8">
        {/* Search bar + delivery hint row */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ming-mute"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.orderSearchMenu}
              className="ming-input pl-10"
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ming-ash hover:text-ming-bone"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {!serverAllowsDelivery && fulfillment === 'delivery' ? (
          <p
            role="status"
            className="mb-5 rounded-xl border border-ming-gold/40 bg-ming-gold/10 px-4 py-3 text-[13px] leading-relaxed text-ming-gold"
          >
            {deliveryDisabledHint}
          </p>
        ) : null}

        {renderProducts()}

        {/* Venue info block (compact, bottom of page) */}
        <div className="mt-12">
          <OrderVenueInfo
            hoursLine={hoursLine}
            address={venueAddress}
            phone={venuePhone}
            labels={{
              hours: labels.orderVenueHours,
              address: labels.orderVenueAddress,
              phone: labels.orderVenuePhone,
              infoTitle: labels.orderVenueInfoTitle,
            }}
            compact
          />
        </div>
      </main>

      {/* Desktop right side slot (persistent cart panel) */}
      {sideSlot ? (
        <aside className="hidden shrink-0 pt-8 lg:order-3 lg:block lg:w-[360px]">
          <div className="sticky top-20">{sideSlot}</div>
        </aside>
      ) : null}
    </div>
  );
}

export { ALL as ORDER_MENU_ALL_CATEGORY_ID };
