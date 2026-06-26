import { useState, useEffect, useRef } from 'react';
import { Package, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, Category } from '../lib/supabase';

interface MenuScreenProps {
  products: Product[];
  categories: Category[];
  initialCategoryId?: string | null;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  getCartQtyForProduct: (productId: string) => number;
}

export function MenuScreen({
  products,
  categories,
  initialCategoryId,
  onAddToCart,
  onUpdateQuantity,
  getCartQtyForProduct,
}: MenuScreenProps) {
  const { t } = useLanguage();
  const railRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId ?? null);

  const visibleCategories = categories.filter((cat) =>
    products.some((p) => p.master_category_id === cat.id)
  );

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
    } else if (visibleCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(visibleCategories[0].id);
    }
  }, [initialCategoryId, visibleCategories, selectedCategoryId]);

  const selectedCategory =
    visibleCategories.find((c) => c.id === selectedCategoryId) || visibleCategories[0] || null;
  const visibleProducts = products.filter((p) => p.master_category_id === selectedCategory?.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Horizontal category rail */}
      <div
        ref={railRef}
        className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 scroll-smooth"
        style={{ borderBottom: '1px solid var(--kiosk-border)' }}
      >
        {visibleCategories.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className="flex shrink-0 touch-manipulation flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-all active:scale-95"
              style={{
                outline: isSelected ? '2.5px solid var(--kiosk-primary)' : '2.5px solid transparent',
                backgroundColor: isSelected ? 'rgba(214,87,69,0.08)' : 'transparent',
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : 'var(--kiosk-bg)',
                }}
              >
                {category.icon || '🍽️'}
              </div>
              <span
                className="max-w-[72px] truncate text-xs font-semibold"
                style={{ color: isSelected ? 'var(--kiosk-primary)' : 'var(--kiosk-text)' }}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category title */}
      <div className="shrink-0 px-6 pb-2 pt-4">
        <h2 className="text-2xl font-bold leading-tight" style={{ color: 'var(--kiosk-text)' }}>
          {selectedCategory?.name ?? t.menu}
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--kiosk-muted)' }}>
          {visibleProducts.length} {t.items}
        </p>
      </div>

      {/* Product grid */}
      <div className="kiosk-scroll-shadow flex-1 overflow-y-auto px-6 pb-4">
        {visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="mb-4 h-14 w-14" style={{ color: 'var(--kiosk-muted)' }} />
            <p style={{ color: 'var(--kiosk-muted)' }}>{t.kioskNoProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const qty = getCartQtyForProduct(product.id);
              const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
              return (
                <div
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-[22px] border shadow-sm transition-all"
                  style={{
                    backgroundColor: 'var(--kiosk-card)',
                    borderColor: qty > 0 ? 'var(--kiosk-primary)' : 'var(--kiosk-border)',
                  }}
                >
                  <button
                    type="button"
                    className="relative aspect-square w-full overflow-hidden"
                    style={{ backgroundColor: 'var(--kiosk-bg)' }}
                    onClick={() => onAddToCart(product)}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-10 w-10" style={{ color: 'var(--kiosk-muted)' }} />
                      </div>
                    )}
                    {qty > 0 && (
                      <div
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: 'var(--kiosk-primary)' }}
                      >
                        {qty}
                      </div>
                    )}
                    {hasModifiers && (
                      <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                        <span className="text-xs text-white">{t.customize}</span>
                      </div>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="mb-1 truncate text-sm font-semibold" style={{ color: 'var(--kiosk-text)' }}>
                      {product.name}
                    </h3>
                    <p className="mb-3 text-base font-bold" style={{ color: 'var(--kiosk-primary)' }}>
                      ₼{Number(product.selling_price).toFixed(2)}
                    </p>

                    {hasModifiers ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="mt-auto min-h-[44px] w-full touch-manipulation rounded-[18px] py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
                        style={{ backgroundColor: 'var(--kiosk-primary)' }}
                      >
                        {t.customize}
                      </button>
                    ) : qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className="mt-auto flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-1 rounded-[18px] py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
                        style={{ backgroundColor: 'var(--kiosk-primary)' }}
                      >
                        <Plus className="h-4 w-4" />
                        {t.addToCart}
                      </button>
                    ) : (
                      <div
                        className="mt-auto flex items-center justify-between rounded-[18px] p-1"
                        style={{ backgroundColor: 'var(--kiosk-bg)' }}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl"
                          style={{ color: 'var(--kiosk-text)' }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-base font-bold tabular-nums" style={{ color: 'var(--kiosk-text)' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl"
                          style={{ color: 'var(--kiosk-text)' }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
