import { useRef, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { CartItem } from '../lib/supabase';

interface CheckoutScreenProps {
  cart: CartItem[];
  total: number;
  kioskChannelId: string | null;
  onConfirmed: (displayNumber: string) => void;
  onBack: () => void;
}

type KioskOrderCreateResponse = {
  displayNumber: string;
  saleId: string;
  total: number;
  idempotent?: boolean;
};

const functionsBaseUrl = () => {
  const explicit = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1`;
};

function getModifierSummary(item: CartItem): string {
  const names = Object.values(item.selectedModifiers)
    .flat()
    .map((opt) => opt.name);
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(', ');
}

function getItemTotal(item: CartItem): number {
  const modTotal = Object.values(item.selectedModifiers)
    .flat()
    .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
  return (Number(item.product.selling_price) + modTotal) * item.quantity;
}

export function CheckoutScreen({ cart, total, onConfirmed, onBack }: CheckoutScreenProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const clientRequestIdRef = useRef<string>(crypto.randomUUID());

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      if (!key) {
        setSubmitError(t.kioskOrderCreateFailed);
        setSubmitting(false);
        return;
      }

      const kioskSecret = (import.meta.env.VITE_KIOSK_SECRET as string | undefined)?.trim() ?? '';
      const body = {
        clientRequestId: clientRequestIdRef.current,
        cart: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
          modifierOptionIds: Object.values(item.selectedModifiers)
            .flat()
            .map((opt) => opt.id),
        })),
      };

      const res = await fetch(`${functionsBaseUrl()}/kiosk-order-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          apikey: key,
          ...(kioskSecret ? { 'x-kiosk-secret': kioskSecret } : {}),
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => null)) as
        | KioskOrderCreateResponse
        | { error?: string; code?: string }
        | null;

      if (!res.ok) {
        setSubmitError(t.kioskOrderCreateFailed);
        setSubmitting(false);
        return;
      }

      const displayNumber = json && 'displayNumber' in json ? String(json.displayNumber) : '';
      if (!displayNumber) {
        setSubmitError(t.kioskOrderCreateFailed);
        setSubmitting(false);
        return;
      }

      onConfirmed(displayNumber);
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitError(t.kioskOrderCreateFailed);
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
                    <p className="font-semibold truncate" style={{ color: 'var(--kiosk-white)' }}>
                      {item.quantity}x {item.product.name}
                    </p>
                    {modSummary ? (
                      <p className="text-xs truncate" style={{ color: 'var(--kiosk-smoke)' }}>
                        {modSummary}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-bold flex-shrink-0" style={{ color: 'var(--kiosk-white)' }}>
                    ₼{getItemTotal(item).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <div
            className="mt-4 pt-4 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--kiosk-border)' }}
          >
            <span className="font-bold" style={{ color: 'var(--kiosk-white)' }}>
              {t.total}
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--kiosk-primary)' }}>
              ₼{total.toFixed(2)}
            </span>
          </div>
        </div>

        {submitError ? (
          <p className="text-sm mb-3 text-center" style={{ color: 'var(--kiosk-primary)' }} role="alert">
            {submitError}
          </p>
        ) : null}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-3"
        style={{ backgroundColor: 'var(--kiosk-bg)' }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-4 rounded-2xl font-bold text-lg"
          style={{
            backgroundColor: 'var(--kiosk-card)',
            color: 'var(--kiosk-white)',
            border: '1px solid var(--kiosk-border)',
          }}
        >
          {t.back}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting}
          className="flex-[2] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--kiosk-primary)', color: '#fff' }}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {t.confirmOrder}
        </button>
      </div>
    </div>
  );
}
