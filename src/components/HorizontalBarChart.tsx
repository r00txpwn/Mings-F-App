import { useLanguage } from '../contexts/LanguageContext';

export interface HorizontalBarItem {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
}

export type HorizontalBarValueFormat = 'currency' | 'integer';

interface HorizontalBarChartProps {
  items: HorizontalBarItem[];
  valueFormat?: HorizontalBarValueFormat;
  maxItems?: number;
}

function formatValue(value: number, format: HorizontalBarValueFormat): string {
  if (format === 'integer') return Math.round(value).toString();
  return `₼${value.toFixed(2)}`;
}

const DEFAULT_COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78716c', '#64748b'];

export function HorizontalBarChart({
  items,
  valueFormat = 'currency',
  maxItems = 8,
}: HorizontalBarChartProps) {
  const { t } = useLanguage();
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, maxItems);
  const maxValue = Math.max(...sorted.map((i) => i.value), 1);

  if (sorted.length === 0 || sorted.every((i) => i.value === 0)) {
    return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.noDataForPeriod}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {sorted.map((item, index) => {
        const widthPct = Math.max(4, (item.value / maxValue) * 100);
        const color = item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        return (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
              <span className="shrink-0 font-mono tabular-nums text-slate-900 dark:text-white">
                {formatValue(item.value, valueFormat)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>
            {item.subtitle ? <p className="mt-0.5 text-[10px] text-slate-500">{item.subtitle}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
