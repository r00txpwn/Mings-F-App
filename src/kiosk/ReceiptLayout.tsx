import { CartItem } from '../lib/supabase';

interface ReceiptLayoutProps {
  displayNumber: string;
  cart: CartItem[];
  total: number;
}

export function ReceiptLayout({ displayNumber, cart, total }: ReceiptLayoutProps) {
  return (
    <div data-print-receipt className="hidden print:block font-mono text-xs p-2 max-w-[80mm]">
      <div className="text-center mb-3">
        <p className="font-bold text-sm">Business Manager</p>
        <p className="text-[10px] text-gray-600">{new Date().toLocaleString()}</p>
      </div>

      <div className="text-center mb-3 border-y border-dashed border-gray-400 py-2">
        <p className="text-[10px]">ORDER NUMBER</p>
        <p className="text-2xl font-bold">{displayNumber}</p>
      </div>

      <div className="mb-3">
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between py-0.5">
            <span>{item.quantity}x {item.product.name}</span>
            <span>{(item.product.selling_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 pt-2">
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>₼{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-4 text-[10px]">
        <p>Thank you!</p>
      </div>
    </div>
  );
}
