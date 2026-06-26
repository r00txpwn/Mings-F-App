import { Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { KdsCheckableLine } from './kdsBoardUtils';

interface KdsLineItemProps {
  line: KdsCheckableLine;
  isUpdating?: boolean;
  onToggle?: (saleItemId: string, prepared: boolean) => void;
  /** When false, show read-only (history drawer). */
  interactive?: boolean;
}

export function KdsLineItem({
  line,
  isUpdating = false,
  onToggle,
  interactive = true,
}: KdsLineItemProps) {
  const { t } = useLanguage();
  const prepared = Boolean(line.preparedAt);

  const handleToggle = () => {
    if (!interactive || isUpdating || !onToggle) return;
    onToggle(line.saleItemId, !prepared);
  };

  return (
    <div className="flex items-start gap-2">
      {interactive ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={handleToggle}
          aria-label={prepared ? t.kdsMarkItemUnprepared : t.kdsMarkItemPrepared}
          aria-pressed={prepared}
          className={`flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full border-2 transition-all disabled:opacity-50 ${
            prepared
              ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-900/30'
              : 'border-slate-600 bg-slate-800/90 text-slate-500 hover:border-emerald-500/50 hover:bg-slate-800'
          }`}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : prepared ? (
            <Check className="h-5 w-5" aria-hidden />
          ) : (
            <span className="h-3 w-3 rounded-full border border-current" aria-hidden />
          )}
        </button>
      ) : (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
            prepared ? 'border-emerald-400/60 text-emerald-400' : 'border-slate-600 text-slate-600'
          }`}
        >
          {prepared ? <Check className="h-5 w-5" /> : null}
        </div>
      )}
      <div className="min-w-0 flex-1 pt-1">
        {line.groupLabel ? (
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{line.groupLabel}</p>
        ) : null}
        <p className="text-base leading-snug text-white">
          <span className="mr-1.5 inline-block min-w-[2rem] font-bold tabular-nums text-emerald-400">
            {line.quantity}×
          </span>
          <span className="font-medium">{line.label}</span>
        </p>
        {line.modifiers && line.modifiers.length > 0 ? (
          <p className="ml-10 text-sm text-slate-500">{line.modifiers.join(', ')}</p>
        ) : null}
        {line.notes ? <p className="mt-0.5 text-xs text-amber-200/90">{line.notes}</p> : null}
      </div>
    </div>
  );
}
