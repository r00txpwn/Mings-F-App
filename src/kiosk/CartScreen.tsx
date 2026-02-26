import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CartItem } from '../lib/supabase';

interface CartScreenProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

export function CartScreen({
  cart,
  total,
  onUpdateQuantity,
  onRemove,
  onContinueShopping,
  onCheckout,
}: CartScreenProps) {
  const { t } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8">
        <ShoppingCart className="w-20 h-20 text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">{t.emptyCart}</h2>
        <p className="text-gray-500 mb-8">{t.backToMenu}</p>
        <button
          onClick={onContinueShopping}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors min-h-[60px]"
        >
          {t.continueShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-0">
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-emerald-400" />
          {t.viewCart}
        </h2>
        <p className="text-gray-500 text-sm mb-6">{cart.length} items</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-44">
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4 border border-gray-700"
            >
              <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{item.product.name}</h3>
                <p className="text-emerald-400 font-bold">
                  ₼{(item.product.selling_price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-700 rounded-xl p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-600 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-600 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => onRemove(item.product.id)}
                  className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-gray-400 text-lg">{t.orderTotal}</span>
          <span className="text-white text-3xl font-bold">₼{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onContinueShopping}
            className="flex-1 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 py-4 rounded-2xl font-medium transition-colors min-h-[60px]"
          >
            {t.continueShopping}
          </button>
          <button
            onClick={onCheckout}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2 min-h-[60px]"
          >
            {t.placeOrder}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
