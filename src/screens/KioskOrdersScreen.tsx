import { useState, useEffect, useCallback } from 'react';
import { Monitor, ChevronDown, ChevronRight, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Sale, SaleItem, SaleItemModifier } from '../lib/supabase';

interface KioskOrder extends Sale {
  sale_items: SaleItem[];
}

type StatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export function KioskOrdersScreen() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sales')
      .select('*, sale_items(*, sale_item_modifiers(*))')
      .eq('source', 'kiosk')
      .gte('sale_date', dateFilter)
      .lte('sale_date', dateFilter + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('order_status', statusFilter);
    }

    const { data } = await query;
    if (data) setOrders(data as KioskOrder[]);
    setLoading(false);
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('admin-kiosk-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: 'source=eq.kiosk' },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const updates: Record<string, unknown> = { order_status: newStatus };
    if (newStatus === 'preparing') updates.prep_started_at = new Date().toISOString();
    if (newStatus === 'ready') updates.ready_at = new Date().toISOString();
    await supabase.from('sales').update(updates).eq('id', orderId);
    loadOrders();
  };

  const handleConfirmPayment = async (orderId: string) => {
    await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', orderId);
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    const labels: Record<string, string> = {
      pending: t.pending,
      preparing: t.preparing,
      ready: t.ready,
      completed: t.completed,
      cancelled: t.cancelled,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t.paid}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t.unpaid}</span>;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ${min % 60}m ago`;
  };

  const statusOptions: StatusFilter[] = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900 p-2 sm:p-3 rounded-xl">
              <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-700 dark:text-emerald-300" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t.kioskOrders}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open('/kiosk', '_blank')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t.viewKiosk}
            </button>
            <button
              onClick={loadOrders}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? t.allStatuses : s === 'pending' ? t.pending : s === 'preparing' ? t.preparing : s === 'ready' ? t.ready : s === 'completed' ? t.completed : t.cancelled}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t.noKioskOrders}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.displayNumber}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.status}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.payment}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{t.amount}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.date}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const status = order.order_status || 'pending';
                  const payStatus = order.payment_status || 'paid';
                  return (
                    <>{/* row group */}
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <span className="font-bold text-gray-900 dark:text-white">{order.display_number || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(status)}</td>
                        <td className="px-4 py-3">{getPaymentBadge(payStatus)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">₼{Number(order.total_price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{getTimeAgo(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {payStatus === 'unpaid' && status !== 'cancelled' && (
                              <button
                                onClick={() => handleConfirmPayment(order.id)}
                                className="px-2.5 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg"
                              >
                                {t.confirmPayment}
                              </button>
                            )}
                            {status === 'pending' && payStatus === 'paid' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                              >
                                {t.startPreparing}
                              </button>
                            )}
                            {status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'ready')}
                                className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              >
                                {t.markReady}
                              </button>
                            )}
                            {status === 'ready' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                className="px-2.5 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                              >
                                {t.markCompleted}
                              </button>
                            )}
                            {(status === 'pending' || status === 'preparing') && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                className="px-2.5 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg"
                              >
                                {t.cancelOrder}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && order.sale_items?.length > 0 && (
                        <tr key={`${order.id}-items`} className="bg-gray-50/50 dark:bg-gray-700/30">
                          <td colSpan={6} className="px-4 py-3 pl-12">
                            <div className="space-y-1.5">
                              {order.sale_items.map((item) => {
                                const mods = (item as SaleItem & { sale_item_modifiers?: SaleItemModifier[] }).sale_item_modifiers;
                                return (
                                  <div key={item.id}>
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.quantity}x</span>
                                        <span className="text-gray-700 dark:text-gray-300">{item.product_name}</span>
                                      </div>
                                      <span className="text-gray-600 dark:text-gray-400">₼{Number(item.total_price).toFixed(2)}</span>
                                    </div>
                                    {mods && mods.length > 0 && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500 ml-8">
                                        {mods.map(m => m.modifier_option_name).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
