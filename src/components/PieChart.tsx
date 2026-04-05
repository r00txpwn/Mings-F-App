import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data],
  );

  if (total === 0 || sortedData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
        style={{ width: size, height: size }}
      >
        <span className="px-2 text-center text-xs text-gray-400 dark:text-gray-500">{t.noDataForPeriod}</span>
      </div>
    );
  }

  const slices = sortedData.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    return { ...item, percentage };
  });
  const safeActiveIndex = Math.min(activeIndex, Math.max(slices.length - 1, 0));
  const activeSlice = slices[safeActiveIndex];

  const chartSize = 120;
  const center = 60;
  const radius = 42;
  const stroke = 18;
  const gapSize = 1.5;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const ringSlices = slices.map((slice) => {
    const rawLength = (slice.percentage / 100) * circumference;
    const visibleLength = Math.max(0, rawLength - gapSize);
    const dashArray = `${visibleLength} ${Math.max(circumference - visibleLength, 0)}`;
    const dashOffset = -currentOffset;
    currentOffset += rawLength;
    return { ...slice, dashArray, dashOffset };
  });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          className="drop-shadow-[0_8px_24px_rgba(37,99,235,0.18)]"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200/80 dark:text-slate-700/60"
          />
          {ringSlices.map((slice, index) => {
            const isActive = index === safeActiveIndex;
            return (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isActive ? stroke + 1.5 : stroke}
                strokeLinecap="round"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                className="cursor-pointer transition-all duration-300"
                style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(59,130,246,0.45))' : 'none' }}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {t.topCategory}
          </span>
          <span className="mt-0.5 max-w-[85%] truncate text-xs font-semibold leading-tight text-slate-900 dark:text-white">
            {activeSlice.label}
          </span>
          <span className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            ₼{activeSlice.value.toFixed(2)}
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {activeSlice.percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {slices.map((slice, index) => {
          const isActive = index === safeActiveIndex;
          return (
            <button
              key={slice.label}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                isActive
                  ? 'border-violet-400/50 bg-violet-500/10 shadow-sm dark:border-violet-500/35'
                  : 'border-transparent hover:border-slate-200/80 hover:bg-slate-100/70 dark:hover:border-violet-500/20 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-800 dark:text-slate-200">{slice.label}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
                ₼{slice.value.toFixed(2)}
              </span>
              <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-slate-900 dark:text-white">
                {slice.percentage.toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
