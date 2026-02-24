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
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          ₼{totalAmount.toFixed(2)}
        </span>
      </div>

      {categories.length > 0 && (
        <>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex mb-3">
            {categories.map((cat) => {
              const width = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
              if (width < 0.5) return null;
              return (
                <div
                  key={cat.id}
                  className="h-full transition-all duration-300"
                  style={{ width: `${width}%`, backgroundColor: cat.color }}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate max-w-[120px]">{cat.name}</span>
                <span className="text-gray-500 dark:text-gray-400">₼{cat.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
