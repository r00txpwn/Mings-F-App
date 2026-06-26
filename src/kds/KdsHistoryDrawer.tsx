import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { flattenOrderLines, getChannelMeta, type KdsKitchenOrder } from './kdsBoardUtils';
import { KdsEmptyState } from './KdsEmptyState';
import { KdsLineItem } from './KdsLineItem';

interface KdsHistoryDrawerProps {
  open: boolean;
  orders: KdsKitchenOrder[];
  loading: boolean;
  onClose: () => void;
}

export function KdsHistoryDrawer({ open, orders, loading, onClose }: KdsHistoryDrawerProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t.cancel}
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-violet-500/20 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{t.kdsHistoryTitle}</h2>
            <p className="text-xs text-slate-500">{t.kdsHistorySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label={t.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">{t.pleaseWait}</p>
          ) : orders.length === 0 ? (
            <KdsEmptyState title={t.kdsHistoryEmpty} compact />
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => {
                const channel = getChannelMeta(order.source);
                const lines = flattenOrderLines(order);
                return (
                  <li
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm"
                  >
                    <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${channel.headerClass}`}>
                      {t[channel.labelKey]}
                    </div>
                    <div className="p-3 pt-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-base font-bold text-white">{order.display_number}</span>
                      </div>
                      {order.customer_name ? (
                        <p className="mb-2 text-xs text-slate-400">{order.customer_name}</p>
                      ) : null}
                      <div className="space-y-1">
                        {lines.map((line) => (
                          <KdsLineItem key={line.id} line={line} interactive={false} />
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
