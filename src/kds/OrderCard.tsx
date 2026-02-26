import { Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Sale, SaleItem, SaleItemModifier } from '../lib/supabase';

interface OrderCardProps {
  order: Sale & { sale_items: SaleItem[] };
  now: number;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function OrderCard({ order, now, onUpdateStatus }: OrderCardProps) {
  const { t } = useLanguage();
  const status = order.order_status || 'pending';
  const isPaid = order.payment_status === 'paid';

  const referenceTime = status === 'preparing' && order.prep_started_at
    ? new Date(order.prep_started_at).getTime()
    : new Date(order.created_at).getTime();
  const elapsedMs = now - referenceTime;
  const elapsedMin = elapsedMs / 60000;

  let borderColor = 'border-gray-600';
  let bgColor = 'bg-gray-800';

  if (status === 'pending') {
    borderColor = 'border-gray-600';
    bgColor = 'bg-gray-800';
  } else if (status === 'preparing') {
    if (elapsedMin > 12) {
      borderColor = 'border-red-500';
      bgColor = 'bg-red-900/20';
    } else if (elapsedMin > 8) {
      borderColor = 'border-orange-500';
      bgColor = 'bg-orange-900/20';
    } else {
      borderColor = 'border-blue-500';
      bgColor = 'bg-blue-900/20';
    }
  } else if (status === 'ready') {
    borderColor = 'border-emerald-500';
    bgColor = 'bg-emerald-900/20';
  }

  const renderAction = () => {
    if (status === 'pending' && !isPaid) {
      return (
        <div className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg text-xs font-medium text-center">
          {t.awaitingPayment}
        </div>
      );
    }
    if (status === 'pending' && isPaid) {
      return (
        <button
          onClick={() => onUpdateStatus(order.id, 'preparing')}
          className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t.startPreparing}
        </button>
      );
    }
    if (status === 'preparing') {
      return (
        <button
          onClick={() => onUpdateStatus(order.id, 'ready')}
          className="w-full px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t.markReady}
        </button>
      );
    }
    if (status === 'ready') {
      return (
        <button
          onClick={() => onUpdateStatus(order.id, 'completed')}
          className="w-full px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t.markCompleted}
        </button>
      );
    }
    return null;
  };

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-xl p-4 flex flex-col transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-white">{order.display_number}</span>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">{formatElapsed(elapsedMs)}</span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 mb-3">
        {order.sale_items?.map((item) => {
          const mods = (item as SaleItem & { sale_item_modifiers?: SaleItemModifier[] }).sale_item_modifiers;
          return (
            <div key={item.id}>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold text-sm shrink-0">{item.quantity}x</span>
                <span className="text-gray-200 text-sm">{item.product_name}</span>
              </div>
              {mods && mods.length > 0 && (
                <p className="text-gray-500 text-xs ml-7">
                  {mods.map(m => m.modifier_option_name).join(', ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!isPaid && status === 'pending' && (
        <div className="mb-2 px-2 py-1 bg-yellow-900/30 border border-yellow-600/30 rounded text-yellow-400 text-xs text-center">
          {t.unpaid}
        </div>
      )}

      {renderAction()}
    </div>
  );
}
