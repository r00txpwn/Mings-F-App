import { useEffect, useMemo, useRef, useState } from 'react';
import { CakeSlice, Coffee, Heart, Package, Plus, Search, Utensils, type LucideIcon, X } from 'lucide-react';
import type { Category, Product } from '../lib/supabase';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderVenueInfo } from './OrderVenueInfo';
import { formatMoneyWithSymbol } from '../lib/money';
import { getOrderCardShapeClass, getOrderCardShadowClass } from './orderDesign';

const ALL = '__all__';

function normalizeCategoryLabel(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  return raw
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** First display character for branded no-photo tiles (handles emoji / multi-codepoint). */
function dishInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'M';
  const first = [...trimmed][0];
  return first ? first.toLocaleUpperCase() : 'M';
}

function shortCategoryLine(label: string, maxLen = 14): string {
  const n = normalizeCategoryLabel(label);
  if (!n) return '';
  if (n.length <= maxLen) return n;
  return `${n.slice(0, Math.max(1, maxLen - 1))}…`;
}

function categoryIllustration(categoryLabel: string): { Icon: LucideIcon; iconClassName: string } {
  const value = categoryLabel.toLowerCase();
  if (value.includes('drink') || value.includes('beverage')) return { Icon: Coffee, iconClassName: 'text-ming-ash' };
  if (value.includes('dessert') || value.includes('sweet')) return { Icon: CakeSlice, iconClassName: 'text-ming-ash' };
  if (value.includes('noodle') || value.includes('rice') || value.includes('soup')) {
    return { Icon: Utensils, iconClassName: 'text-ming-ash' };
  }
  return { Icon: Package, iconClassName: 'text-ming-mute' };
}

function orderingCtaLabel(addLabel: string, customizeLabel: string, hasMods: boolean): string {
  if (!hasMods) return addLabel;
  return customizeLabel;
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
  customizeLabel,
  halalLabel,
  favoriteAddLabel,
  favoriteRemoveLabel,
  isFavorite,
  onToggleFavorite,
  onAdd,
  categoryLabel,
  noPhotoCaption,
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
  categoryLabel: string;
  noPhotoCaption: string;
}) {
  const hasMods = (product.modifier_groups?.length ?? 0) > 0;
  const illustration = categoryIllustration(categoryLabel);
  const FallbackIcon = illustration.Icon;
  const catLine = shortCategoryLine(categoryLabel);
  const shapeClass = getOrderCardShapeClass(product.name.length);
  const shadowClass = getOrderCardShadowClass(product.name.length);
  const ctaLabel = orderingCtaLabel(addLabel, customizeLabel, hasMods);
  return (
    <article
      className={`ming-product group cursor-pointer ${shapeClass} ${shadowClass} ${
        hasMods ? 'rotate-[-0.5deg]' : ''
      }`}
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
          <div
            className="relative flex h-full w-full flex-col overflow-hidden rounded-[inherit] bg-gradient-to-br from-[color:var(--order-kraft-soft)] via-[color:var(--order-kraft)] to-[color:var(--order-coral)]"
            aria-hidden
          >
            <div
              className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/40 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
              aria-hidden
            />
            <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[color:var(--order-coral)] via-transparent to-[color:var(--order-orange)] opacity-80" />
            <div className="absolute right-2 top-2 opacity-[0.55]">
              <FallbackIcon className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
            </div>
            <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-2 pt-4">
              <span className="ming-display text-[28px] leading-none tracking-tight text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]">
                {dishInitial(product.name)}
              </span>
            </div>
            <div className="relative z-[1] px-1.5 pb-2 text-center">
              <p className="text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-ming-ash/90">
                {noPhotoCaption}
              </p>
              {catLine ? (
                <p className="mt-0.5 truncate text-[9px] font-black text-white">{catLine}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="ming-display text-[17px] leading-[1.05] text-[color:var(--order-ink)]">{product.name}</h3>
          {product.is_halal ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
              {halalLabel}
            </span>
          ) : null}
        </div>
        {product.description ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-relaxed text-[rgba(40,20,20,0.65)]">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex min-w-0 flex-col">
            <span className="ming-price">{formatMoneyWithSymbol(product.selling_price)}</span>
          </div>
          <button
            type="button"
            aria-label={ctaLabel}
            className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-black uppercase tracking-wide shadow-[4px_4px_0_rgba(40,20,20,0.22)] transition-all active:scale-95 sm:px-4 ${
              hasMods
                ? 'bg-[color:var(--order-ink)] text-[color:var(--order-mint)] hover:-translate-y-0.5'
                : 'bg-[color:var(--order-coral)] text-white hover:-translate-y-0.5'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {ctaLabel}
          </button>
          {onToggleFavorite ? (
            <button
              type="button"
              aria-label={isFavorite ? favoriteRemoveLabel : favoriteAddLabel}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                isFavorite
                  ? 'border-red-400/35 bg-red-400/10 text-[color:var(--order-coral)]'
                  : 'border-black/10 bg-white text-[rgba(40,20,20,0.45)] hover:border-black/20 hover:text-[color:var(--order-coral)]'
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
  const getCategoryLabelForProduct = (product: Product): string => {
    const key = product.master_category_id ?? '';
    return categoryNameById.get(key) ?? '';
  };

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

  /** Tiny menus: search feels like noise when the list is already short. */
  const showSearch = products.length >= 8;

  const searchFiltered = useMemo(() => {
    const q = showSearch ? searchQuery.trim().toLowerCase() : '';
    if (!q) return products;
    return products.filter(
      (p) =>
        fuzzyMatch(p.name, q) ||
        fuzzyMatch(p.description ?? '', q)
    );
  }, [products, searchQuery, showSearch]);

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, normalizeCategoryLabel(c.name));
    return m;
  }, [categories]);

  const visibleCategories = useMemo(() => {
    const productCategoryIds = new Set(products.map((p) => p.master_category_id));
    return categories.filter((c) => productCategoryIds.has(c.id));
  }, [categories, products]);

  /** Single-category menus: chips / rail add no navigation value. */
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
            <Search className="h-6 w-6 text-[color:var(--order-coral)]" />
            <p className="text-sm font-bold text-[rgba(40,20,20,0.7)]">{labels.orderSearchNoResults}</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {searchFiltered.map((p) => (
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
              categoryLabel={getCategoryLabelForProduct(p)}
              noPhotoCaption={labels.orderProductNoPhotoCaption}
            />
          ))}
        </div>
      );
    }

    if (selectedCategoryId === ALL) {
      return (
        <div className="space-y-10">
          {visibleCategories.map((cat) => {
            const list = searchFiltered.filter((p) => p.master_category_id === cat.id);
            if (list.length === 0) return null;
            return (
              <section
                key={cat.id}
                id={`ming-cat-${cat.id}`}
                className="scroll-mt-[168px] lg:scroll-mt-24"
              >
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 className="ming-section-title">{normalizeCategoryLabel(cat.name)}</h2>
                  <span className="hidden text-[11px] font-black uppercase tracking-[0.14em] text-[rgba(40,20,20,0.55)] sm:block">
                    {list.length} {list.length === 1 ? labels.itemCountSingle : labels.itemCountPlural}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {list.map((p) => (
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
                      categoryLabel={getCategoryLabelForProduct(p)}
                      noPhotoCaption={labels.orderProductNoPhotoCaption}
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
          <p className="rounded-[26px_16px_26px_16px] border border-black/5 bg-white p-8 text-center text-sm font-bold text-[rgba(40,20,20,0.7)] shadow-[6px_6px_0_rgba(40,20,20,0.12)]">
            {labels.orderCategoryEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {list.map((p) => (
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
                categoryLabel={getCategoryLabelForProduct(p)}
                noPhotoCaption={labels.orderProductNoPhotoCaption}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  const fulfillmentLabel =
    fulfillment === 'delivery' ? labels.orderFulfillmentDelivery : labels.orderFulfillmentTakeaway;
  const venueDetail = hoursLine || (fulfillment === 'delivery' ? venueAddress : venuePhone);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-0 lg:flex-row lg:gap-8 lg:px-10">
      {/* Sticky category chip rail — mobile / tablet only; hidden for single-category menus */}
      {showCategoryNav ? (
        <div className="sticky top-[48px] z-20 -mx-0 border-b border-black/5 bg-[rgba(180,230,220,0.9)] backdrop-blur-xl lg:static lg:top-0 lg:order-1 lg:hidden">
          <div className="relative">
            <div
              ref={chipsRef}
              className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-3 sm:px-5"
              aria-label={labels.categoriesLabel}
              role="tablist"
            >
              {chip(ALL, labels.allCategories)}
              {visibleCategories.map((c) => chip(c.id, normalizeCategoryLabel(c.name)))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[rgba(180,230,220,0.9)] to-transparent"
            />
          </div>
        </div>
      ) : null}

      {/* Desktop left rail — hidden for single-category menus */}
      {showCategoryNav ? (
        <aside className="hidden shrink-0 pt-6 lg:block lg:w-60 lg:pt-8">
          <div className="sticky top-20 space-y-2">
            <p className="ming-eyebrow mb-3 px-2">{labels.menuLabel}</p>
            <nav aria-label={labels.categoriesLabel} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handlePickCategory(ALL)}
                className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-extrabold transition-colors ${
                  selectedCategoryId === ALL
                    ? 'bg-[color:var(--order-ink)] text-[color:var(--order-mint)]'
                    : 'text-[rgba(40,20,20,0.65)] hover:bg-white hover:text-[color:var(--order-ink)]'
                }`}
              >
                {labels.allCategories}
              </button>
              {visibleCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePickCategory(c.id)}
                  className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-extrabold transition-colors ${
                    selectedCategoryId === c.id
                      ? 'bg-[color:var(--order-ink)] text-[color:var(--order-mint)]'
                      : 'text-[rgba(40,20,20,0.65)] hover:bg-white hover:text-[color:var(--order-ink)]'
                  }`}
                >
                  {normalizeCategoryLabel(c.name)}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      ) : null}

      {/* Main column */}
      <main className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-5 lg:order-2 lg:px-0 lg:pb-24 lg:pt-8">
        {venueDetail ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[22px_14px_22px_14px] border border-black/10 bg-white/75 px-3 py-2.5 shadow-[4px_4px_0_rgba(40,20,20,0.10)]">
            <span className="inline-flex items-center rounded-full bg-[color:var(--order-coral)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-[3px_3px_0_var(--order-ink)]">
              {fulfillmentLabel}
            </span>
            <span className="min-w-0 truncate text-[12px] font-bold text-[rgba(40,20,20,0.65)]">
              {venueDetail}
            </span>
          </div>
        ) : null}

        {/* Search — hidden for tiny menus (< 8 products) */}
        {showSearch ? (
          <div className="mb-5 flex flex-col gap-3 rounded-[26px_16px_26px_16px] bg-white/70 p-3 shadow-[6px_6px_0_rgba(40,20,20,0.12)] sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--order-coral)]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[rgba(40,20,20,0.6)] hover:text-[color:var(--order-coral)]"
                  aria-label={labels.clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!serverAllowsDelivery && fulfillment === 'delivery' ? (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-orange-300/40 bg-white px-4 py-3 text-[13px] font-bold leading-relaxed text-[color:var(--order-ink)] shadow-[4px_4px_0_rgba(250,150,60,0.35)]"
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
