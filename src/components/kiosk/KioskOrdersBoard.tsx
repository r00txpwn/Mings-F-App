import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GripVertical,
  Loader2,
  Package,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Sale, SaleItem, SaleItemModifier } from '../../lib/supabase';

export interface KioskOrder extends Sale {
  sale_items: SaleItem[];
  delivery_order?: {
    tracking_url?: string | null;
    status?: string | null;
    wolt_delivery_id?: string | null;
  } | null;
}

const COLUMN_ORDER = ['pending', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export type KioskOrderStatus = (typeof COLUMN_ORDER)[number];

function resolveDropStatus(orders: KioskOrder[], overId: string): KioskOrderStatus | null {
  if (COLUMN_ORDER.includes(overId as KioskOrderStatus)) {
    return overId as KioskOrderStatus;
  }
  const order = orders.find((o) => o.id === overId);
  const s = order?.order_status || 'pending';
  return COLUMN_ORDER.includes(s as KioskOrderStatus) ? (s as KioskOrderStatus) : null;
}

function isPaymentConfirmedForPrep(pay: string | undefined): boolean {
  const p = pay || 'paid';
  if (p === 'paid' || p === 'completed') return true;
  return false;
}

function canMoveToStatus(order: KioskOrder, next: KioskOrderStatus): { ok: boolean; reason?: string } {
  const current = (order.order_status || 'pending') as KioskOrderStatus;
  if (current === next) return { ok: false };
  if (current === 'cancelled') return { ok: false, reason: 'Cancelled orders cannot be moved.' };
  if (current === 'completed' && next !== 'completed') {
    return { ok: false, reason: 'Completed orders stay in Done.' };
  }
  const pay = order.payment_status || 'paid';
  if (!isPaymentConfirmedForPrep(pay) && ['preparing', 'ready', 'completed'].includes(next)) {
    return { ok: false, reason: 'Confirm payment before moving past New.' };
  }
  if (next === 'cancelled' && !['pending', 'preparing'].includes(current)) {
    return { ok: false, reason: 'Only new or in-prep orders can be cancelled.' };
  }
  return { ok: true };
}

function DroppableColumn({
  id,
  title,
  count,
  accentClass,
  children,
}: {
  id: KioskOrderStatus;
  title: string;
  count: number;
  accentClass: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[min(70vh,520px)] w-[280px] shrink-0 flex-col rounded-2xl border transition-colors sm:w-[300px] ${
        isOver
          ? 'border-cockpit-500/60 bg-cockpit-500/5 ring-2 ring-cockpit-500/20'
          : 'border-slate-200/80 bg-slate-50/50 dark:border-white/10 dark:bg-slate-950/40'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5 dark:border-white/10 ${accentClass}`}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{title}</span>
        <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-xs tabular-nums text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          {count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">{children}</div>
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggleExpand,
}: {
  order: KioskOrder;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });
  const status = order.order_status || 'pending';
  const payRaw = order.payment_status || 'paid';
  const payStatus = payRaw === 'completed' || payRaw === 'paid' ? 'paid' : payRaw;

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm transition dark:border-white/10 dark:bg-slate-900/80 ${
        isDragging ? 'opacity-40 ring-2 ring-cockpit-500/30' : 'hover:border-cockpit-500/30'
      }`}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-0.5 flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-cockpit-600 active:cursor-grabbing dark:hover:bg-white/5 dark:hover:text-cockpit-400"
          aria-label="Drag order"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                #{order.display_number || '—'}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {payStatus === 'unpaid' || payStatus === 'pending'
                  ? payStatus === 'pending'
                    ? 'Pending payment'
                    : t.unpaid
                  : t.paid}{' '}
                · ₼{Number(order.total_price).toFixed(2)}
              </p>
            </div>
            <Package className="h-4 w-4 shrink-0 text-slate-400" />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {order.source === 'online_delivery'
                ? 'Online · Delivery'
                : order.source === 'online_takeaway'
                  ? 'Online · Takeaway'
                  : 'Kiosk'}
            </span>
            {(payStatus === 'unpaid' || payStatus === 'pending') && status !== 'cancelled' && (
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-200">
                {payStatus === 'pending' ? 'Awaiting card' : t.confirmPayment}
              </span>
            )}
          </div>

          {order.customer_phone ? (
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{order.customer_phone}</p>
          ) : null}
          {order.delivery_address ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500 dark:text-slate-400">{order.delivery_address}</p>
          ) : null}
          {order.delivery_order?.tracking_url ? (
            <a
              href={order.delivery_order.tracking_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-cockpit-600 hover:text-cockpit-500 dark:text-cockpit-400"
            >
              <ExternalLink className="h-3 w-3" />
              Wolt tracking
            </a>
          ) : null}

          {order.sale_items && order.sale_items.length > 0 && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="mt-2 flex w-full items-center gap-1 text-left text-xs font-medium text-cockpit-600 hover:text-cockpit-500 dark:text-cockpit-400"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {order.sale_items.length} {t.items}
            </button>
          )}

          {expanded && order.sale_items?.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs dark:border-white/10">
              {order.sale_items.map((item) => {
                const mods = (item as SaleItem & { sale_item_modifiers?: SaleItemModifier[] }).sale_item_modifiers;
                return (
                  <li key={item.id}>
                    <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
                      <span>
                        <span className="font-semibold text-cockpit-600 dark:text-cockpit-400">{item.quantity}×</span>{' '}
                        {item.product_name}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-slate-500">₼{Number(item.total_price).toFixed(2)}</span>
                    </div>
                    {mods && mods.length > 0 && (
                      <p className="ml-4 text-[10px] text-slate-500">{mods.map((m) => m.modifier_option_name).join(', ')}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CardPreview({ order }: { order: KioskOrder }) {
  return (
    <div className="cursor-grabbing rounded-xl border border-cockpit-500/40 bg-white p-3 shadow-2xl shadow-cockpit-500/20 dark:bg-slate-900">
      <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
        #{order.display_number || '—'}
      </p>
      <p className="text-xs text-slate-500">₼{Number(order.total_price).toFixed(2)}</p>
    </div>
  );
}

interface KioskOrdersBoardProps {
  orders: KioskOrder[];
  loading: boolean;
  emptyMessage: string;
  onStatusChange: (orderId: string, newStatus: KioskOrderStatus) => Promise<void>;
  onConfirmPayment: (orderId: string) => Promise<void>;
}

export function KioskOrdersBoard({
  orders,
  loading,
  emptyMessage,
  onStatusChange,
  onConfirmPayment,
}: KioskOrdersBoardProps) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor)
  );

  const byColumn = useMemo(() => {
    const map = new Map<KioskOrderStatus, KioskOrder[]>();
    for (const c of COLUMN_ORDER) map.set(c, []);
    for (const o of orders) {
      const s = (o.order_status || 'pending') as KioskOrderStatus;
      const col = COLUMN_ORDER.includes(s) ? s : 'pending';
      map.get(col)!.push(o);
    }
    return map;
  }, [orders]);

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: DragStartEvent) => {
    setError(null);
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const orderId = String(active.id);
    const newStatus = resolveDropStatus(orders, String(over.id));
    if (!newStatus) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const check = canMoveToStatus(order, newStatus);
    if (!check.ok) {
      setError(check.reason || 'Cannot move order here.');
      return;
    }

    await onStatusChange(orderId, newStatus);
  };

  const columnTitle = (s: KioskOrderStatus): string => {
    switch (s) {
      case 'pending':
        return t.pending;
      case 'preparing':
        return t.preparing;
      case 'ready':
        return t.ready;
      case 'completed':
        return t.completed;
      case 'cancelled':
        return t.cancelled;
      default:
        return s;
    }
  };

  const columnAccent: Record<KioskOrderStatus, string> = {
    pending: 'text-slate-600 dark:text-slate-300',
    preparing: 'text-cockpit-700 dark:text-cockpit-300',
    ready: 'text-emerald-700 dark:text-emerald-300',
    completed: 'text-slate-600 dark:text-slate-300',
    cancelled: 'text-rose-700 dark:text-rose-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="cockpit-panel py-16 text-center">
        <p className="text-lg text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Drag cards between columns to update status. Use the grip handle. Unpaid orders must stay in <strong>New</strong> until
        payment is confirmed.
      </p>

      {error ? (
        <div className="cockpit-alert-error text-sm" role="alert">
          {error}
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {COLUMN_ORDER.map((col) => (
            <DroppableColumn
              key={col}
              id={col}
              title={columnTitle(col)}
              count={byColumn.get(col)?.length ?? 0}
              accentClass={columnAccent[col]}
            >
              {(byColumn.get(col) ?? []).map((order) => (
                <div key={order.id} className="relative">
                  <OrderCard
                    order={order}
                    expanded={expanded.has(order.id)}
                    onToggleExpand={() => toggleExpand(order.id)}
                  />
                  {order.payment_status === 'unpaid' && order.order_status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => void onConfirmPayment(order.id)}
                      className="mt-2 w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      {t.confirmPayment}
                    </button>
                  )}
                </div>
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeOrder ? <CardPreview order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
