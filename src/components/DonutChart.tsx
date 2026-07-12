import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface DonutChartSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartSlice[];
  size?: number;
  centerLabel?: string;
}

export function DonutChart({ data, size = 180, centerLabel }: DonutChartProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sorted = useMemo(() => [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value), [data]);

  if (total <= 0 || sorted.length === 0) {
    return (
      <div
        className="mx-auto flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        style={{ width: size, height: size }}
      >
        <span className="px-2 text-center text-xs text-slate-500">{t.noDataForPeriod}</span>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, sorted.length - 1);
  const active = sorted[safeIndex];
  const chartSize = 120;
  const center = 60;
  const radius = 42;
  const stroke = 16;
  const gap = 1.5;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const rings = sorted.map((slice) => {
    const pct = slice.value / total;
    const raw = pct * circumference;
    const visible = Math.max(0, raw - gap);
    const dashArray = `${visible} ${circumference - visible}`;
    const dashOffset = -offset;
    offset += raw;
    return { ...slice, pct, dashArray, dashOffset };
  });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${chartSize} ${chartSize}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-700"
          />
          {rings.map((slice, index) => (
            <circle
              key={slice.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={index === safeIndex ? stroke + 2 : stroke}
              strokeLinecap="round"
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel ? (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{centerLabel}</span>
          ) : null}
          <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {((active.value / total) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1">
        {rings.map((slice, index) => (
          <li key={slice.label}>
            <button
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition ${
                index === safeIndex ? 'bg-cockpit-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{slice.label}</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                {(slice.pct * 100).toFixed(0)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
