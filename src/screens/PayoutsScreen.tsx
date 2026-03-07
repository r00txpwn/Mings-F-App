import { useState, useEffect } from 'react';
import { Banknote, Plus, Check, CreditCard as Edit2, Trash2, X, Loader2, TrendingDown, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SalesChannel, PlatformPayout } from '../lib/supabase';

interface PayoutWithCalc extends PlatformPayout {
  grossSales: number;
  commissionAmount: number;
  commissionPercent: number;
}

export function PayoutsScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [payouts, setPayouts] = useState<PayoutWithCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPayout, setEditingPayout] = useState<PlatformPayout | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [channelId, setChannelId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [previewGross, setPreviewGross] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadChannels();
    loadPayouts();
  }, []);

  useEffect(() => {
    if (channelId && periodStart && periodEnd) {
      loadPreviewGross();
    } else {
      setPreviewGross(null);
    }
  }, [channelId, periodStart, periodEnd]);

  const PLATFORM_NAMES = ['Wolt', 'Bolt'];

  const loadChannels = async () => {
    const { data } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('is_active', true)
      .in('name', PLATFORM_NAMES)
      .order('name');
    if (data) setChannels(data);
  };

  const loadPayouts = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('platform_payouts')
      .select('*, sales_channels(id, name, icon, color, logo_url)')
      .order('payout_date', { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data) {
      const withCalc = await Promise.all(
        data.map(async (p: PlatformPayout) => {
          const gross = await calcGrossSales(p.sales_channel_id, p.period_start, p.period_end);
          const commissionAmount = gross - Number(p.payout_amount);
          const commissionPercent = gross > 0 ? (commissionAmount / gross) * 100 : 0;
          return { ...p, grossSales: gross, commissionAmount, commissionPercent };
        })
      );
      setPayouts(withCalc);
    }
    setLoading(false);
  };

  const calcGrossSales = async (channelId: string, start: string, end: string): Promise<number> => {
    const { data } = await supabase
      .from('sales')
      .select('total_price')
      .eq('sales_channel_id', channelId)
      .gte('sale_date', start)
      .lte('sale_date', end + 'T23:59:59');

    if (!data) return 0;
    return data.reduce((sum, s: { total_price: number }) => sum + Number(s.total_price), 0);
  };

  const loadPreviewGross = async () => {
    setLoadingPreview(true);
    const gross = await calcGrossSales(channelId, periodStart, periodEnd);
    setPreviewGross(gross);
    setLoadingPreview(false);
  };

  const resetForm = () => {
    setChannelId('');
    setPeriodStart('');
    setPeriodEnd('');
    setPayoutAmount('');
    setPayoutDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPreviewGross(null);
    setEditingPayout(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!channelId || !periodStart || !periodEnd || !payoutAmount || Number(payoutAmount) <= 0) return;

    setSaving(true);
    setError(null);

    const payload = {
      sales_channel_id: channelId,
      period_start: periodStart,
      period_end: periodEnd,
      payout_amount: Number(payoutAmount),
      payout_date: payoutDate,
      notes: notes || '',
      created_by: user?.id || null,
    };

    let err;
    if (editingPayout) {
      const res = await supabase
        .from('platform_payouts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingPayout.id);
      err = res.error;
    } else {
      const res = await supabase.from('platform_payouts').insert(payload);
      err = res.error;
    }

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    setShowSuccess(true);
    resetForm();
    loadPayouts();
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleEdit = (p: PayoutWithCalc) => {
    setEditingPayout(p);
    setChannelId(p.sales_channel_id);
    setPeriodStart(p.period_start);
    setPeriodEnd(p.period_end);
    setPayoutAmount(String(p.payout_amount));
    setPayoutDate(p.payout_date);
    setNotes(p.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('platform_payouts').delete().eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    setDeleteConfirm(null);
    loadPayouts();
  };

  const totalGross = payouts.reduce((s, p) => s + p.grossSales, 0);
  const totalPaid = payouts.reduce((s, p) => s + Number(p.payout_amount), 0);
  const totalCommission = payouts.reduce((s, p) => s + p.commissionAmount, 0);
  const avgCommissionRate = totalGross > 0 ? (totalCommission / totalGross) * 100 : 0;

  const previewCommission = previewGross !== null && payoutAmount
    ? previewGross - Number(payoutAmount)
    : null;
  const previewRate = previewGross && previewGross > 0 && previewCommission !== null
    ? (previewCommission / previewGross) * 100
    : null;

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t.platformPayouts}</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.trackPlatformPayouts}</p>
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

      {payouts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label={t.grossSales}
            value={`₼${totalGross.toFixed(2)}`}
            color="text-gray-900 dark:text-white"
          />
          <SummaryCard
            label={t.payoutReceived}
            value={`₼${totalPaid.toFixed(2)}`}
            color="text-teal-600 dark:text-teal-400"
          />
          <SummaryCard
            label={t.totalCommissions}
            value={`₼${totalCommission.toFixed(2)}`}
            color="text-red-600 dark:text-red-400"
          />
          <SummaryCard
            label={t.commissionRate}
            value={`${avgCommissionRate.toFixed(1)}%`}
            color="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-2.5 px-5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t.addPayout}
        </button>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingPayout ? t.editPayout : t.addPayout}
            </h2>
            <button onClick={resetForm} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t.selectPlatform} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChannelId(ch.id)}
                    className={`relative p-3 rounded-lg border transition-all ${
                      channelId === ch.id
                        ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {channelId === ch.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-teal-500 dark:bg-teal-400 rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-center justify-center h-8 mb-1">
                      {ch.logo_url ? (
                        <img src={ch.logo_url} alt={ch.name} className="h-8 w-8 object-contain" />
                      ) : (
                        <span className="text-xl">{ch.icon}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white text-center">{ch.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t.periodStart} *
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t.periodEnd} *
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t.payoutAmount} (₼) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">₼</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t.payoutDate} *
                </label>
                <input
                  type="date"
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t.notes}
                </label>
                <input
                  type="text"
                  placeholder={t.notes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {channelId && periodStart && periodEnd && (
            <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t.payoutSummary}</h3>
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.pleaseWait}
                </div>
              ) : previewGross !== null ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.grossSales}</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₼{previewGross.toFixed(2)}
                    </div>
                  </div>
                  {payoutAmount && Number(payoutAmount) > 0 && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.commission}</div>
                        <div className={`text-lg font-semibold ${(previewCommission ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ₼{(previewCommission ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.commissionRate}</div>
                        <div className={`text-lg font-semibold ${(previewRate ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                          {(previewRate ?? 0).toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                  {previewGross === 0 && (
                    <div className="col-span-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      {t.noSalesInPeriod}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!channelId || !periodStart || !periodEnd || !payoutAmount || Number(payoutAmount) <= 0 || saving}
            className="mt-5 w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? t.pleaseWait : editingPayout ? t.update : t.save}
          </button>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t.payouts}</h2>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t.noPayoutsYet}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t.createFirstPayout}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.map((p) => {
                const ch = p.sales_channels;
                const isExpanded = expandedId === p.id;
                const isDeleting = deleteConfirm === p.id;

                return (
                  <div key={p.id}>
                    <div
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {ch?.logo_url ? (
                          <img src={ch.logo_url} alt={ch.name} className="h-9 w-9 object-contain" />
                        ) : (
                          <span className="text-2xl">{ch?.icon}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{ch?.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(p.period_start).toLocaleDateString()} - {new Date(p.period_end).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t.payoutDate}: {new Date(p.payout_date).toLocaleDateString()}
                          {p.notes ? ` | ${p.notes}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                            ₼{Number(p.payout_amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t.payoutReceived}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${p.commissionAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            ₼{p.commissionAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {p.commissionPercent.toFixed(1)}% {t.commission}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-gray-50 dark:bg-gray-700/30">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
                          <DetailCell label={t.grossSales} value={`₼${p.grossSales.toFixed(2)}`} />
                          <DetailCell label={t.payoutReceived} value={`₼${Number(p.payout_amount).toFixed(2)}`} />
                          <DetailCell label={t.commission} value={`₼${p.commissionAmount.toFixed(2)}`} valueClass={p.commissionAmount > 0 ? 'text-red-600 dark:text-red-400' : ''} />
                          <DetailCell label={t.commissionRate} value={`${p.commissionPercent.toFixed(1)}%`} valueClass={p.commissionPercent > 0 ? 'text-amber-600 dark:text-amber-400' : ''} />
                        </div>

                        {isDeleting ? (
                          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mt-2">
                            <span className="text-sm text-red-900 dark:text-red-100">{t.deletePayoutConfirm}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                              >
                                {t.delete}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded"
                              >
                                {t.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              {t.edit}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {t.delete}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DetailCell({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-sm font-semibold text-gray-900 dark:text-white ${valueClass}`}>{value}</div>
    </div>
  );
}
