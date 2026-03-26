import type { ReactNode } from 'react';
import { DateRangePicker } from '../DateRangePicker';

export type DatePreset = 'today' | '7d' | '30d' | 'mtd' | 'qtd' | 'custom';

export interface FilterBarProps {
  selectedPreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  channelFilter?: ReactNode;
}

const PRESET_OPTIONS: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
  { value: 'custom', label: 'Custom' },
];

export function FilterBar({
  selectedPreset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  channelFilter,
}: FilterBarProps) {
  const showCustomInputs = selectedPreset === 'custom' && onStartDateChange && onEndDateChange;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-violet-400/20 dark:bg-slate-900/60 dark:shadow-neon-soft">
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cockpit-600 dark:text-cockpit-400">
          Range
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
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-neon-soft ring-1 ring-violet-300/40'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
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
            startLabel="Start"
            endLabel="End"
          />
        </div>
      ) : null}
    </div>
  );
}
