import { BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface IdleScreenProps {
  onStart: () => void;
}

export function IdleScreen({ onStart }: IdleScreenProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center min-h-full cursor-pointer select-none"
      onClick={onStart}
    >
      <div className="bg-gray-800 p-6 rounded-2xl mb-8 animate-pulse-slow">
        <BarChart3 className="w-16 h-16 text-emerald-400" />
      </div>
      <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
        {t.tapToOrder}
      </h1>
      <p className="text-gray-500 text-lg">
        {t.menu}
      </p>
      <div className="mt-12 w-16 h-1 bg-emerald-500 rounded-full animate-pulse" />
    </div>
  );
}
