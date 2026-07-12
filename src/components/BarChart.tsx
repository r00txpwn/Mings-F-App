import { useLanguage } from '../contexts/LanguageContext';

export interface BarChartDataPoint {
  label: string;
  value: number;
}

export interface BarChartSeries {
  label: string;
  color: string;
  data: BarChartDataPoint[];
}

export type BarChartValueFormat = 'currency' | 'integer';

interface BarChartProps {
  series: BarChartSeries[];
  height?: number;
  valueFormat?: BarChartValueFormat;
  showLegend?: boolean;
}

function formatValue(value: number, format: BarChartValueFormat): string {
  if (format === 'integer') return Math.round(value).toString();
  return `₼${value.toFixed(0)}`;
}

export function BarChart({
  series,
  height = 220,
  valueFormat = 'currency',
  showLegend,
}: BarChartProps) {
  const { t } = useLanguage();
  const primary = series[0];
  const labels = primary?.data.map((d) => d.label) ?? [];
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);

  if (!primary || labels.length === 0 || allValues.every((v) => v === 0)) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
        style={{ height }}
      >
        {t.noDataForPeriod}
      </div>
    );
  }

  const padding = { top: 12, right: 8, bottom: 36, left: 44 };
  const innerWidth = 800;
  const chartWidth = innerWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / labels.length;
  const barGap = 4;
  const barWidth = Math.max(4, (groupWidth - barGap * (series.length + 1)) / series.length);

  const legendVisible = showLegend ?? series.length > 1;

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${innerWidth} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="block max-w-full text-slate-600 dark:text-slate-400"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const tick = maxValue * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.12"
              />
              <text
                x={padding.left - 6}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="fill-current text-[9px]"
              >
                {formatValue(tick, valueFormat)}
              </text>
            </g>
          );
        })}

        {labels.map((label, labelIndex) => {
          const groupX = padding.left + labelIndex * groupWidth + barGap;
          return (
            <g key={label}>
              {series.map((s, seriesIndex) => {
                const value = s.data[labelIndex]?.value ?? 0;
                const barHeight = (value / maxValue) * chartHeight;
                const x = groupX + seriesIndex * (barWidth + barGap);
                const y = padding.top + chartHeight - barHeight;
                return (
                  <rect
                    key={s.label}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, value > 0 ? 2 : 0)}
                    rx={3}
                    fill={s.color}
                    opacity={0.92}
                  />
                );
              })}
              <text
                x={groupX + (groupWidth - barGap) / 2}
                y={padding.top + chartHeight + 14}
                textAnchor="middle"
                className="fill-current text-[9px]"
              >
                {label.length > 8 ? `${label.slice(0, 7)}…` : label}
              </text>
            </g>
          );
        })}
      </svg>

      {legendVisible ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
