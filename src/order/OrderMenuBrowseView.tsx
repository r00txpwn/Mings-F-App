import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Search, X } from 'lucide-react';
import type { Category, Product } from '../lib/supabase';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderVenueInfo } from './OrderVenueInfo';
import { OrderPhotoPlaceholder } from './OrderPhotoPlaceholder';
import { formatStorefrontAzn } from './storefrontMoney';

const ALL = '__all__';

function normalizeCategoryLabel(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  return raw
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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
  orderCustomizeItem: string;
  orderChooseOptions: string;
  orderSearchNoResults: string;
  orderCategoryEmpty: string;
  halalBadge: string;
  favoriteAdd: string;
  favoriteRemove: string;
  menuLabel: string;
  categoriesLabel: string;
  clearSearch: string;
  itemCountSingle: string;
  itemCountPlural: string;
  orderProductNoPhotoCaption: string;
  orderPhotoPlaceholder: string;
  orderKitchenOpen: string;
  orderKitchenClosed: string;
  orderKitchenPaused: string;
  orderHoursUntil: string;
}

export type OrderMenuHoursStrip = {
  open: boolean;
  status: string;
  untilHm: string | null;
};

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
  hoursStrip?: OrderMenuHoursStrip | null;
  venueAddress: string;
  venuePhone: string;
  labels: OrderMenuBrowseLabels;
  onAddProduct: (p: Product) => void;
  favoriteProductIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  serverAllowsDelivery: boolean;
  deliveryDisabledHint: string;
  sideSlot?: React.ReactNode;
}

function ProductCard({
  product,
  addLabel,
  customizeLabel,
  halalLabel,
  favoriteAddLabel,
  favoriteRemoveLabel,
  isFavorite,
  onToggleFavorite,
  onAdd,
  photoLabel,
}: {
  product: Product;
  addLabel: string;
  customizeLabel: string;
  halalLabel: string;
  favoriteAddLabel: string;
  favoriteRemoveLabel: string;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
  onAdd: () => void;
  photoLabel: string;
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
        <OrderPhotoPlaceholder src={product.image_url} alt={product.name} label={photoLabel} />
      </div>
      <div className="card-body min-w-0 md:px-3 md:pt-2.5">
        <h3 className="m-0 text-[14px] font-semibold tracking-[-0.01em] text-sf-ink">
          {product.name}
          {product.is_halal ? <span className="sf-badge">{halalLabel}</span> : null}
        </h3>
        {product.description ? (
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.35] text-sf-muted">{product.description}</p>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 md:px-3">
        <span className="text-[14px] font-semibold tabular-nums text-sf-ink">
          {formatStorefrontAzn(product.selling_price)}
        </span>
        <div className="flex items-center gap-1.5">
          {onToggleFavorite ? (
            <button
              type="button"
              aria-label={isFavorite ? favoriteRemoveLabel : favoriteAddLabel}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                isFavorite
                  ? 'border-sf-accent bg-sf-accent-soft text-sf-accent'
                  : 'border-sf-line bg-sf-surface text-sf-muted hover:border-sf-line-strong'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={hasMods ? customizeLabel : addLabel}
            className="sf-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            {addLabel}
          </button>
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
  hoursStrip,
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
    return products.filter((p) => fuzzyMatch(p.name, q) || fuzzyMatch(p.description ?? '', q));
  }, [products, searchQuery]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, normalizeCategoryLabel(c.name));
    return m;
  }, [categories]);

  const visibleCategories = useMemo(() => {
    const productCategoryIds = new Set(products.map((p) => p.master_category_id));
    return categories.filter((c) => productCategoryIds.has(c.id));
  }, [categories, products]);

  const showCategoryNav = visibleCategories.length > 1;

  useEffect(() => {
    if (selectedCategoryId === ALL) return;
    if (visibleCategories.some((c) => c.id === selectedCategoryId)) return;
    onSelectCategory(ALL);
  }, [selectedCategoryId, visibleCategories, onSelectCategory]);

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
        aria-pressed={active}
        onClick={() => handlePickCategory(id)}
        className={`ming-chip sf-chip snap-start ${active ? 'ming-chip-active' : ''}`}
      >
        {label}
      </button>
    );
  };

  const renderCard = (p: Product) => (
    <ProductCard
      key={p.id}
      product={p}
      addLabel={labels.orderAddToCart}
      customizeLabel={labels.orderCustomizeItem}
      halalLabel={labels.halalBadge}
      favoriteAddLabel={labels.favoriteAdd}
      favoriteRemoveLabel={labels.favoriteRemove}
      isFavorite={favoriteProductIds.includes(p.id)}
      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(p.id) : undefined}
      onAdd={() => onAddProduct(p)}
      photoLabel={labels.orderPhotoPlaceholder}
    />
  );

  const hoursStatusLabel = (() => {
    if (!hoursStrip) return hoursLine;
    if (hoursStrip.status === 'PAUSED') return labels.orderKitchenPaused;
    if (!hoursStrip.open) return labels.orderKitchenClosed;
    if (hoursStrip.untilHm) {
      return `${labels.orderKitchenOpen} · ${labels.orderHoursUntil.replace('{time}', hoursStrip.untilHm)}`;
    }
    return labels.orderKitchenOpen;
  })();

  const renderProducts = () => {
    const searching = searchQuery.trim().length > 0;

    if (searching) {
      if (searchFiltered.length === 0) {
        return <p className="px-2 py-8 text-center text-sm text-sf-muted">{labels.orderSearchNoResults}</p>;
      }
      return <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">{searchFiltered.map(renderCard)}</div>;
    }

    if (selectedCategoryId === ALL) {
      return (
        <div className="space-y-[22px]">
          {visibleCategories.map((cat) => {
            const list = searchFiltered.filter((p) => p.master_category_id === cat.id);
            if (list.length === 0) return null;
            return (
              <section key={cat.id} id={`ming-cat-${cat.id}`} className="scroll-mt-[168px]">
                <div className="mb-2.5 mt-2 flex items-baseline justify-between">
                  <h2 className="m-0 text-base font-semibold tracking-[-0.01em] text-sf-ink">
                    {normalizeCategoryLabel(cat.name)}
                  </h2>
                  <span className="text-xs font-medium text-sf-muted">{list.length}</span>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">{list.map(renderCard)}</div>
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
        <div className="mb-2.5 mt-2 flex items-baseline justify-between">
          <h2 className="m-0 text-base font-semibold tracking-[-0.01em] text-sf-ink">{title}</h2>
          <span className="text-xs font-medium text-sf-muted">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <p className="rounded-lg border border-sf-line bg-sf-surface p-8 text-center text-sm text-sf-muted">
            {labels.orderCategoryEmpty}
          </p>
        ) : (
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">{list.map(renderCard)}</div>
        )}
      </section>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[390px] flex-col md:max-w-[1080px] md:flex-row md:gap-8 md:px-6">
      <div className="min-w-0 flex-1 pb-[calc(var(--sf-cartbar-h)+16px)] pt-1">
        {hoursStatusLabel ? (
          <div className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-sf-muted md:px-0 md:pb-1 md:pt-3">
            <span
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${hoursStrip?.open ? 'bg-sf-ok' : 'bg-sf-muted'}`}
              aria-hidden
            />
            <span>
              {hoursStrip?.open ? (
                <>
                  <strong className="font-semibold text-sf-ink">{labels.orderKitchenOpen}</strong>
                  {hoursStrip.untilHm
                    ? ` · ${labels.orderHoursUntil.replace('{time}', hoursStrip.untilHm)}`
                    : null}
                </>
              ) : (
                hoursStatusLabel
              )}
            </span>
          </div>
        ) : null}

        <div className="pb-3 md:flex md:items-center md:gap-4 md:px-0 md:py-2">
          {showCategoryNav ? (
            <nav
              ref={chipsRef}
              className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1 md:flex-1 md:px-0"
              aria-label={labels.categoriesLabel}
              role="tablist"
            >
              {chip(ALL, labels.allCategories)}
              {visibleCategories.map((c) => chip(c.id, normalizeCategoryLabel(c.name)))}
            </nav>
          ) : (
            <div className="flex-1" />
          )}
          <label className="sf-search mx-4 mt-1 md:mx-0 md:mt-0 md:w-[280px] md:shrink-0">
            <Search className="h-4 w-4 shrink-0 text-sf-muted" aria-hidden />
            <span className="sr-only">{labels.orderSearchMenu}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.orderSearchMenu}
              autoComplete="off"
            />
            {searchQuery ? (
              <button type="button" onClick={() => setSearchQuery('')} aria-label={labels.clearSearch}>
                <X className="h-4 w-4 text-sf-muted" />
              </button>
            ) : null}
          </label>
        </div>

        <main className="px-4 pb-6 md:px-0">
          {!serverAllowsDelivery && fulfillment === 'delivery' ? (
            <p
              role="status"
              className="mb-4 rounded-lg border border-sf-line bg-sf-surface px-4 py-3 text-[13px] leading-relaxed text-sf-ink"
            >
              {deliveryDisabledHint}
            </p>
          ) : null}

          {renderProducts()}

          <div className="mt-10">
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
      </div>

      {sideSlot ? (
        <aside className="hidden shrink-0 pt-8 lg:block lg:w-[360px]">
          <div className="sticky top-20">{sideSlot}</div>
        </aside>
      ) : null}
    </div>
  );
}

export { ALL as ORDER_MENU_ALL_CATEGORY_ID };
