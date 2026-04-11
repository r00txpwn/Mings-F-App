import { X, Package, Plus } from 'lucide-react';
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 font-montserrat"
      style={{ backgroundColor: 'rgba(31,31,31,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg animate-scaleIn rounded-[22px] p-6"
        style={{
          backgroundColor: 'var(--kiosk-card)',
          border: '1px solid var(--kiosk-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-xl font-bold"
            style={{ color: 'var(--kiosk-white)' }}
          >
            {t.wouldYouLikeToAdd}
          </h3>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--kiosk-smoke)' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-white)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-smoke)';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product suggestions */}
        <div className="space-y-3 mb-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 rounded-[18px]"
              style={{ backgroundColor: '#383838' }}
            >
              {/* Image */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: '#444' }}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6" style={{ color: 'var(--kiosk-smoke)' }} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: 'var(--kiosk-white)' }}
                >
                  {product.name}
                </p>
                <p
                  className="font-bold"
                  style={{ color: 'var(--kiosk-primary)' }}
                >
                  ₼{Number(product.selling_price).toFixed(2)}
                </p>
              </div>

              {/* Add button */}
              <button
                onClick={() => onAdd(product)}
                className="text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 min-h-[44px] flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--kiosk-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                <Plus className="w-4 h-4" />
                {t.addToCart}
              </button>
            </div>
          ))}
        </div>

        {/* No thanks button */}
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-[18px] font-semibold transition-all min-h-[52px]"
          style={{
            border: '1px solid var(--kiosk-border)',
            color: 'var(--kiosk-smoke)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-white)';
            e.currentTarget.style.borderColor = 'var(--kiosk-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-smoke)';
            e.currentTarget.style.borderColor = 'var(--kiosk-border)';
          }}
        >
          {t.noThanks}
        </button>
      </div>
    </div>
  );
}
