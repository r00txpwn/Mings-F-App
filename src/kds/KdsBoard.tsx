import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  groupOrdersByStatus,
  type KdsKitchenOrder,
  type KdsOrderGroups,
} from './kdsBoardUtils';
import { KdsColumn, type KdsColumnVariant } from './KdsColumn';
import { KdsEmptyState } from './KdsEmptyState';
import { KdsOrderCard } from './KdsOrderCard';

export type KdsBoardColumnKey = keyof KdsOrderGroups;

interface KdsBoardProps {
  orders: KdsKitchenOrder[];
  now: number;
  preparingCount: number;
  updatingOrderIds: Set<string>;
  updatingItemIds?: Set<string>;
  hasAnyOrders: boolean;
  isFilteredEmpty: boolean;
  onUpdateStatus: (orderId: string, newStatus: string, opts?: { prepMinutes?: number }) => void;
  onToggleItemPrep?: (saleItemId: string, prepared: boolean) => void;
}

const MOBILE_TAB_STYLES: Record<KdsBoardColumnKey, string> = {
  pending: 'bg-violet-600 text-white shadow-sm',
  preparing: 'bg-cyan-600 text-white shadow-sm',
  ready: 'bg-emerald-600 text-white shadow-sm',
};

export function KdsBoard({
  orders,
  now,
  preparingCount,
  updatingOrderIds,
  updatingItemIds,
  hasAnyOrders,
  isFilteredEmpty,
  onUpdateStatus,
  onToggleItemPrep,
}: KdsBoardProps) {
  const { t } = useLanguage();
  const groups = groupOrdersByStatus(orders);
  const [mobileTab, setMobileTab] = useState<KdsBoardColumnKey>('pending');

  const columnDefs: {
    key: KdsBoardColumnKey;
    variant: KdsColumnVariant;
    title: string;
    items: KdsKitchenOrder[];
  }[] = [
    { key: 'pending', variant: 'pending', title: t.pending, items: groups.pending },
    { key: 'preparing', variant: 'preparing', title: t.preparing, items: groups.preparing },
    { key: 'ready', variant: 'ready', title: t.ready, items: groups.ready },
  ];

  const renderCards = (items: KdsKitchenOrder[]) =>
    items.map((order) => (
      <KdsOrderCard
        key={order.id}
        order={order}
        now={now}
        ordersInPrepCount={preparingCount}
        isUpdating={updatingOrderIds.has(order.id)}
        updatingItemIds={updatingItemIds}
        onUpdateStatus={onUpdateStatus}
        onToggleItemPrep={onToggleItemPrep}
      />
    ));

  const columnEmpty = (key: KdsBoardColumnKey) => {
    if (isFilteredEmpty) {
      return (
        <KdsEmptyState compact title={t.kdsEmptyFiltered} hint={t.kdsEmptyFilteredHint} />
      );
    }
    if (!hasAnyOrders) {
      return (
        <KdsEmptyState
          compact
          title={key === 'pending' ? t.kdsEmptyQueueTitle : t.kdsEmptyColumn}
          hint={key === 'pending' ? t.kdsEmptyQueueHint : undefined}
        />
      );
    }
    return <KdsEmptyState compact title={t.kdsEmptyColumn} />;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isFilteredEmpty && hasAnyOrders ? (
        <div className="mx-3 mt-3 shrink-0 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-100/90">
          {t.kdsEmptyFiltered}
        </div>
      ) : null}

      <div className="flex shrink-0 gap-1.5 border-b border-slate-800/60 p-2 md:hidden">
        {columnDefs.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() => setMobileTab(col.key)}
            className={`min-h-[44px] flex-1 touch-manipulation rounded-xl px-2 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              mobileTab === col.key ? MOBILE_TAB_STYLES[col.key] : 'bg-slate-800/80 text-slate-400'
            }`}
          >
            {col.title}
            <span className="ml-1 tabular-nums opacity-80">({col.items.length})</span>
          </button>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 gap-3 overflow-x-auto p-3 md:flex">
        {columnDefs.map((col) => (
          <KdsColumn key={col.key} title={col.title} count={col.items.length} variant={col.variant}>
            {col.items.length === 0 ? columnEmpty(col.key) : renderCards(col.items)}
          </KdsColumn>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 md:hidden">
        {(() => {
          const col = columnDefs.find((c) => c.key === mobileTab)!;
          if (col.items.length === 0) {
            return columnEmpty(col.key);
          }
          return <div className="flex flex-col gap-3">{renderCards(col.items)}</div>;
        })()}
      </div>
    </div>
  );
}
