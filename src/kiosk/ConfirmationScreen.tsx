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
      className="flex flex-col min-h-full p-8 select-none font-montserrat"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      {/* Top content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* "Order added" heading */}
        <h1
          className="font-bold mb-3 leading-tight"
          style={{ color: 'var(--kiosk-white)', fontSize: '2.2rem' }}
        >
          {t.orderConfirmed}
        </h1>
        <p className="text-lg mb-10" style={{ color: 'var(--kiosk-smoke)' }}>
          {t.payAtCounter}
        </p>

        {/* Order number card */}
        <div
          className="rounded-[22px] px-12 py-8 mb-10"
          style={{
            backgroundColor: 'var(--kiosk-card)',
            border: '2.5px solid var(--kiosk-primary)',
          }}
        >
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--kiosk-smoke)' }}
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

        {/* Decorative circle */}
        <div
          className="w-16 h-16 rounded-full opacity-20 mb-8"
          style={{ backgroundColor: 'var(--kiosk-primary)' }}
        />
      </div>

      {/* Footer buttons (qomander style: two side-by-side) */}
      <div className="flex gap-4 max-w-md mx-auto w-full">
        <button
          onClick={onDone}
          className="font-bold rounded-[18px] transition-all active:scale-95 min-h-[70px]"
          style={{
            flex: '0 0 47%',
            border: '1px solid var(--kiosk-border)',
            color: 'var(--kiosk-white)',
            backgroundColor: 'transparent',
            fontSize: '1.05rem',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--kiosk-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--kiosk-border)')}
        >
          Done ({countdown}s)
        </button>
        <button
          onClick={onDone}
          className="text-white font-bold rounded-[18px] transition-all active:scale-95 min-h-[70px]"
          style={{
            flex: '0 0 47%',
            backgroundColor: 'var(--kiosk-primary)',
            fontSize: '1.05rem',
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
        >
          Order More
        </button>
      </div>
    </div>
  );
}
