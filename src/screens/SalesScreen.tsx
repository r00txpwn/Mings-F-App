import { useState, useEffect } from 'react';
import { ShoppingCart, Check, ChevronDown, ChevronRight, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, SalesChannel, Sale } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GroupedSale {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  channels: SalesChannel[];
}

export function SalesScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [orderCount, setOrderCount] = useState('1');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aov = (Number(amount) / Number(orderCount)) || 0;

  useEffect(() => {
    loadChannels();
    loadSales();
  }, []);

  const loadChannels = async () => {
    const { data, error: err } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setChannels(data);
      if (data.length > 0) {
        setSelectedChannel(data[0].id);
      }
    }
  };

  const loadSales = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('sales')
      .select('*, sales_channels(*)')
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (err) {
      setError(err.message);
    }
    if (data) {
      setSales(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0 || !orderCount || Number(orderCount) <= 0) return;

    setSaving(true);
    setError(null);

    const totalPrice = Number(amount);
    const qty = Number(orderCount);
    const unitPrice = totalPrice / qty;

    const { error: err } = await supabase.from('sales').insert({
      total_price: totalPrice,
      quantity: qty,
      unit_price: unitPrice,
      sales_channel_id: selectedChannel,
      notes: description || '',
      sale_date: transactionDate,
      created_by: user?.id || null,
    });

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    setShowSuccess(true);
    setAmount('');
    setOrderCount('1');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    loadSales();

    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const getGroupedSales = (): GroupedSale[] => {
    const grouped = new Map<string, { revenue: number; orders: number; channelIds: Set<string> }>();

    sales.forEach((sale) => {
      const date = sale.sale_date.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, { revenue: 0, orders: 0, channelIds: new Set() });
      }
      const group = grouped.get(date)!;
      group.revenue += Number(sale.total_price);
      group.orders += sale.quantity;
      if (sale.sales_channel_id) {
        group.channelIds.add(sale.sales_channel_id);
      }
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      totalRevenue: data.revenue,
      totalOrders: data.orders,
      aov: data.orders > 0 ? data.revenue / data.orders : 0,
      channels: Array.from(data.channelIds)
        .map(id => channels.find(c => c.id === id))
        .filter((c): c is SalesChannel => c !== undefined),
    }));
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const getSalesForDate = (date: string): Sale[] => {
    return sales.filter(sale => sale.sale_date.split('T')[0] === date);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale({ ...sale });
  };

  const handleUpdate = async () => {
    if (!editingSale) return;

    setError(null);
    const unitPrice = editingSale.quantity > 0
      ? Number(editingSale.total_price) / editingSale.quantity
      : Number(editingSale.total_price);

    const { error: err } = await supabase
      .from('sales')
      .update({
        total_price: Number(editingSale.total_price),
        quantity: editingSale.quantity,
        unit_price: unitPrice,
        sales_channel_id: editingSale.sales_channel_id,
        notes: editingSale.notes,
        sale_date: editingSale.sale_date.split('T')[0],
      })
      .eq('id', editingSale.id);

    if (err) {
      setError(err.message);
      return;
    }

    setEditingSale(null);
    loadSales();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const { error: err } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (err) {
      setError(err.message);
      return;
    }

    setDeleteConfirm(null);
    loadSales();
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t.addSale}</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.recordSale}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg p-3 mb-6 text-red-900 dark:text-red-100 text-sm">
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg p-3 mb-6 flex items-center gap-2 animate-scaleIn">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-900 dark:text-green-100 text-sm font-medium">{t.savedSuccessfully}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t.saleAmount}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">₼</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t.numberOfOrders}
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={orderCount}
              onChange={(e) => setOrderCount(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {amount && orderCount && Number(amount) > 0 && Number(orderCount) > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t.aov}</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">₼{aov.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t.salesChannels}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`relative p-3 rounded-lg border transition-all ${
                  selectedChannel === channel.id
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {selectedChannel === channel.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="mb-2 flex items-center justify-center h-10">
                  {channel.logo_url ? (
                    <img src={channel.logo_url} alt={channel.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-2xl">{channel.icon}</div>
                  )}
                </div>
                <div className="text-xs font-medium text-gray-900 dark:text-white text-center">
                  {channel.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t.transactionDate}
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t.saleDescription}
            </label>
            <input
              type="text"
              placeholder={t.saleDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!amount || Number(amount) <= 0 || !orderCount || Number(orderCount) <= 0 || saving}
          className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {saving ? t.pleaseWait : t.save}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.recentSales}</h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t.noSalesYet}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.date}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.salesChannels}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.orders}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.aov}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.totalSales}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getGroupedSales().map((groupedSale) => {
                    const isExpanded = expandedDates.has(groupedSale.date);
                    const dateSales = getSalesForDate(groupedSale.date);

                    return (
                      <>{/* Fragment key on the parent tr */}
                        <tr
                          key={groupedSale.date}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => toggleDateExpansion(groupedSale.date)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              )}
                              {new Date(groupedSale.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {groupedSale.channels.length === 0 ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                              ) : (
                                groupedSale.channels.map((channel) => (
                                  <div
                                    key={channel.id}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-900 dark:text-white"
                                  >
                                    {channel.logo_url ? (
                                      <img src={channel.logo_url} alt={channel.name} className="h-3 w-3 object-contain" />
                                    ) : (
                                      <span className="text-sm">{channel.icon}</span>
                                    )}
                                    <span>{channel.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                            {groupedSale.totalOrders}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            ₼{groupedSale.aov.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                            ₼{groupedSale.totalRevenue.toFixed(2)}
                          </td>
                        </tr>

                        {isExpanded && dateSales.map((sale) => {
                          const channel = channels.find(c => c.id === sale.sales_channel_id);
                          const isEditing = editingSale?.id === sale.id;
                          const isDeleting = deleteConfirm === sale.id;

                          if (isEditing) {
                            return (
                              <tr key={sale.id} className="bg-blue-50 dark:bg-blue-900/20" onClick={(e) => e.stopPropagation()}>
                                <td className="px-4 py-3 pl-12">
                                  <input
                                    type="date"
                                    value={editingSale.sale_date.split('T')[0]}
                                    onChange={(e) => setEditingSale({ ...editingSale, sale_date: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={editingSale.sales_channel_id || ''}
                                    onChange={(e) => setEditingSale({ ...editingSale, sales_channel_id: e.target.value || null })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="">{t.none}</option>
                                    {channels.map(ch => (
                                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <div>
                                      <label className="text-xs text-gray-600 dark:text-gray-400">{t.orders}</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={editingSale.quantity}
                                        onChange={(e) => setEditingSale({ ...editingSale, quantity: Number(e.target.value) })}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600 dark:text-gray-400">{t.amount}</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingSale.total_price}
                                        onChange={(e) => setEditingSale({ ...editingSale, total_price: Number(e.target.value) })}
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    placeholder={t.description}
                                    value={editingSale.notes}
                                    onChange={(e) => setEditingSale({ ...editingSale, notes: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdate(); }}
                                      className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditingSale(null); }}
                                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          if (isDeleting) {
                            return (
                              <tr key={sale.id} className="bg-red-50 dark:bg-red-900/20" onClick={(e) => e.stopPropagation()}>
                                <td colSpan={5} className="px-4 py-3 pl-12">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-red-900 dark:text-red-100">
                                      {t.deleteSaleConfirm}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(sale.id); }}
                                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                                      >
                                        {t.delete}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                        className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded"
                                      >
                                        {t.cancel}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={sale.id}
                              className="bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <td className="px-4 py-2 pl-12 text-sm text-gray-600 dark:text-gray-400">
                                {channel?.name || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {channel?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {sale.quantity} {t.orders} &bull; ₼{Number(sale.total_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                {sale.notes || '-'}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(sale); }}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(sale.id); }}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
