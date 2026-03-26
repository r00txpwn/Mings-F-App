import { Globe } from 'lucide-react';
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
    <div className="flex shrink-0 items-center justify-between border-b border-violet-500/25 bg-slate-900/95 px-4 py-3 shadow-neon-soft backdrop-blur-md">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-lg font-bold tracking-tight text-white">{t.kitchenDisplay}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-violet-200">{pendingCount} {t.pending}</span>
          <span className="text-cyan-300">{preparingCount} {t.preparing}</span>
          <span className="text-emerald-300">{readyCount} {t.ready}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs text-slate-400">
            {realtimeStatus === 'connected' ? t.connected : t.reconnecting}
          </span>
        </div>
        <span className="text-slate-300 text-sm font-mono">{time}</span>
        <div className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-violet-300" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                language === lang.code
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
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
