import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmationScreenProps {
  displayNumber: string;
  onDone: () => void;
}

export function ConfirmationScreen({ displayNumber, onDone }: ConfirmationScreenProps) {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col p-8 select-none"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1
          className="mb-3 text-4xl font-bold leading-tight"
          style={{ color: 'var(--kiosk-text)' }}
        >
          {t.orderConfirmed}
        </h1>
        <p className="mb-10 text-lg" style={{ color: 'var(--kiosk-muted)' }}>
          {t.payAtCounter}
        </p>

        <div
          className="mb-10 rounded-[22px] border-2 px-12 py-8 shadow-sm"
          style={{
            backgroundColor: 'var(--kiosk-card)',
            borderColor: 'var(--kiosk-primary)',
          }}
        >
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--kiosk-muted)' }}
          >
            {t.yourOrderNumber}
          </p>
          <p
            className="font-bold tracking-wider"
            style={{ fontSize: '5rem', lineHeight: 1, color: 'var(--kiosk-primary)' }}
          >
            {displayNumber}
          </p>
        </div>

        <div
          className="mb-8 h-16 w-16 rounded-full opacity-20"
          style={{ backgroundColor: 'var(--kiosk-primary)' }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-md gap-4">
        <button
          type="button"
          onClick={onDone}
          className="min-h-[70px] flex-[0_0_47%] rounded-[18px] border text-lg font-bold transition-all active:scale-95"
          style={{
            borderColor: 'var(--kiosk-border)',
            color: 'var(--kiosk-text)',
            backgroundColor: 'transparent',
          }}
        >
          {t.kioskDoneCountdown.replace('{seconds}', String(countdown))}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-[70px] flex-[0_0_47%] rounded-[18px] text-lg font-bold text-white transition-all active:scale-95"
          style={{ backgroundColor: 'var(--kiosk-primary)' }}
        >
          {t.kioskOrderMore}
        </button>
      </div>
    </div>
  );
}
