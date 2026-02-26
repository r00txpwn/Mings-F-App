import { Globe, Wifi } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface KdsHeaderProps {
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  realtimeStatus: 'connected' | 'reconnecting';
  now: number;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

export function KdsHeader({ pendingCount, preparingCount, readyCount, realtimeStatus, now }: KdsHeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const time = new Date(now).toLocaleTimeString();

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white">{t.kitchenDisplay}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">{pendingCount} {t.pending}</span>
          <span className="text-blue-400">{preparingCount} {t.preparing}</span>
          <span className="text-emerald-400">{readyCount} {t.ready}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-xs text-gray-500">
            {realtimeStatus === 'connected' ? t.connected : t.reconnecting}
          </span>
        </div>
        <span className="text-gray-400 text-sm font-mono">{time}</span>
        <div className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                language === lang.code ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
