import type { Language } from '../translations';

const LANGS: { code: Language; label: string; sr: string }[] = [
  { code: 'en', label: 'EN', sr: 'English' },
  { code: 'az', label: 'AZ', sr: 'Azerbaijani' },
  { code: 'ru', label: 'RU', sr: 'Russian' },
];

interface OrderLangChipsProps {
  language: Language;
  onChange: (lang: Language) => void;
  label: string;
}

export function OrderLangChips({ language, onChange, label }: OrderLangChipsProps) {
  return (
    <div className="sf-langs" role="group" aria-label={label}>
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className="sf-lang"
          aria-label={lang.sr}
          aria-pressed={language === lang.code}
          onClick={() => onChange(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
