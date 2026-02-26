import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, Category, CartItem } from '../lib/supabase';

interface ProductScreenProps {
  products: Product[];
  category: Category | null;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onViewCart: () => void;
  cartItemCount: number;
  getCartQtyForProduct?: (productId: string) => number;
}

export function ProductScreen({
  products,
  category,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onViewCart,
  cartItemCount,
  getCartQtyForProduct,
}: ProductScreenProps) {
  const { t } = useLanguage();

  const getCartQty = (productId: string) => {
    if (getCartQtyForProduct) return getCartQtyForProduct(productId);
    const item = cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-0">
        <h2 className="text-2xl font-bold text-white mb-1">{category?.name}</h2>
        <p className="text-gray-500 text-sm mb-6">{products.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const qty = getCartQty(product.id);
              const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
              return (
                <div
                  key={product.id}
                  className={`bg-gray-800 rounded-2xl overflow-hidden border-2 transition-all ${
                    qty > 0 ? 'border-emerald-500' : 'border-gray-700'
                  }`}
                >
                  <div
                    className="aspect-square bg-gray-700 relative cursor-pointer"
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
                        <Package className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {qty > 0 && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {qty}
                      </div>
                    )}
                    {hasModifiers && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                        <span className="text-xs text-gray-200">{t.customize}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">{product.name}</h3>
                    <p className="text-emerald-400 font-bold text-lg mb-3">
                      ₼{Number(product.selling_price).toFixed(2)}
                    </p>
                    {hasModifiers ? (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors active:scale-95 min-h-[48px]"
                      >
                        {t.customize}
                      </button>
                    ) : qty === 0 ? (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors active:scale-95 min-h-[48px]"
                      >
                        {t.addToCart}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-700 rounded-xl p-1">
                        <button
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="w-12 h-12 flex items-center justify-center text-white hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-white font-bold text-lg">{qty}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="w-12 h-12 flex items-center justify-center text-white hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
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

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800">
          <button
            onClick={onViewCart}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition-colors active:scale-[0.98] flex items-center justify-center gap-3 min-h-[64px]"
          >
            <ShoppingCart className="w-6 h-6" />
            {t.viewCart} ({cartItemCount})
          </button>
        </div>
      )}
    </div>
  );
}
