import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ExpenseBreakdownData, PayoutReconciliationSummary } from '../../types/analytics';
import { useLanguage } from '../../contexts/LanguageContext';
import { PieChart } from '../PieChart';
import { ChartCard } from '../analytics/ChartCard';
import { Button } from '../ui/Button';
import { navigateCockpitScreen } from '../cockpit';

interface HomeDetailsSectionProps {
  expenseBreakdown: ExpenseBreakdownData | null;
  payoutReconciliation: PayoutReconciliationSummary | null;
}

export function HomeDetailsSection({ expenseBreakdown, payoutReconciliation }: HomeDetailsSectionProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const topExpenseCategories = (() => {
    const map = new Map<string, { amount: number; color: string }>();
    for (const item of expenseBreakdown?.items ?? []) {
      const key = item.categoryName;
      const entry = map.get(key) ?? { amount: 0, color: item.categoryColor };
      entry.amount += item.total;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value: value.amount, color: value.color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <span>{open ? t.collapseDetails : t.expandDetails}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard compact title={t.expenseComposition}>
            <div className="flex justify-center">
              <PieChart data={topExpenseCategories} size={190} />
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => navigateCockpitScreen('reports')}>
                {t.viewFullReport}
              </Button>
            </div>
          </ChartCard>

          <ChartCard compact title={t.payoutSummaryCard}>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-xs text-slate-500">{t.periodRevenue}</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                  ₼{(payoutReconciliation?.totalExpected ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-xs text-slate-500">{t.payoutReceived}</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                  ₼{(payoutReconciliation?.totalActual ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-xs text-slate-500">{t.impliedCommission}</p>
                <p className="text-sm font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  ₼
                  {Math.max(
                    0,
                    (payoutReconciliation?.totalExpected ?? 0) - (payoutReconciliation?.totalActual ?? 0),
                  ).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t.payoutPeriodsInRange.replace('{count}', String(payoutReconciliation?.items?.length ?? 0))}
            </p>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => navigateCockpitScreen('payouts')}>
                {t.viewPayouts}
              </Button>
            </div>
          </ChartCard>
        </div>
      ) : null}
    </section>
  );
}
