import type { ReactNode } from 'react';
import { DateRangePicker } from '../DateRangePicker';
import { useLanguage } from '../../contexts/LanguageContext';

export type DatePreset = 'this_month' | 'last_month' | 'custom';

export interface FilterBarProps {
  selectedPreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  channelFilter?: ReactNode;
}

/** Local calendar YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPresetDateRange(preset: Exclude<DatePreset, 'custom'>): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const today = toLocalDateISO(now);

  if (preset === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toLocalDateISO(start), endDate: toLocalDateISO(end) };
  }

  // this_month — month-to-date (1st → today)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toLocalDateISO(monthStart), endDate: today };
}

export function FilterBar({
  selectedPreset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  channelFilter,
}: FilterBarProps) {
  const { t } = useLanguage();
  const PRESET_OPTIONS: Array<{ value: DatePreset; label: string }> = [
    { value: 'this_month', label: t.thisMonth },
    { value: 'last_month', label: t.lastMonth },
    { value: 'custom', label: t.custom },
  ];
  const showCustomInputs = selectedPreset === 'custom' && onStartDateChange && onEndDateChange;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cockpit-600 dark:text-cockpit-400">
          {t.period}
        </span>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {PRESET_OPTIONS.map((preset) => {
            const isActive = selectedPreset === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onPresetChange(preset.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cockpit-600 text-white shadow-sm dark:bg-cockpit-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {channelFilter ? <div className="shrink-0">{channelFilter}</div> : null}
      </div>

      {showCustomInputs ? (
        <div className="mt-3 max-w-md">
          <DateRangePicker
            startDate={startDate ?? ''}
            endDate={endDate ?? ''}
            onStartChange={onStartDateChange}
            onEndChange={onEndDateChange}
            startLabel={t.startDate}
            endLabel={t.endDate}
          />
        </div>
      ) : null}
    </div>
  );
}
