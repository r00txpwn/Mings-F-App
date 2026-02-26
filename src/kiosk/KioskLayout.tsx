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
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="w-24">
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[48px] px-3"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                language === lang.code
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
