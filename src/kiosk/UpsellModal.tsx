import { X, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product } from '../lib/supabase';

interface UpsellModalProps {
  products: Product[];
  onAdd: (product: Product) => void;
  onDismiss: () => void;
}

export function UpsellModal({ products, onAdd, onDismiss }: UpsellModalProps) {
  const { t } = useLanguage();

  if (products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg animate-scaleIn">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white">{t.wouldYouLikeToAdd}</h3>
          <button
            onClick={onDismiss}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 bg-gray-700 rounded-xl p-3"
            >
              <div className="w-14 h-14 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{product.name}</p>
                <p className="text-emerald-400 font-bold">₼{product.selling_price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => onAdd(product)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 min-h-[44px]"
              >
                {t.addToCart}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-3 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition-colors min-h-[52px]"
        >
          {t.noThanks}
        </button>
      </div>
    </div>
  );
}
