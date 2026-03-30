import { useState, useEffect } from 'react';
import { Banknote, Plus, Check, Edit2, Trash2, X, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, SalesChannel, PlatformPayout } from '../lib/supabase';
import { DateRangePicker } from '../components/DateRangePicker';
import { fetchPayoutReconciliation } from '../services/analytics';
import type { ReconciliationStatus } from '../types/analytics';
import { PageHeader } from '../components/cockpit';
import { IconActionButton } from '../components/ui/IconActionButton';
import { DangerConfirmRow } from '../components/ui/DangerConfirmRow';

interface PayoutWithCalc extends PlatformPayout {
  grossSales: number;
  commissionAmount: number;
  commissionPercent: number;
  reconciliationStatus: ReconciliationStatus;
  payoutDifference: number;
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
    setError(null);
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
      const payoutsData = data as PlatformPayout[];
      const minStart = payoutsData.reduce((min, p) => (p.period_start < min ? p.period_start : min), payoutsData[0]?.period_start);
      const maxEnd = payoutsData.reduce((max, p) => (p.period_end > max ? p.period_end : max), payoutsData[0]?.period_end);
      const channelIds = [...new Set(payoutsData.map((p) => p.sales_channel_id))];

      let reconciliationById = new Map<
        string,
        { expectedAmount: number; difference: number; status: ReconciliationStatus }
      >();

      if (payoutsData.length > 0) {
        const { data: reconciliation, error: reconciliationError } = await fetchPayoutReconciliation({
          startDate: minStart,
          endDate: maxEnd,
          channelIds,
        });

        if (reconciliationError) {
          setError(reconciliationError);
        } else if (reconciliation) {
          reconciliationById = new Map(
            reconciliation.items.map((item) => [
              item.payoutId,
              {
                expectedAmount: item.expectedAmount,
                difference: item.difference,
                status: item.status,
              },
            ])
          );
        }
      }

      const withCalc = await Promise.all(
        payoutsData.map(async (p) => {
          const reconciliation = reconciliationById.get(p.id);
          const gross = reconciliation ? reconciliation.expectedAmount : await calcGrossSales(p.sales_channel_id, p.period_start, p.period_end);
          const commissionAmount = gross - Number(p.payout_amount);
          const commissionPercent = gross > 0 ? (commissionAmount / gross) * 100 : 0;
          return {
            ...p,
            grossSales: gross,
            commissionAmount,
            commissionPercent,
            reconciliationStatus: reconciliation?.status ?? 'pending',
            payoutDifference: reconciliation?.difference ?? Number(p.payout_amount) - gross,
          };
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

  const previewDifference = previewGross !== null && payoutAmount
    ? Number(payoutAmount) - previewGross
    : null;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.money}
        title={t.platformPayouts}
        description={t.trackPlatformPayouts}
        icon={Banknote}
        actions={
          !showForm ? (
            <button type="button" onClick={() => setShowForm(true)} className="cockpit-btn-primary">
              <Plus className="h-5 w-5" />
              {t.addPayout}
            </button>
          ) : null
        }
      />

      {error ? (
        <div className="cockpit-alert-error mb-6">{error}</div>
      ) : null}

      {showSuccess ? (
        <div className="cockpit-alert-success mb-6 animate-scaleIn">
          <Check className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-200" />
          <span>{t.savedSuccessfully}</span>
        </div>
      ) : null}

      {payouts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label={t.grossSales}
            value={`₼${totalGross.toFixed(2)}`}
            color="text-slate-900 dark:text-white"
          />
          <SummaryCard
            label={t.payoutReceived}
            value={`₼${totalPaid.toFixed(2)}`}
            color="text-cockpit-600 dark:text-cockpit-400"
          />
          <SummaryCard
            label={t.totalCommissions}
            value={`₼${totalCommission.toFixed(2)}`}
            color="text-rose-600 dark:text-rose-400"
          />
          <SummaryCard
            label={t.commissionRate}
            value={`${avgCommissionRate.toFixed(1)}%`}
            color="text-amber-600 dark:text-amber-400"
          />
        </div>
      )}

      {showForm ? (
        <div className="cockpit-panel mb-6 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="cockpit-section-title">
              {editingPayout ? t.editPayout : t.addPayout}
            </h2>
            <button type="button" onClick={resetForm} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="cockpit-label mb-2">
                {t.selectPlatform} *
              </label>
              <div className="flex flex-wrap gap-3">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannelId(ch.id)}
                    className={`relative flex items-center gap-2.5 rounded-xl border px-4 py-2.5 transition-all ${
                      channelId === ch.id
                        ? 'border-cockpit-500 bg-cockpit-500/10 shadow-md shadow-cockpit-500/10 dark:border-cockpit-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-white/20'
                    }`}
                  >
                    {channelId === ch.id && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cockpit-600 shadow-md dark:bg-cockpit-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    {ch.logo_url ? (
                      <img src={ch.logo_url} alt={ch.name} className="h-6 w-6 object-contain" />
                    ) : (
                      <span className="text-lg">{ch.icon}</span>
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="cockpit-label mb-1.5">
                  {t.period} *
                </label>
                <DateRangePicker
                  startDate={periodStart}
                  endDate={periodEnd}
                  onStartChange={setPeriodStart}
                  onEndChange={setPeriodEnd}
                  startLabel={t.startDate}
                  endLabel={t.endDate}
                />
              </div>
              <div>
                <label className="cockpit-label mb-1.5">
                  {t.payoutAmount} (₼) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-500 dark:text-slate-400">₼</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="cockpit-input pl-7 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="cockpit-label mb-1.5">
                  {t.payoutDate} *
                </label>
                <input
                  type="date"
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                  className="cockpit-input font-mono text-sm"
                />
              </div>
              <div>
                <label className="cockpit-label mb-1.5">
                  {t.notes}
                </label>
                <input
                  type="text"
                  placeholder={t.notes}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="cockpit-input"
                />
              </div>
            </div>
          </div>

          {channelId && periodStart && periodEnd && (
            <div className="cockpit-inset mt-4 rounded-xl p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t.payoutSummary}</h3>
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-cockpit-500" />
                  {t.pleaseWait}
                </div>
              ) : previewGross !== null ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t.expected}</div>
                    <div className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                      ₼{previewGross.toFixed(2)}
                    </div>
                  </div>
                  {payoutAmount && Number(payoutAmount) > 0 && (
                    <>
                      <div>
                        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t.actual}</div>
                        <div className="font-mono text-lg font-semibold tabular-nums text-cockpit-600 dark:text-cockpit-400">
                          ₼{Number(payoutAmount).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t.difference}</div>
                        <div className={`font-mono text-lg font-semibold tabular-nums ${(previewDifference ?? 0) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                          {previewDifference !== null && previewDifference > 0 ? '+' : ''}₼{(previewDifference ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}
                  {previewGross === 0 && (
                    <div className="col-span-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {t.noSalesInPeriod}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!channelId || !periodStart || !periodEnd || !payoutAmount || Number(payoutAmount) <= 0 || saving}
            className="cockpit-btn-primary mt-4 w-full justify-center disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? t.pleaseWait : editingPayout ? t.update : t.save}
          </button>
        </div>
      ) : null}

      <div>
        <h2 className="cockpit-section-title mb-4">{t.payouts}</h2>
        <div className="cockpit-panel overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-cockpit-500" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-600" />
              <p className="font-medium text-slate-600 dark:text-slate-300">{t.noPayoutsYet}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{t.createFirstPayout}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {payouts.map((p) => {
                const ch = p.sales_channels;
                const isExpanded = expandedId === p.id;
                const isDeleting = deleteConfirm === p.id;

                return (
                  <div key={p.id}>
                    <div
                      className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {ch?.logo_url ? (
                          <img src={ch.logo_url} alt={ch.name} className="h-9 w-9 object-contain" />
                        ) : (
                          <span className="text-2xl">{ch?.icon}</span>
                        )}
                      </div>

                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{ch?.name}</span>
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {new Date(p.period_start).toLocaleDateString()} — {new Date(p.period_end).toLocaleDateString()}
                          </span>
                          <StatusPill status={p.reconciliationStatus} />
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {t.payoutDate}: {new Date(p.payout_date).toLocaleDateString()}
                          {p.notes ? ` | ${p.notes}` : ''}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-6">
                        <div className="text-right">
                          <div className="font-mono text-sm font-semibold tabular-nums text-cockpit-600 dark:text-cockpit-400">
                            ₼{Number(p.payout_amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t.payoutReceived}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-sm font-semibold tabular-nums ${p.payoutDifference < 0 ? 'text-red-600 dark:text-red-400' : p.payoutDifference > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {p.payoutDifference > 0 ? '+' : ''}₼{p.payoutDifference.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            expected vs actual
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="cockpit-inset px-5 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
                          <DetailCell label="Expected" value={`₼${p.grossSales.toFixed(2)}`} />
                          <DetailCell label="Actual" value={`₼${Number(p.payout_amount).toFixed(2)}`} valueClass="text-cockpit-600 dark:text-cockpit-400" />
                          <DetailCell
                            label="Difference"
                            value={`${p.payoutDifference > 0 ? '+' : ''}₼${p.payoutDifference.toFixed(2)}`}
                            valueClass={p.payoutDifference < 0 ? 'text-red-600 dark:text-red-400' : p.payoutDifference > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
                          />
                          <DetailCell label={t.commissionRate} value={`${p.commissionPercent.toFixed(1)}%`} valueClass={p.commissionPercent > 0 ? 'text-amber-600 dark:text-amber-400' : ''} />
                        </div>

                        {isDeleting ? (
                          <DangerConfirmRow
                            className="mt-2"
                            message={t.deletePayoutConfirm}
                            confirmLabel={t.delete}
                            cancelLabel={t.cancel}
                            onConfirm={() => handleDelete(p.id)}
                            onCancel={() => setDeleteConfirm(null)}
                          />
                        ) : (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5">
                              <IconActionButton
                                onClick={() => handleEdit(p)}
                                icon={<Edit2 className="h-4 w-4" />}
                                tone="edit"
                                label={t.edit}
                              />
                              <span className="text-sm font-medium text-cockpit-700 dark:text-cockpit-400">{t.edit}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5">
                              <IconActionButton
                                onClick={() => setDeleteConfirm(p.id)}
                                icon={<Trash2 className="h-4 w-4" />}
                                tone="danger"
                                label={t.delete}
                              />
                              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{t.delete}</span>
                            </span>
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
    <div className="cockpit-panel p-4">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`font-mono text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function DetailCell({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white ${valueClass}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: ReconciliationStatus }) {
  const statusLabel: Record<ReconciliationStatus, string> = {
    matched: 'Matched',
    underpaid: 'Underpaid',
    overpaid: 'Overpaid',
    pending: 'Pending',
  };

  const statusClass: Record<ReconciliationStatus, string> = {
    matched: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    underpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    overpaid: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
