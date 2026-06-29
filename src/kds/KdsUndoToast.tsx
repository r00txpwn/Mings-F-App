import { CheckCircle2, Undo2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface KdsUndoToastProps {
  displayNumber: string;
  secondsLeft: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function KdsUndoToast({ displayNumber, secondsLeft, onUndo, onDismiss }: KdsUndoToastProps) {
  const { t } = useLanguage();

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 w-[min(100%-2rem,440px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-950/95 shadow-2xl shadow-violet-950/40 backdrop-blur-xl"
    >
      <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500" />
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {t.kdsUndoComplete.replace('{number}', displayNumber)}
            </p>
            <p className="text-xs text-slate-400">
              {secondsLeft}s · {t.kdsUndoSeconds}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onUndo}
            className="flex min-h-[44px] touch-manipulation items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Undo2 className="h-4 w-4" />
            {t.kdsUndoButton}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label={t.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
