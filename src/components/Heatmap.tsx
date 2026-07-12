import { useLanguage } from '../contexts/LanguageContext';

/** weekday: 0 = Monday … 6 = Sunday */
export interface HeatmapCell {
  weekday: number;
  hour: number;
  value: number;
}

interface HeatmapProps {
  cells: HeatmapCell[];
  weekdayLabels: string[];
  valueLabel?: string;
}

export function Heatmap({ cells, weekdayLabels, valueLabel }: HeatmapProps) {
  const { t } = useLanguage();
  const maxValue = Math.max(...cells.map((c) => c.value), 1);
  const hasData = cells.some((c) => c.value > 0);

  if (!hasData) {
    return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.noDataForPeriod}</p>;
  }

  const getValue = (weekday: number, hour: number) =>
    cells.find((c) => c.weekday === weekday && c.hour === hour)?.value ?? 0;

  const intensity = (value: number) => {
    if (value <= 0) return 0.08;
    const ratio = value / maxValue;
    return 0.15 + ratio * 0.85;
  };

  const displayHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="mb-2 grid grid-cols-[48px_repeat(13,minmax(0,1fr))] gap-0.5 text-[9px] text-slate-500">
          <div />
          {displayHours.map((h) => (
            <div key={h} className="text-center font-mono tabular-nums">
              {String(h).padStart(2, '0')}
            </div>
          ))}
        </div>
        {weekdayLabels.map((dayLabel, weekday) => (
          <div
            key={dayLabel}
            className="mb-0.5 grid grid-cols-[48px_repeat(13,minmax(0,1fr))] gap-0.5 items-center"
          >
            <div className="truncate pr-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">
              {dayLabel}
            </div>
            {displayHours.map((hour) => {
              const value = getValue(weekday, hour);
              const alpha = intensity(value);
              return (
                <div
                  key={hour}
                  title={`${dayLabel} ${String(hour).padStart(2, '0')}:00 — ${value} ${valueLabel ?? ''}`}
                  className="aspect-square min-h-[14px] rounded-sm border border-slate-200/50 dark:border-slate-700/50"
                  style={{ backgroundColor: `rgba(217, 119, 6, ${alpha})` }}
                />
              );
            })}
          </div>
        ))}
        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">{t.dashboardHeatmapHint}</p>
      </div>
    </div>
  );
}
