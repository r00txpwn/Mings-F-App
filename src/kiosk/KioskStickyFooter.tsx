import { ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface KioskStickyFooterProps {
  cartTotal: number;
  cartItemCount: number;
  onRestart: () => void;
  onOrderNow: () => void;
}

export function KioskStickyFooter({
  cartTotal,
  cartItemCount,
  onRestart,
  onOrderNow,
}: KioskStickyFooterProps) {
  const { t } = useLanguage();
  const canOrder = cartItemCount > 0;

  return (
    <footer
      className="flex shrink-0 items-center gap-3 border-t px-4 py-3"
      style={{
        backgroundColor: 'var(--kiosk-card)',
        borderColor: 'var(--kiosk-border)',
      }}
    >
      <button
        type="button"
        onClick={onRestart}
        className="min-h-[48px] touch-manipulation rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.98]"
        style={{
          borderColor: 'var(--kiosk-border)',
          color: 'var(--kiosk-primary)',
          backgroundColor: 'var(--kiosk-bg)',
        }}
      >
        {t.kioskRestartMenu}
      </button>

      <div className="flex flex-1 items-center justify-center">
        <ChevronUp className="h-4 w-4 opacity-30" style={{ color: 'var(--kiosk-muted)' }} aria-hidden />
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--kiosk-muted)' }}>
            {t.orderTotal}
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--kiosk-primary)' }}>
            ₼{cartTotal.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          disabled={!canOrder}
          onClick={onOrderNow}
          className="min-h-[48px] min-w-[140px] touch-manipulation rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: 'var(--kiosk-primary)' }}
        >
          {t.kioskOrderNow}
        </button>
      </div>
    </footer>
  );
}
