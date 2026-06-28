import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  ChevronRight,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, type OnlinePayment, type Sale } from '../lib/supabase';
import { recheckPayment } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { DateRangePicker } from '../components/DateRangePicker';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';

type PaymentStatusFilter = 'all' | 'pending' | 'success' | 'failed';
type ProviderFilter = 'all' | 'epoint' | 'united_payment';

type PaymentRow = OnlinePayment & {
  sale?: Pick<
    Sale,
    'id' | 'display_number' | 'customer_name' | 'customer_phone' | 'payment_status' | 'total_price'
  > | null;
};

const PAYMENT_STATUS_FILTERS: PaymentStatusFilter[] = ['all', 'pending', 'success', 'failed'];

function fmtTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function fmtDateTime(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function normalizeStatus(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isPaymentPaidStatus(status: string | null | undefined): boolean {
  const s = normalizeStatus(status);
  return s === 'success' || s === 'paid' || s === 'completed';
}

function isPaymentFailedStatus(status: string | null | undefined): boolean {
  return normalizeStatus(status) === 'failed';
}

function isPaymentSaleMismatch(
  paymentStatus: string | null | undefined,
  salePaymentStatus: string | null | undefined
): boolean {
  const paymentPaid = isPaymentPaidStatus(paymentStatus);
  const salePaid = isPaymentPaidStatus(salePaymentStatus);
  const paymentFailed = isPaymentFailedStatus(paymentStatus);
  const saleFailed = isPaymentFailedStatus(salePaymentStatus);
  if (paymentPaid && !salePaid) return true;
  if (paymentFailed && salePaid) return true;
  if (normalizeStatus(paymentStatus) === 'pending' && salePaid) return true;
  if (paymentPaid && saleFailed) return true;
  return false;
}

function paymentStatusBadgeClass(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  if (s === 'success' || s === 'paid' || s === 'completed') {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (s === 'failed') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

function providerLabel(
  t: ReturnType<typeof useLanguage>['t'],
  provider: string | null | undefined
): string {
  const p = normalizeStatus(provider);
  if (p === 'epoint') return t.paymentsProviderEpoint;
  if (p === 'united_payment' || p === 'upay' || p === 'unitedpayment') return t.paymentsProviderUnited;
  return provider ?? t.paymentsProviderOther;
}

function paymentStatusLabel(
  t: ReturnType<typeof useLanguage>['t'],
  status: string | null | undefined
): string {
  const s = normalizeStatus(status);
  if (s === 'success' || s === 'paid' || s === 'completed') return t.paymentsStatusSuccess;
  if (s === 'failed') return t.paymentsStatusFailed;
  return t.paymentsStatusPending;
}

type PaymentDrawerProps = {
  row: PaymentRow;
  onClose: () => void;
  onRechecked: () => Promise<void>;
};

function PaymentDetailDrawer({ row, onClose, onRechecked }: PaymentDrawerProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const mismatch = isPaymentSaleMismatch(row.status, row.sale?.payment_status ?? null);

  const runRecheck = async () => {
    setBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const result = await recheckPayment(row.id);
      if (!result.ok) {
        const code = result.code ?? '';
        if (code === 'FORBIDDEN' || result.error?.toLowerCase().includes('insufficient')) {
          setActionError(t.paymentsRecheckForbidden);
        } else {
          setActionError(`${t.paymentsRecheckFailed}: ${result.error ?? 'unknown'}`);
        }
        return;
      }
      setActionSuccess(t.paymentsRecheckSuccess);
      await onRechecked();
    } catch (e) {
      setActionError(`${t.paymentsRecheckFailed}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const rawJson = row.raw_payload ? JSON.stringify(row.raw_payload, null, 2) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="payments-drawer">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
        aria-hidden
      />
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-lg font-bold text-white">
              #{row.sale?.display_number ?? '—'}
            </p>
            <p className="text-xs text-slate-500">{fmtDateTime(row.created_at)}</p>
            {mismatch ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                <AlertTriangle className="h-3 w-3" />
                {t.paymentsMismatchYes}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            disabled={busy}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-50"
            aria-label={t.cancel}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {actionError ? (
              <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {actionError}
              </div>
            ) : null}
            {actionSuccess ? (
              <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {actionSuccess}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label={t.paymentsDetailProvider} value={providerLabel(t, row.provider)} />
              <DetailField
                label={t.paymentsColPaymentStatus}
                value={paymentStatusLabel(t, row.status)}
              />
              <DetailField
                label={t.paymentsColSaleStatus}
                value={paymentStatusLabel(t, row.sale?.payment_status ?? null)}
              />
              <DetailField
                label={t.paymentsColAmount}
                value={`₼${Number(row.amount ?? row.sale?.total_price ?? 0).toFixed(2)}${row.currency ? ` (${row.currency})` : ''}`}
              />
              <DetailField label={t.paymentsDetailClientOrderId} value={row.external_id ?? '—'} />
              <DetailField label={t.paymentsDetailTransactionId} value={row.epoint_transaction ?? '—'} />
              <DetailField label={t.paymentsDetailProviderStatus} value={row.epoint_status ?? '—'} />
              <DetailField label={t.paymentsDetailPaidAt} value={fmtDateTime(row.paid_at)} />
            </div>

            {row.sale?.customer_name || row.sale?.customer_phone ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {t.paymentsColCustomer}
                </p>
                <p className="mt-1">{row.sale?.customer_name ?? '—'}</p>
                {row.sale?.customer_phone ? (
                  <p className="mt-1 text-xs text-slate-400">{row.sale.customer_phone}</p>
                ) : null}
              </div>
            ) : null}

            {row.error_message ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-300">
                  {t.paymentsDetailError}
                </p>
                <p className="mt-1 text-xs text-rose-100">{row.error_message}</p>
              </div>
            ) : null}

            {rawJson ? (
              <details className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {t.paymentsDetailRawPayload}
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto text-[11px] leading-relaxed text-slate-300">
                  {rawJson}
                </pre>
              </details>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-slate-950/80 p-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runRecheck()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cockpit-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cockpit-500 disabled:opacity-50"
              data-testid="payments-recheck-button"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.paymentsRechecking}
                </>
              ) : (
                t.paymentsRecheckButton
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm text-slate-100">{value}</p>
    </div>
  );
}

export function PaymentsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  });

  const loadPayments = useCallback(async (): Promise<PaymentRow[]> => {
    setLoading(true);
    const { data: payments, error } = await supabase
      .from('online_payments')
      .select(
        'id, sale_id, provider, status, amount, currency, external_id, epoint_transaction, epoint_status, raw_payload, paid_at, error_message, created_at, updated_at'
      )
      .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
      .lte('created_at', `${dateRange.end}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    if (error || !payments?.length) {
      setRows([]);
      setLoading(false);
      return [];
    }

    const saleIds = [...new Set(payments.map((p) => p.sale_id as string))];
    const { data: sales } = await supabase
      .from('sales')
      .select('id, display_number, customer_name, customer_phone, payment_status, total_price')
      .in('id', saleIds);

    const saleMap = new Map((sales ?? []).map((s) => [s.id as string, s]));
    const merged: PaymentRow[] = payments.map((p) => ({
      ...(p as OnlinePayment),
      sale: (saleMap.get(p.sale_id as string) as PaymentRow['sale']) ?? null,
    }));

    setRows(merged);
    setLoading(false);
    return merged;
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    void loadPayments();
    const channel = supabase.channel('admin-payments');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'online_payments' },
      () => void loadPayments()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPayments]);

  const refreshSelected = useCallback(async () => {
    const id = selected?.id;
    if (!id) return;
    const list = await loadPayments();
    const next = list.find((r) => r.id === id) ?? null;
    setSelected(next);
  }, [loadPayments, selected?.id]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all') {
        const s = normalizeStatus(row.status);
        if (statusFilter === 'pending' && s !== 'pending' && s !== '') return false;
        if (statusFilter === 'success' && !isPaymentPaidStatus(row.status)) return false;
        if (statusFilter === 'failed' && !isPaymentFailedStatus(row.status)) return false;
      }

      if (providerFilter !== 'all') {
        const p = normalizeStatus(row.provider);
        if (providerFilter === 'epoint' && p !== 'epoint') return false;
        if (
          providerFilter === 'united_payment' &&
          p !== 'united_payment' &&
          p !== 'upay' &&
          p !== 'unitedpayment'
        ) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const orderNum = String(row.sale?.display_number ?? '').toLowerCase();
        const phone = String(row.sale?.customer_phone ?? '').toLowerCase();
        const name = String(row.sale?.customer_name ?? '').toLowerCase();
        const ext = String(row.external_id ?? '').toLowerCase();
        const tx = String(row.epoint_transaction ?? '').toLowerCase();
        if (!orderNum.includes(q) && !phone.includes(q) && !name.includes(q) && !ext.includes(q) && !tx.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [rows, statusFilter, providerFilter, search]);

  const hasActiveFilters =
    statusFilter !== 'all' || providerFilter !== 'all' || search.trim().length > 0;

  const resetFilters = () => {
    setStatusFilter('all');
    setProviderFilter('all');
    setSearch('');
  };

  const statusFilterLabel = (f: PaymentStatusFilter): string => {
    switch (f) {
      case 'all':
        return t.paymentsFilterAll;
      case 'pending':
        return t.paymentsFilterPending;
      case 'success':
        return t.paymentsFilterSuccess;
      case 'failed':
        return t.paymentsFilterFailed;
    }
  };

  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        eyebrow={t.operations}
        title={t.paymentsScreenTitle}
        description={t.paymentsScreenDescription}
        icon={CreditCard}
        actions={
          <button
            type="button"
            onClick={() => void loadPayments()}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cockpit-400"
            aria-label={t.paymentsFound}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {PAYMENT_STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f ? 'bg-cockpit-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {statusFilterLabel(f)}
            </button>
          ))}
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}
          className="cockpit-select h-11 min-w-[180px]"
        >
          <option value="all">{t.paymentsProviderAll}</option>
          <option value="epoint">{t.paymentsProviderEpoint}</option>
          <option value="united_payment">{t.paymentsProviderUnited}</option>
        </select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.paymentsSearch}
            className="w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
          />
        </div>

        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onStartChange={(start) => setDateRange((prev) => ({ ...prev, start }))}
          onEndChange={(end) => setDateRange((prev) => ({ ...prev, end }))}
          startLabel={t.startDate}
          endLabel={t.endDate}
        />

        {hasActiveFilters ? (
          <button type="button" onClick={resetFilters} className="cockpit-btn-ghost text-xs">
            {t.cockpitResetFilters}
          </button>
        ) : null}
      </div>

      <p className="text-sm text-slate-500">
        {filteredRows.length} {t.paymentsFound}
      </p>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t.paymentsNoRows}
          description={t.cockpitEmptyFilteredHint}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <div className="grid min-w-[900px] grid-cols-[auto_1fr_1fr_auto_auto_auto_auto_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>{t.paymentsColTime}</span>
            <span>{t.paymentsColOrder}</span>
            <span>{t.paymentsColCustomer}</span>
            <span>{t.paymentsColAmount}</span>
            <span>{t.paymentsColProvider}</span>
            <span>{t.paymentsColPaymentStatus}</span>
            <span>{t.paymentsColSaleStatus}</span>
            <span>{t.paymentsColMismatch}</span>
            <span />
          </div>

          <div className="divide-y divide-white/5">
            {filteredRows.map((row) => {
              const mismatch = isPaymentSaleMismatch(row.status, row.sale?.payment_status ?? null);
              return (
                <button
                  key={row.id}
                  type="button"
                  data-payment-row
                  data-payment-id={row.id}
                  onClick={() => setSelected(row)}
                  className="grid w-full min-w-[900px] grid-cols-[auto_1fr_1fr_auto_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                >
                  <span className="text-xs text-slate-400">{fmtTime(row.created_at)}</span>
                  <span className="font-mono text-xs font-bold text-white">
                    #{row.sale?.display_number ?? '—'}
                  </span>
                  <span className="truncate text-xs text-slate-300">
                    {row.sale?.customer_name || row.sale?.customer_phone || '—'}
                  </span>
                  <span className="font-mono text-xs font-semibold text-white">
                    ₼{Number(row.amount ?? row.sale?.total_price ?? 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">{providerLabel(t, row.provider)}</span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${paymentStatusBadgeClass(row.status)}`}
                  >
                    {paymentStatusLabel(t, row.status)}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${paymentStatusBadgeClass(row.sale?.payment_status)}`}
                  >
                    {paymentStatusLabel(t, row.sale?.payment_status ?? null)}
                  </span>
                  <span className="text-xs">
                    {mismatch ? (
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t.paymentsMismatchYes}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected ? (
        <PaymentDetailDrawer
          row={selected}
          onClose={() => setSelected(null)}
          onRechecked={refreshSelected}
        />
      ) : null}
    </div>
  );
}
