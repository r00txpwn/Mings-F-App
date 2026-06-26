import { ANALYTICS_SOURCE_OPTIONS, labelForAnalyticsSource } from '../../lib/analyticsSourceFilter';
import type { AnalyticsSourceFilter } from '../../types/analytics';
import { useLanguage } from '../../contexts/LanguageContext';

interface SourceFilterChipsProps {
  value: AnalyticsSourceFilter;
  onChange: (value: AnalyticsSourceFilter) => void;
}

export function SourceFilterChips({ value, onChange }: SourceFilterChipsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {t.sourceFilter}
      </span>
      {ANALYTICS_SOURCE_OPTIONS.map((src) => (
        <button
          key={src}
          type="button"
          onClick={() => onChange(src)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            value === src
              ? 'bg-cockpit-600 text-white dark:bg-cockpit-500'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          {labelForAnalyticsSource(t, src)}
        </button>
      ))}
    </div>
  );
}
