import { ArrowLeft } from 'lucide-react';
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
    <div
      className="kiosk-shell font-montserrat fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--kiosk-bg)', color: 'var(--kiosk-white)' }}
    >
      {/* Header bar */}
      <div
        className="flex shrink-0 items-center justify-between px-6 py-3"
        style={{
          backgroundColor: 'var(--kiosk-card)',
          borderBottom: '1px solid var(--kiosk-border)',
        }}
      >
        <div className="w-24">
          {showBack && (
            <button
              onClick={onBack}
              className="flex min-h-[48px] items-center gap-2 rounded-xl px-3 transition-colors"
              style={{ color: 'var(--kiosk-white)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(214,87,69,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="min-h-[36px] rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              style={
                language === lang.code
                  ? { backgroundColor: 'var(--kiosk-primary)', color: '#fff' }
                  : { color: 'var(--kiosk-smoke)' }
              }
              onMouseEnter={e => {
                if (language !== lang.code)
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-white)';
              }}
              onMouseLeave={e => {
                if (language !== lang.code)
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--kiosk-smoke)';
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
