import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CartItem } from '../lib/supabase';

interface CartScreenProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (cartItemKey: string, delta: number) => void;
  onRemove: (cartItemKey: string) => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

function getItemPrice(item: CartItem): number {
  const modTotal = Object.values(item.selectedModifiers)
    .flat()
    .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
  return (Number(item.product.selling_price) + modTotal) * item.quantity;
}

function getModifierSummary(item: CartItem): string {
  const names = Object.values(item.selectedModifiers)
    .flat()
    .map(opt => opt.name);
  return names.join(', ');
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
      <div
        className="flex flex-col items-center justify-center min-h-full p-8 font-montserrat"
        style={{ backgroundColor: 'var(--kiosk-bg)' }}
      >
        <ShoppingCart className="w-20 h-20 mb-6" style={{ color: 'var(--kiosk-smoke)' }} />
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--kiosk-white)' }}
        >
          {t.emptyCart}
        </h2>
        <p className="mb-8" style={{ color: 'var(--kiosk-smoke)' }}>{t.backToMenu}</p>
        <button
          onClick={onContinueShopping}
          className="text-white px-8 py-4 rounded-[18px] font-semibold text-lg transition-all active:scale-95 min-h-[60px]"
          style={{ backgroundColor: 'var(--kiosk-primary)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          {t.continueShopping}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full font-montserrat"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      {/* Header */}
      <div className="p-6 pb-0 flex-shrink-0">
        <h2
          className="text-2xl font-bold mb-1 flex items-center gap-3"
          style={{ color: 'var(--kiosk-white)' }}
        >
          <ShoppingCart className="w-7 h-7" style={{ color: 'var(--kiosk-primary)' }} />
          {t.viewCart}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--kiosk-smoke)' }}>
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-6 pb-48">
        <div className="space-y-3">
          {cart.map((item) => {
            const modSummary = getModifierSummary(item);
            return (
              <div
                key={item.cartItemKey}
                className="flex items-center gap-4 p-4 rounded-[22px]"
                style={{
                  backgroundColor: 'var(--kiosk-card)',
                  border: '1px solid var(--kiosk-border)',
                }}
              >
                {/* Image */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: '#383838' }}
                >
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7" style={{ color: 'var(--kiosk-smoke)' }} />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold truncate"
                    style={{ color: 'var(--kiosk-white)' }}
                  >
                    {item.product.name}
                  </h3>
                  {modSummary && (
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: 'var(--kiosk-smoke)' }}
                    >
                      {modSummary}
                    </p>
                  )}
                  <p
                    className="font-bold mt-0.5"
                    style={{ color: 'var(--kiosk-primary)' }}
                  >
                    ₼{getItemPrice(item).toFixed(2)}
                  </p>
                </div>

                {/* Qty stepper + remove */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center rounded-xl p-1"
                    style={{ backgroundColor: '#383838' }}
                  >
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemKey, -1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--kiosk-white)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      className="font-bold w-8 text-center"
                      style={{ color: 'var(--kiosk-white)' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemKey, 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--kiosk-white)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.cartItemKey)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                    style={{ color: '#e57373' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(229,115,115,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 space-y-3"
        style={{
          backgroundColor: 'var(--kiosk-card)',
          borderTop: '1px solid var(--kiosk-border)',
        }}
      >
        {/* Total */}
        <div className="flex items-center justify-between px-2">
          <span className="text-lg" style={{ color: 'var(--kiosk-smoke)' }}>{t.orderTotal}</span>
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--kiosk-primary)' }}
          >
            ₼{total.toFixed(2)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onContinueShopping}
            className="flex-1 py-4 rounded-[18px] font-semibold transition-all min-h-[60px]"
            style={{
              border: '1px solid var(--kiosk-border)',
              color: 'var(--kiosk-white)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--kiosk-primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--kiosk-border)')}
          >
            {t.continueShopping}
          </button>
          <button
            onClick={onCheckout}
            className="flex-1 text-white py-4 rounded-[18px] font-bold transition-all flex items-center justify-center gap-2 min-h-[60px]"
            style={{ backgroundColor: 'var(--kiosk-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            {t.placeOrder}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
