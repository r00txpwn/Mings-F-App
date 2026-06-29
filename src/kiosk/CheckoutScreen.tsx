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

type AllocatedDisplayNumberRow = {
  daily_order_number: number;
  display_number: string;
};

function getItemTotal(item: CartItem): number {
  const modTotal = Object.values(item.selectedModifiers)
    .flat()
    .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
  return (Number(item.product.selling_price) + modTotal) * item.quantity;
}

function getItemUnitPrice(item: CartItem): number {
  const modTotal = Object.values(item.selectedModifiers)
    .flat()
    .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
  return Number(item.product.selling_price) + modTotal;
}

function getModifierSummary(item: CartItem): string {
  const names = Object.values(item.selectedModifiers)
    .flat()
    .map(opt => opt.name);
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(', ');
}

export function CheckoutScreen({ cart, total, kioskChannelId, onConfirmed, onBack }: CheckoutScreenProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);

  const allocateDisplayNumber = async (): Promise<AllocatedDisplayNumberRow> => {
    const { data, error } = await supabase.rpc('allocate_direct_display_number');
    if (error || !data) throw new Error(error?.message ?? 'ORDER_NUMBER_FAILED');
    const row = (Array.isArray(data) ? data[0] : data) as Partial<AllocatedDisplayNumberRow>;
    const daily = Number(row.daily_order_number);
    const display = String(row.display_number ?? '');
    if (!Number.isFinite(daily) || daily < 1 || !/^M\d{3}$/.test(display)) {
      throw new Error('ORDER_NUMBER_INVALID');
    }
    return { daily_order_number: daily, display_number: display };
  };

  const isActiveDisplayNumberConflict = (error: unknown): boolean => {
    if (typeof error !== 'object' || error == null) return false;
    const e = error as { code?: string; message?: string };
    if (e.code === '23505') return true;
    return (e.message ?? '').includes('ux_sales_active_direct_display_number');
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      let saleData: { id: string } | null = null;
      let saleError: unknown = null;
      let displayNumber = '';
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const allocated = await allocateDisplayNumber();
        displayNumber = allocated.display_number;

        const inserted = await supabase
          .from('sales')
          .insert({
            source: 'kiosk',
            order_status: 'pending',
            payment_status: 'unpaid',
            sales_channel_id: kioskChannelId,
            total_price: total,
            quantity: itemCount,
            unit_price: itemCount > 0 ? total / itemCount : total,
            daily_order_number: allocated.daily_order_number,
            display_number: allocated.display_number,
            sale_date: new Date().toISOString(),
            notes: '',
          })
          .select('id')
          .single();

        if (!inserted.error && inserted.data) {
          saleData = inserted.data as { id: string };
          saleError = null;
          break;
        }

        saleError = inserted.error;
        if (!isActiveDisplayNumberConflict(inserted.error)) {
          break;
        }
      }

      if (saleError || !saleData) {
        console.error('Failed to create sale:', saleError);
        setSubmitting(false);
        return;
      }

      for (const item of cart) {
        const unitPrice = getItemUnitPrice(item);
        const modSummary = getModifierSummary(item);
        const noteParts = [item.notes, modSummary].filter(Boolean).join(' | ');

        const { data: saleItemData } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleData.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: unitPrice * item.quantity,
            notes: noteParts || null,
          })
          .select('id')
          .single();

        if (saleItemData) {
          const modifierRows = Object.entries(item.selectedModifiers).flatMap(
            ([, opts]) =>
              opts.map(opt => ({
                sale_item_id: saleItemData.id,
                modifier_group_name: getGroupNameForOption(item, opt.id),
                modifier_option_name: opt.name,
                price_adjustment: Number(opt.price_adjustment),
              }))
          );
          if (modifierRows.length > 0) {
            await supabase.from('sale_item_modifiers').insert(modifierRows);
          }
        }
      }

      onConfirmed(displayNumber);
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full p-6 font-montserrat"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      <h2
        className="text-2xl font-bold mb-6 flex-shrink-0"
        style={{ color: 'var(--kiosk-white)' }}
      >
        {t.confirmOrder}
      </h2>

      {/* Order details card */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div
          className="rounded-[22px] p-5 mb-4"
          style={{
            backgroundColor: 'var(--kiosk-card)',
            border: '1px solid var(--kiosk-border)',
          }}
        >
          <h3
            className="text-sm font-semibold mb-4 uppercase tracking-wider"
            style={{ color: 'var(--kiosk-smoke)' }}
          >
            {t.orderDetails}
          </h3>
          <div className="space-y-3">
            {cart.map((item) => {
              const modSummary = getModifierSummary(item);
              return (
                <div key={item.cartItemKey} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: 'var(--kiosk-bg)' }}
                  >
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5" style={{ color: 'var(--kiosk-smoke)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--kiosk-white)' }}
                    >
                      {item.product.name}
                    </p>
                    {modSummary && (
                      <p className="text-xs truncate" style={{ color: 'var(--kiosk-smoke)' }}>{modSummary}</p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--kiosk-smoke)' }}>x{item.quantity}</p>
                  </div>
                  <p
                    className="font-bold text-sm flex-shrink-0"
                    style={{ color: 'var(--kiosk-primary)' }}
                  >
                    ₼{getItemTotal(item).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div
            className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--kiosk-border)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--kiosk-smoke)' }}>{t.orderTotal}</span>
            <span
              className="text-2xl font-bold"
              style={{ color: 'var(--kiosk-primary)' }}
            >
              ₼{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-3"
        style={{
          backgroundColor: 'var(--kiosk-card)',
          borderTop: '1px solid var(--kiosk-border)',
        }}
      >
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-4 rounded-[18px] font-semibold transition-all min-h-[60px]"
          style={{
            border: '1px solid var(--kiosk-border)',
            color: 'var(--kiosk-white)',
            backgroundColor: 'transparent',
          }}
        >
          {t.back}
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 text-white py-4 rounded-[18px] font-bold text-lg transition-all flex items-center justify-center gap-2 min-h-[60px]"
          style={{
            backgroundColor: submitting ? 'var(--kiosk-smoke)' : 'var(--kiosk-primary)',
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t.confirmOrder}
        </button>
      </div>
    </div>
  );
}

function getGroupNameForOption(item: CartItem, optionId: string): string {
  for (const [groupId, opts] of Object.entries(item.selectedModifiers)) {
    if (opts.some(o => o.id === optionId)) {
      const group = item.product.modifier_groups?.find(g => g.id === groupId);
      return group?.name || groupId;
    }
  }
  return '';
}
