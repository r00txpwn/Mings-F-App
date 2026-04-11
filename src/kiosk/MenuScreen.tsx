import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, Category, CartItem } from '../lib/supabase';

interface MenuScreenProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onViewCart: () => void;
  cartItemCount: number;
  getCartQtyForProduct: (productId: string) => number;
}

export function MenuScreen({
  products,
  categories,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onViewCart,
  cartItemCount,
  getCartQtyForProduct,
}: MenuScreenProps) {
  const { t } = useLanguage();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Default to first category on mount or when categories change
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0] || null;
  const visibleProducts = products.filter(p => p.master_category_id === selectedCategory?.id);

  const cartTotal = cart.reduce((sum, item) => {
    const modTotal = Object.values(item.selectedModifiers)
      .flat()
      .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
    return sum + (Number(item.product.selling_price) + modTotal) * item.quantity;
  }, 0);

  return (
    <div
      className="flex h-full font-montserrat"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      {/* ── Left sidebar: category list ── */}
      <div
        className="kiosk-sidebar-shadow flex-shrink-0 flex flex-col overflow-y-auto relative"
        style={{
          width: '160px',
          backgroundColor: 'var(--kiosk-card)',
          borderRight: '1px solid var(--kiosk-border)',
        }}
      >
        <div className="p-3 space-y-2 pb-16">
          {categories.map((category) => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className="w-full flex flex-col items-center gap-2 p-3 rounded-[17px] transition-all active:scale-95"
                style={{
                  backgroundColor: isSelected ? 'rgba(214,87,69,0.12)' : 'transparent',
                  outline: isSelected ? '2.5px solid var(--kiosk-primary)' : '2.5px solid transparent',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: category.color ? `${category.color}20` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {category.icon || '🍽️'}
                </div>
                <span
                  className="text-xs font-semibold text-center leading-tight"
                  style={{ color: isSelected ? 'var(--kiosk-primary)' : 'var(--kiosk-white)' }}
                >
                  {category.name}
                </span>
                {isSelected && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--kiosk-primary)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right content: product grid ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category heading */}
        <div className="px-6 pt-6 pb-3 flex-shrink-0">
          <h2
            className="text-2xl font-bold leading-tight"
            style={{ color: 'var(--kiosk-white)' }}
          >
            {selectedCategory?.name ?? t.menu}
          </h2>
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--kiosk-smoke)' }}
          >
            {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Products */}
        <div
          className="kiosk-scroll-shadow flex-1 overflow-y-auto px-6 relative"
          style={{ paddingBottom: cartItemCount > 0 ? '100px' : '24px' }}
        >
          {visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Package className="w-14 h-14 mb-4" style={{ color: 'var(--kiosk-smoke)' }} />
              <p style={{ color: 'var(--kiosk-smoke)' }}>No products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleProducts.map((product) => {
                const qty = getCartQtyForProduct(product.id);
                const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
                return (
                  <div
                    key={product.id}
                    className="flex flex-col overflow-hidden transition-all"
                    style={{
                      backgroundColor: 'var(--kiosk-card)',
                      borderRadius: '22px',
                      outline: qty > 0 ? '2.5px solid var(--kiosk-primary)' : '2.5px solid transparent',
                    }}
                  >
                    {/* Product image */}
                    <div
                      className="aspect-square relative cursor-pointer"
                      style={{ backgroundColor: '#383838' }}
                      onClick={() => onAddToCart(product)}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10" style={{ color: 'var(--kiosk-smoke)' }} />
                        </div>
                      )}
                      {/* Cart qty badge */}
                      {qty > 0 && (
                        <div
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: 'var(--kiosk-primary)' }}
                        >
                          {qty}
                        </div>
                      )}
                      {/* Customize badge */}
                      {hasModifiers && (
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                          <span className="text-xs" style={{ color: 'var(--kiosk-white)' }}>
                            {t.customize}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col">
                      <h3
                        className="font-semibold text-sm mb-1 truncate"
                        style={{ color: 'var(--kiosk-white)' }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="font-bold text-base mb-3"
                        style={{ color: 'var(--kiosk-primary)' }}
                      >
                        ₼{Number(product.selling_price).toFixed(2)}
                      </p>

                      {/* Action */}
                      {hasModifiers ? (
                        <button
                          onClick={() => onAddToCart(product)}
                          className="w-full text-white py-2.5 rounded-[18px] font-semibold text-sm transition-all active:scale-95 mt-auto min-h-[44px]"
                          style={{ backgroundColor: 'var(--kiosk-primary)' }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                        >
                          {t.customize}
                        </button>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => onAddToCart(product)}
                          className="w-full text-white py-2.5 rounded-[18px] font-semibold text-sm transition-all active:scale-95 mt-auto min-h-[44px] flex items-center justify-center gap-1"
                          style={{ backgroundColor: 'var(--kiosk-primary)' }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                        >
                          <Plus className="w-4 h-4" />
                          {t.addToCart}
                        </button>
                      ) : (
                        <div
                          className="flex items-center justify-between rounded-[18px] p-1 mt-auto"
                          style={{ backgroundColor: '#383838' }}
                        >
                          <button
                            onClick={() => onUpdateQuantity(product.id, -1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                            style={{ color: 'var(--kiosk-white)' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span
                            className="font-bold text-base"
                            style={{ color: 'var(--kiosk-white)' }}
                          >
                            {qty}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(product.id, 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                            style={{ color: 'var(--kiosk-white)' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Plus className="w-4 h-4" />
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

        {/* Sticky cart button */}
        {cartItemCount > 0 && (
          <div
            className="absolute bottom-0 left-40 right-0 p-4"
            style={{
              background: `linear-gradient(to top, var(--kiosk-bg) 70%, transparent)`,
            }}
          >
            <button
              onClick={onViewCart}
              className="w-full text-white font-bold text-lg rounded-[18px] transition-all active:scale-[0.98] flex items-center justify-between px-6 gap-3"
              style={{
                backgroundColor: 'var(--kiosk-primary)',
                height: '70px',
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                {cartItemCount}
              </div>
              <span className="flex-1 text-center flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t.viewCart}
              </span>
              <span className="font-bold">₼{cartTotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
