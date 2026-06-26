import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Check, ChevronDown, ChevronRight, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, SalesChannel, Sale } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { isPartnerManualSaleChannel } from '../lib/partnerSalesChannels';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';

interface GroupedSale {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  channels: SalesChannel[];
}

/** Partner channels allowed for manual Add Sale (kiosk / online are created by the app). */
function isManualSaleChannel(ch: SalesChannel): boolean {
  return isPartnerManualSaleChannel(ch);
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

  const manualChannels = useMemo(
    () => channels.filter(isManualSaleChannel).sort((a, b) => a.name.localeCompare(b.name)),
    [channels],
  );

  const editChannelOptions = useMemo(() => {
    if (!editingSale?.sales_channel_id) return manualChannels;
    const current = channels.find((c) => c.id === editingSale.sales_channel_id);
    if (!current || manualChannels.some((c) => c.id === current.id)) return manualChannels;
    return [...manualChannels, current].sort((a, b) => a.name.localeCompare(b.name));
  }, [channels, editingSale?.sales_channel_id, manualChannels]);

  useEffect(() => {
    loadChannels();
    loadSales();
  }, []);

  useEffect(() => {
    if (manualChannels.length === 0) {
      setSelectedChannel(null);
      return;
    }
    setSelectedChannel((prev) =>
      prev && manualChannels.some((c) => c.id === prev) ? prev : manualChannels[0].id,
    );
  }, [manualChannels]);

  const loadChannels = async () => {
    const { data, error: err } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setChannels(data);
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
    if (!selectedChannel || !manualChannels.some((c) => c.id === selectedChannel)) {
      setError(t.salesNoManualChannelsConfigured);
      return;
    }

    setSaving(true);
    setError(null);

    const totalPrice = Number(amount);
    const qty = Number(orderCount);
    const unitPrice = totalPrice / qty;

    const result = await adminInsert('sales', {
      total_price: totalPrice,
      quantity: qty,
      unit_price: unitPrice,
      sales_channel_id: selectedChannel,
      notes: description || '',
      sale_date: transactionDate,
      created_by: user?.id || null,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? 'Insert failed');
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

    const result = await adminUpdate('sales', editingSale.id, {
      total_price: Number(editingSale.total_price),
      quantity: editingSale.quantity,
      unit_price: unitPrice,
      sales_channel_id: editingSale.sales_channel_id,
      notes: editingSale.notes,
      sale_date: editingSale.sale_date.split('T')[0],
    });

    if (!result.ok) {
      setError(result.error ?? 'Update failed');
      return;
    }

    setEditingSale(null);
    loadSales();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const result = await adminDelete('sales', id);

    if (!result.ok) {
      setError(result.error ?? 'Delete failed');
      return;
    }

    setDeleteConfirm(null);
    loadSales();
  };

  return (
    <div className="animate-fadeIn mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow={t.sales}
        title={t.addSale}
        description={t.recordSale}
        icon={ShoppingCart}
      />

      {error && <div className="cockpit-alert-error">{error}</div>}

      {showSuccess && (
        <div className="cockpit-alert-success">
          <Check className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t.savedSuccessfully}</span>
        </div>
      )}

      <div className="cockpit-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="cockpit-label">{t.saleAmount}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">₼</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="cockpit-input pl-8 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="cockpit-label">{t.numberOfOrders}</label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={orderCount}
              onChange={(e) => setOrderCount(e.target.value)}
              className="cockpit-input font-mono"
            />
          </div>
        </div>

        {amount && orderCount && Number(amount) > 0 && Number(orderCount) > 0 && (
          <div className="cockpit-inset mt-4 p-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t.aov}</span>
              <span className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                ₼{aov.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="cockpit-label">{t.salesChannels}</label>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t.salesManualEntryHint}</p>
          {manualChannels.length === 0 ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              {t.salesNoManualChannelsConfigured}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {manualChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`relative rounded-xl border px-3 py-2.5 transition-all ${
                    selectedChannel === channel.id
                      ? 'border-cockpit-500 bg-cockpit-500/10 shadow-md shadow-cockpit-500/15 dark:border-cockpit-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-white/20'
                  }`}
                >
                  {selectedChannel === channel.id && (
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cockpit-600 shadow-md dark:bg-cockpit-500">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className="mb-1.5 flex h-8 items-center justify-center">
                    {channel.logo_url ? (
                      <img src={channel.logo_url} alt={channel.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="text-xl">{channel.icon}</div>
                    )}
                  </div>
                  <div className="text-center text-xs font-semibold text-slate-900 dark:text-white">{channel.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="cockpit-label">{t.transactionDate}</label>
            <SingleDatePicker
              value={transactionDate}
              onChange={setTransactionDate}
              placeholder={t.transactionDate}
            />
          </div>

          <div>
            <label className="cockpit-label">{t.saleDescription}</label>
            <input
              type="text"
              placeholder={t.saleDescription}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="cockpit-input"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={
            !amount ||
            Number(amount) <= 0 ||
            !orderCount ||
            Number(orderCount) <= 0 ||
            saving ||
            manualChannels.length === 0 ||
            !selectedChannel
          }
          className="cockpit-btn-primary mt-5 w-full py-2.5"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {saving ? t.pleaseWait : t.save}
        </button>
      </div>

      <div>
        <h2 className="cockpit-section-title mb-3">{t.recentSales}</h2>
        <div className="cockpit-table-wrap">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-cockpit-500" />
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t.noSalesYet}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="cockpit-thead">
                  <tr>
                    <th className="cockpit-th">{t.date}</th>
                    <th className="cockpit-th">{t.salesChannels}</th>
                    <th className="cockpit-th">{t.orders}</th>
                    <th className="cockpit-th">{t.aov}</th>
                    <th className="cockpit-th">{t.totalSales}</th>
                  </tr>
                </thead>
                <tbody>
                  {getGroupedSales().map((groupedSale) => {
                    const isExpanded = expandedDates.has(groupedSale.date);
                    const dateSales = getSalesForDate(groupedSale.date);

                    return (
                      <>{/* Fragment key on the parent tr */}
                        <tr
                          key={groupedSale.date}
                          className="cockpit-tr cursor-pointer"
                          onClick={() => toggleDateExpansion(groupedSale.date)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              )}
                              {new Date(groupedSale.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {groupedSale.channels.length === 0 ? (
                                <span className="text-xs text-slate-500 dark:text-slate-400">N/A</span>
                              ) : (
                                groupedSale.channels.map((channel) => (
                                  <div
                                    key={channel.id}
                                    className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-900 dark:bg-slate-700 dark:text-white"
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
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                            {groupedSale.totalOrders}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
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
                              <tr key={sale.id} className="bg-cockpit-500/10" onClick={(e) => e.stopPropagation()}>
                                <td className="px-4 py-3 pl-12">
                                  <SingleDatePicker
                                    value={editingSale.sale_date.split('T')[0]}
                                    onChange={(date) => setEditingSale({ ...editingSale, sale_date: date })}
                                    placeholder={t.date}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={editingSale.sales_channel_id || ''}
                                    onChange={(e) => setEditingSale({ ...editingSale, sales_channel_id: e.target.value || null })}
                                    className="cockpit-select py-1.5 text-sm"
                                  >
                                    <option value="">{t.none}</option>
                                    {editChannelOptions.map((ch) => (
                                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <div>
                                      <label className="text-xs text-slate-600 dark:text-slate-400">{t.orders}</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={editingSale.quantity}
                                        onChange={(e) => setEditingSale({ ...editingSale, quantity: Number(e.target.value) })}
                                        className="cockpit-input w-20 px-2 py-1 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-600 dark:text-slate-400">{t.amount}</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingSale.total_price}
                                        onChange={(e) => setEditingSale({ ...editingSale, total_price: Number(e.target.value) })}
                                        className="cockpit-input w-24 px-2 py-1 text-sm"
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
                                    className="cockpit-input w-full px-2 py-1 text-sm"
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
                                      className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded"
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
                              <tr key={sale.id} className="bg-rose-500/10" onClick={(e) => e.stopPropagation()}>
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
                                        className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded"
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
                              className="bg-slate-50/60 dark:bg-slate-700/25 hover:bg-slate-100 dark:hover:bg-slate-700/40"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <td className="px-4 py-2 pl-12 text-sm text-slate-600 dark:text-slate-400">
                                {channel?.name || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">
                                {channel?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">
                                {sale.quantity} {t.orders} &bull; ₼{Number(sale.total_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
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
