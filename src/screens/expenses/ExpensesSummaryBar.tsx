import { useMemo, useState } from 'react';
import { TrendingDown } from 'lucide-react';

interface CategorySummary {
  id: string;
  name: string;
  color: string;
  total: number;
}

interface ExpensesSummaryBarProps {
  categories: CategorySummary[];
  totalAmount: number;
  label: string;
}

export function ExpensesSummaryBar({ categories, totalAmount, label }: ExpensesSummaryBarProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => b.total - a.total),
    [categories],
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const safeActiveId = activeId && sortedCategories.some((cat) => cat.id === activeId)
    ? activeId
    : sortedCategories[0]?.id ?? null;
  const activeCategory = sortedCategories.find((cat) => cat.id === safeActiveId) ?? null;
  const activeShare = activeCategory && totalAmount > 0
    ? (activeCategory.total / totalAmount) * 100
    : 0;

  return (
    <div className="cockpit-panel-solid mb-6 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        </div>
        <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
          ₼{totalAmount.toFixed(2)}
        </span>
      </div>

      {sortedCategories.length > 0 && (
        <>
          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
            {sortedCategories.map((cat) => {
              const width = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
              return width < 0.5 ? null : (
                <div
                  key={cat.id}
                  className="h-full transition-all duration-500"
                  style={{ width: `${width}%`, backgroundColor: cat.color }}
                />
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-1.5">
              {sortedCategories.slice(0, 6).map((cat) => {
                const share = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                const isActive = safeActiveId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setActiveId(cat.id)}
                    onFocus={() => setActiveId(cat.id)}
                    onClick={() => setActiveId(cat.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-violet-400/45 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-violet-500/20 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                      </div>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${share}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <div className="ml-3 flex items-baseline gap-3">
                      <span className="font-mono text-sm tabular-nums text-slate-600 dark:text-slate-400">
                        ₼{cat.total.toFixed(2)}
                      </span>
                      <span className="min-w-[3.2rem] text-right text-sm font-semibold text-slate-900 dark:text-white">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })}
              {sortedCategories.length > 6 && (
                <div className="px-1 text-xs text-slate-500 dark:text-slate-400">
                  +{sortedCategories.length - 6} more categories
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-violet-500/20 dark:bg-slate-900/60">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Focus category
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {activeCategory?.name ?? '—'}
              </div>
              <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                ₼{activeCategory?.total.toFixed(2) ?? '0.00'}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {activeShare.toFixed(1)}% of total
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${activeShare}%`,
                    backgroundColor: activeCategory?.color ?? '#64748B',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
