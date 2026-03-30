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

interface LineChartProps {
  series: DataSeries[];
  height?: number;
}

export function LineChart({ series, height = 300 }: LineChartProps) {
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

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
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

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="text-gray-700 dark:text-gray-300">
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
                x={padding.left - 10}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs fill-current"
              >
                ₼{value.toFixed(0)}
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
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-current"
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
                strokeWidth="2.5"
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
                  <title>{`${s.label}: ₼${p.value.toFixed(2)}`}</title>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
