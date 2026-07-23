import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ChartCard,
  InsightPanel,
  KpiCard,
} from '../components/analytics';
import { ListPagerFooter } from '../components/ListPagerFooter';
import { PageHeader } from '../components/cockpit';
import { usePagedQuery } from '../hooks/usePagedQuery';
import {
  computeDelta,
  computeExecutiveKpis,
  fetchPeriodSummary,
  fetchRevenueCostTrend,
} from '../services/analytics';
import type { ExecutiveKpis, RevenueCostTrendPoint } from '../types/analytics';

interface OperationalExpense {
  id: string;
  master_category_id: string | null;
  expense_item_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  master_categories?: { name: string; color: string };
  expense_items?: { name: string };
}

interface SaleRecord {
  id: string;
  total_price: number;
  quantity: number;
  sales_channel_id: string | null;
  notes: string;
  sale_date: string;
  sales_channels?: {
    name: string;
    icon: string;
    color: string;
    logo_url?: string | null;
  };
}

interface Purchase {
  id: string;
  product_id: string | null;
  supplier_id: string | null;
  master_category_id: string | null;
  quantity: number;
  total_cost: number;
  purchase_date: string;
  payment_status: string;
  products?: { name: string; unit?: string };
  suppliers?: { name: string };
  master_categories?: { name: string; color?: string };
}

function mtdRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { startDate, endDate };
}

function last14DayRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 13);
  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
  return { startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) };
}

const emptyKpis = (): ExecutiveKpis =>
  computeExecutiveKpis({
    grossSales: 0,
    cogs: 0,
    opex: 0,
    orderCount: 0,
  });

export function MoneyScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'purchases'>('sales');
  const [trend, setTrend] = useState<RevenueCostTrendPoint[]>([]);
  const [kpis, setKpis] = useState<ExecutiveKpis>(emptyKpis);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const salesPager = usePagedQuery<SaleRecord>({
    buildQuery: () =>
      supabase
        .from('sales')
        .select('*, sales_channels(name, icon, color, logo_url)')
        .order('sale_date', { ascending: false }),
  });

  const expensesPager = usePagedQuery<OperationalExpense>({
    buildQuery: () =>
      supabase
        .from('operational_expenses')
        .select('*, master_categories(name, color), expense_items(name)')
        .order('expense_date', { ascending: false }),
  });

  const purchasesPager = usePagedQuery<Purchase>({
    buildQuery: () =>
      supabase
        .from('purchases')
        .select('*, products(name, unit), suppliers(name), master_categories(name, color)')
        .order('purchase_date', { ascending: false }),
  });

  const sales = salesPager.rows;
  const expenses = expensesPager.rows;
  const purchases = purchasesPager.rows;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setKpiLoading(true);
      setKpiError(null);
      const mtd = mtdRange();
      const trendRange = last14DayRange();
      const [summaryRes, trendRes] = await Promise.all([
        fetchPeriodSummary({ startDate: mtd.startDate, endDate: mtd.endDate }),
        fetchRevenueCostTrend({
          startDate: trendRange.startDate,
          endDate: trendRange.endDate,
          granularity: 'day',
        }),
      ]);
      if (cancelled) return;
      if (summaryRes.error) setKpiError(summaryRes.error);
      if (trendRes.error) setKpiError(trendRes.error);
      if (summaryRes.data) {
        setKpis(
          computeExecutiveKpis({
            grossSales: summaryRes.data.grossSales,
            discounts: summaryRes.data.discounts,
            refunds: summaryRes.data.refunds,
            cogs: summaryRes.data.cogs,
            opex: summaryRes.data.opex,
            bankFees: summaryRes.data.bankFees ?? 0,
            payroll: summaryRes.data.payroll ?? 0,
            platformCommissions: summaryRes.data.platformCommissions ?? 0,
            orderCount: summaryRes.data.orderCount,
          }),
        );
      }
      if (trendRes.data) setTrend(trendRes.data);
      setKpiLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listError = salesPager.error || expensesPager.error || purchasesPager.error;
  const error = kpiError || listError;
  const loading = kpiLoading || salesPager.loading || expensesPager.loading || purchasesPager.loading;

  const activePager =
    activeTab === 'sales' ? salesPager : activeTab === 'expenses' ? expensesPager : purchasesPager;

  const trendDelta = useMemo(() => {
    if (trend.length === 0) {
      return null;
    }

    const sorted = [...trend].sort((a, b) => a.bucket.localeCompare(b.bucket));
    const recent = sorted.slice(-7);
    const previous = sorted.slice(-14, -7);
    const currentNet = recent.reduce((sum, point) => sum + point.net, 0);
    const previousNet = previous.reduce((sum, point) => sum + point.net, 0);
    return computeDelta(currentNet, previousNet);
  }, [trend]);

  const netTrend = trendDelta?.direction === 'flat' ? 'neutral' : trendDelta?.direction;
  const pctChange = trendDelta?.pctChange;
  const netDeltaLabel =
    pctChange == null ? undefined : `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%`;
  const topTrendBuckets = [...trend].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="animate-fadeIn">
      <PageHeader eyebrow={t.money} title={t.money} description={t.trackMoney} />

      {error && <div className="cockpit-alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t.totalSales} value={`₼${kpis.grossSales.toFixed(2)}`} loading={kpiLoading} />
        <KpiCard label={t.cogs} value={`₼${kpis.cogs.toFixed(2)}`} loading={kpiLoading} />
        <KpiCard label={t.operationalExpenses} value={`₼${kpis.opex.toFixed(2)}`} loading={kpiLoading} />
        <KpiCard
          label={t.netProfit}
          value={`₼${kpis.operatingProfit.toFixed(2)}`}
          delta={netDeltaLabel}
          trend={netTrend}
          loading={kpiLoading}
          subtitle={t.sevenDayVsPriorSevenDay}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title={t.revenueMomentumLast14Days} loading={kpiLoading}>
          {topTrendBuckets.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTrendData}</p>
          ) : (
            <div className="space-y-2">
              {topTrendBuckets.map((point) => {
                const maxRevenue = topTrendBuckets[0]?.revenue || 1;
                const width = Math.max(8, (point.revenue / maxRevenue) * 100);
                return (
                  <div key={point.bucket}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>{point.bucket}</span>
                      <span>₼{point.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-cockpit-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
        <InsightPanel
          title={kpis.operatingProfit >= 0 ? t.profitabilitySignal : t.profitabilityWarning}
          severity={kpis.operatingProfit >= 0 ? 'success' : 'warning'}
        >
          {kpis.operatingProfit >= 0
            ? t.operatingProfitPositiveMessage
                .replace('{profit}', `₼${kpis.operatingProfit.toFixed(2)}`)
                .replace('{aov}', `₼${kpis.avgOrderValue.toFixed(2)}`)
            : t.operatingProfitNegativeMessage.replace(
                '{profit}',
                `₼${kpis.operatingProfit.toFixed(2)}`,
              )}
        </InsightPanel>
      </div>

      <div className="mb-6">
        <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`cockpit-tab ${activeTab === 'sales' ? 'cockpit-tab-active' : ''}`}
          >
            {t.salesIncome}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`cockpit-tab ${activeTab === 'purchases' ? 'cockpit-tab-active' : ''}`}
          >
            {t.cogs} ({t.purchases})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`cockpit-tab ${activeTab === 'expenses' ? 'cockpit-tab-active' : ''}`}
          >
            {t.operationalExpenses}
          </button>
        </div>
      </div>

      <div className="cockpit-table-wrap overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cockpit-500" />
          </div>
        ) : (
          <>
            {activeTab === 'sales' &&
              (sales.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.noSalesRecorded}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="cockpit-thead">
                      <tr>
                        <th className="cockpit-th">{t.date}</th>
                        <th className="cockpit-th">{t.channelName}</th>
                        <th className="cockpit-th">{t.orders}</th>
                        <th className="cockpit-th">{t.amount}</th>
                        <th className="cockpit-th">{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id} className="cockpit-tr">
                          <td className="cockpit-td font-mono text-slate-600 dark:text-slate-300">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </td>
                          <td className="cockpit-td font-medium text-slate-900 dark:text-white">
                            {sale.sales_channels ? (
                              <span className="flex items-center gap-2">
                                {sale.sales_channels.logo_url ? (
                                  <img
                                    src={sale.sales_channels.logo_url}
                                    alt={sale.sales_channels.name}
                                    className="w-5 h-5 object-contain"
                                  />
                                ) : (
                                  <span>{sale.sales_channels.icon}</span>
                                )}
                                <span style={{ color: sale.sales_channels.color }}>
                                  {sale.sales_channels.name}
                                </span>
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="cockpit-td font-mono tabular-nums">{sale.quantity || 0}</td>
                          <td className="cockpit-td font-mono font-semibold tabular-nums text-cockpit-600 dark:text-cockpit-400">
                            ₼{Number(sale.total_price).toFixed(2)}
                          </td>
                          <td className="cockpit-td text-slate-600 dark:text-slate-400">
                            {sale.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === 'expenses' &&
              (expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.noExpensesYet}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="cockpit-thead">
                      <tr>
                        <th className="cockpit-th">{t.date}</th>
                        <th className="cockpit-th">{t.masterCategory}</th>
                        <th className="cockpit-th">{t.expenseItem}</th>
                        <th className="cockpit-th">{t.amount}</th>
                        <th className="cockpit-th">{t.payment}</th>
                        <th className="cockpit-th">{t.description}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="cockpit-tr">
                          <td className="cockpit-td font-mono text-slate-600 dark:text-slate-300">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </td>
                          <td className="cockpit-td">
                            {expense.master_categories?.name ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: expense.master_categories.color }}
                                />
                                <span className="text-sm text-slate-900 dark:text-white">
                                  {expense.master_categories.name}
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="cockpit-td text-slate-700 dark:text-slate-300">
                            {expense.expense_items?.name || '-'}
                          </td>
                          <td className="cockpit-td font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                            ₼{Number(expense.amount).toFixed(2)}
                          </td>
                          <td className="cockpit-td text-slate-600 dark:text-slate-400">
                            {expense.payment_method || '-'}
                          </td>
                          <td className="cockpit-td text-slate-600 dark:text-slate-400">
                            {expense.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {activeTab === 'purchases' &&
              (purchases.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {t.noPurchasesRecorded}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="cockpit-thead">
                      <tr>
                        <th className="cockpit-th">{t.date}</th>
                        <th className="cockpit-th">{t.category}</th>
                        <th className="cockpit-th">{t.product}</th>
                        <th className="cockpit-th">{t.supplier}</th>
                        <th className="cockpit-th">{t.quantity}</th>
                        <th className="cockpit-th">{t.totalCost}</th>
                        <th className="cockpit-th">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="cockpit-tr">
                          <td className="cockpit-td font-mono text-slate-600 dark:text-slate-300">
                            {new Date(purchase.purchase_date).toLocaleDateString()}
                          </td>
                          <td className="cockpit-td">
                            {purchase.master_categories?.name ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: purchase.master_categories.color || '#6B7280',
                                  }}
                                />
                                <span className="text-sm text-slate-900 dark:text-white">
                                  {purchase.master_categories.name}
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="cockpit-td font-medium text-slate-900 dark:text-white">
                            {purchase.products?.name || 'N/A'}
                          </td>
                          <td className="cockpit-td text-slate-600 dark:text-slate-300">
                            {purchase.suppliers?.name || '-'}
                          </td>
                          <td className="cockpit-td font-mono tabular-nums">
                            {purchase.quantity} {purchase.products?.unit || 'pcs'}
                          </td>
                          <td className="cockpit-td font-mono font-semibold tabular-nums text-cockpit-600 dark:text-cockpit-400">
                            ₼{Number(purchase.total_cost).toFixed(2)}
                          </td>
                          <td className="cockpit-td">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                purchase.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : purchase.payment_status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {purchase.payment_status === 'paid'
                                ? t.paid
                                : purchase.payment_status === 'partial'
                                  ? t.partial
                                  : t.pending}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {!loading &&
            ((activeTab === 'sales' && sales.length > 0) ||
              (activeTab === 'expenses' && expenses.length > 0) ||
              (activeTab === 'purchases' && purchases.length > 0)) ? (
              <ListPagerFooter
                hasMore={activePager.hasMore}
                loadingMore={activePager.loadingMore}
                onLoadMore={activePager.loadMore}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
