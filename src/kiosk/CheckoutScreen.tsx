import { useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, CartItem } from '../lib/supabase';

interface CheckoutScreenProps {
  cart: CartItem[];
  total: number;
  kioskChannelId: string | null;
  onConfirmed: (displayNumber: string) => void;
  onBack: () => void;
}

export function CheckoutScreen({ cart, total, kioskChannelId, onConfirmed, onBack }: CheckoutScreenProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: orderNum } = await supabase.rpc('generate_daily_order_number');
      const dailyNumber = orderNum || 1;
      const displayNumber = 'M' + String(dailyNumber).padStart(3, '0');
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          source: 'kiosk',
          order_status: 'pending',
          payment_status: 'unpaid',
          sales_channel_id: kioskChannelId,
          total_price: total,
          quantity: itemCount,
          unit_price: itemCount > 0 ? total / itemCount : total,
          daily_order_number: dailyNumber,
          display_number: displayNumber,
          sale_date: new Date().toISOString(),
          notes: '',
        })
        .select('id')
        .single();

      if (saleError || !saleData) {
        console.error('Failed to create sale:', saleError);
        setSubmitting(false);
        return;
      }

      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        total_price: item.product.selling_price * item.quantity,
        notes: item.notes || null,
      }));

      await supabase.from('sale_items').insert(saleItems);

      onConfirmed(displayNumber);
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t.confirmOrder}</h2>

      <div className="flex-1 overflow-y-auto pb-28">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-4">
          <h3 className="text-gray-400 text-sm font-medium mb-4">{t.orderDetails}</h3>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity}</p>
                </div>
                <p className="text-white font-semibold text-sm">
                  ₼{(item.product.selling_price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 mt-4 pt-4 flex items-center justify-between">
            <span className="text-gray-400 font-medium">{t.orderTotal}</span>
            <span className="text-white text-2xl font-bold">₼{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 flex gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 border border-gray-600 text-gray-300 hover:text-white py-4 rounded-2xl font-medium transition-colors min-h-[60px]"
        >
          {t.back}
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 min-h-[60px]"
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t.confirmOrder}
        </button>
      </div>
    </div>
  );
}
