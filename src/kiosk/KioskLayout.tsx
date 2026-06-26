import { ArrowLeft, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface KioskLayoutProps {
  flow: string;
  onBack: () => void;
  showBack: boolean;
  showFooter?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

export function KioskLayout({
  onBack,
  showBack,
  showFooter = false,
  footer,
  children,
}: KioskLayoutProps) {
  const { language, setLanguage } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="kiosk-light kiosk-shell font-montserrat fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--kiosk-bg)', color: 'var(--kiosk-text)' }}
    >
      <header
        className="flex shrink-0 items-center justify-between px-5 py-3 shadow-sm"
        style={{
          backgroundColor: 'var(--kiosk-card)',
          borderBottom: '1px solid var(--kiosk-border)',
        }}
      >
        <div className="flex w-28 items-center gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-[48px] min-w-[48px] touch-manipulation items-center justify-center rounded-xl transition-colors active:scale-95"
              style={{ color: 'var(--kiosk-text)' }}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--kiosk-primary)' }}>
              ming&apos;s
            </span>
          )}
        </div>

        <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--kiosk-muted)' }}>
          {time}
        </span>

        <div className="flex w-28 items-center justify-end gap-1">
          <Globe className="mr-1 h-3.5 w-3.5" style={{ color: 'var(--kiosk-muted)' }} aria-hidden />
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className="min-h-[36px] touch-manipulation rounded-lg px-2 py-1 text-xs font-semibold transition-colors"
              style={
                language === lang.code
                  ? { backgroundColor: 'var(--kiosk-primary)', color: '#fff' }
                  : { color: 'var(--kiosk-muted)' }
              }
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      {showFooter && footer ? footer : null}
    </div>
  );
}
