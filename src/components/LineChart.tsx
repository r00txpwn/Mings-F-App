import { useLanguage } from '../contexts/LanguageContext';
interface DataPoint {
  date: string;
  value: number;
}

interface DataSeries {
  label: string;
  color: string;
  data: DataPoint[];
}

export type LineChartValueFormat = 'currency' | 'integer';

interface LineChartProps {
  series: DataSeries[];
  height?: number;
  /** Default `currency` (₼) for backward compatibility. */
  valueFormat?: LineChartValueFormat;
  /** Show color key under chart. Default: true when more than one series. */
  showLegend?: boolean;
}

function formatAxisValue(value: number, format: LineChartValueFormat): string {
  if (format === 'integer') {
    return Math.round(value).toString();
  }
  return `₼${value.toFixed(0)}`;
}

function formatTooltipValue(value: number, format: LineChartValueFormat): string {
  if (format === 'integer') {
    return value.toFixed(0);
  }
  return `₼${value.toFixed(2)}`;
}

export function LineChart({
  series,
  height = 300,
  valueFormat = 'currency',
  showLegend,
}: LineChartProps) {
  const { t } = useLanguage();
  if (series.length === 0 || series.every(s => s.data.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {t.noDataForPeriod}
      </div>
    );
  }

  const allDates = Array.from(
    new Set(series.flatMap(s => s.data.map(d => d.date)))
  ).sort();

  const allValues = series.flatMap(s => s.data.map(d => d.value));
  const maxValue = Math.max(...allValues, 0);
  const minValue = 0;

  const padding = { top: 16, right: 12, bottom: 32, left: 52 };
  const innerWidth = 800;
  const chartWidth = innerWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (index: number) => {
    return padding.left + (index / (allDates.length - 1 || 1)) * chartWidth;
  };

  const yScale = (value: number) => {
    const range = maxValue - minValue || 1;
    return padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    return minValue + (maxValue - minValue) * (i / yTicks);
  });

  const legendVisible = showLegend ?? series.length > 1;
  const ariaLabel = series.map((s) => s.label).join(', ');

  return (
    <div className="w-full min-w-0 overflow-x-hidden" role="figure" aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${innerWidth} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="block max-w-full text-gray-700 dark:text-gray-300"
        role="presentation"
      >
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {yTickValues.map((value, i) => {
          const y = yScale(value);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.1"
                strokeDasharray="4"
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-[10px] fill-current"
              >
                {formatAxisValue(value, valueFormat)}
              </text>
            </g>
          );
        })}

        {allDates.map((date, i) => {
          const x = xScale(i);
          const showLabel = i % Math.ceil(allDates.length / 10) === 0;
          return (
            <g key={date}>
              {showLabel && (
                <text
                  x={x}
                  y={padding.top + chartHeight + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-current"
                >
                  {formatDate(date)}
                </text>
              )}
            </g>
          );
        })}

        {series.map((s, seriesIndex) => {
          const points = allDates.map((date, i) => {
            const dataPoint = s.data.find(d => d.date === date);
            const value = dataPoint?.value || 0;
            return { x: xScale(i), y: yScale(value), value };
          });

          const pathData = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

          return (
            <g key={seriesIndex}>
              <path
                d={pathData}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={s.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <title>{`${s.label}: ${formatTooltipValue(p.value, valueFormat)}`}</title>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      {legendVisible && series.length > 0 ? (
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-slate-200/80 pt-2 dark:border-white/10">
          {series.map((s, idx) => (
            <li key={`${s.label}-${idx}`} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span
                className="h-2 w-5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
