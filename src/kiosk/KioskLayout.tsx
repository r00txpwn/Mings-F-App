import { ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface KioskLayoutProps {
  flow: string;
  onBack: () => void;
  showBack: boolean;
  children: React.ReactNode;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

export function KioskLayout({ onBack, showBack, children }: KioskLayoutProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="neon-shell fixed inset-0 flex flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-violet-500/25 bg-slate-900/95 px-6 py-3 shadow-neon-soft backdrop-blur-md">
        <div className="w-24">
          {showBack && (
            <button
              onClick={onBack}
              className="flex min-h-[48px] items-center gap-2 rounded-xl px-3 text-gray-400 transition-colors hover:bg-violet-500/15 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-violet-300" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                language === lang.code
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-neon-soft'
                  : 'text-slate-300 hover:bg-violet-500/15 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
