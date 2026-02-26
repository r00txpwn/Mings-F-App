import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-full p-8 select-none">
      <div className="bg-emerald-900/30 p-6 rounded-full mb-8">
        <CheckCircle className="w-20 h-20 text-emerald-400" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-3 text-center">
        {t.orderConfirmed}
      </h1>

      <p className="text-gray-400 text-lg mb-10">{t.payAtCounter}</p>

      <div className="bg-gray-800 rounded-3xl p-8 mb-10 border-2 border-emerald-500">
        <p className="text-gray-400 text-sm font-medium text-center mb-2">
          {t.yourOrderNumber}
        </p>
        <p className="text-7xl font-bold text-emerald-400 text-center tracking-wider">
          {displayNumber}
        </p>
      </div>

      <button
        onClick={onDone}
        className="bg-gray-800 hover:bg-gray-700 text-white px-12 py-4 rounded-2xl font-medium transition-colors min-h-[60px]"
      >
        Done ({countdown}s)
      </button>
    </div>
  );
}
