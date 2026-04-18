import { describe, it, expect } from 'vitest';
import { translations, type Language } from '../../src/translations';

const LANGUAGES: Language[] = ['en', 'az', 'ru'];
const BASE_LANG: Language = 'en';

describe('translations completeness', () => {
  it('all languages export a translations object', () => {
    for (const lang of LANGUAGES) {
      expect(translations[lang], `translations["${lang}"] should exist`).toBeDefined();
      expect(typeof translations[lang]).toBe('object');
    }
  });

  it('all languages have the same keys as English', () => {
    const baseKeys = Object.keys(translations[BASE_LANG]).sort();

    for (const lang of LANGUAGES) {
      if (lang === BASE_LANG) continue;
      const langKeys = Object.keys(translations[lang]).sort();

      const missing = baseKeys.filter((k) => !langKeys.includes(k));
      const extra = langKeys.filter((k) => !baseKeys.includes(k));

      expect(missing, `${lang} is missing keys: ${missing.join(', ')}`).toHaveLength(0);
      expect(extra, `${lang} has extra keys not in en: ${extra.join(', ')}`).toHaveLength(0);
    }
  });

  it('no translation value is an empty string', () => {
    for (const lang of LANGUAGES) {
      const empty = Object.entries(translations[lang])
        .filter(([, v]) => typeof v === 'string' && v.trim() === '')
        .map(([k]) => k);

      expect(empty, `${lang} has empty string values for: ${empty.join(', ')}`).toHaveLength(0);
    }
  });

  it('no translation value is undefined or null', () => {
    for (const lang of LANGUAGES) {
      const nullish = Object.entries(translations[lang])
        .filter(([, v]) => v === null || v === undefined)
        .map(([k]) => k);

      expect(nullish, `${lang} has null/undefined values for: ${nullish.join(', ')}`).toHaveLength(0);
    }
  });

  it('English has a substantial number of keys (regression guard)', () => {
    const count = Object.keys(translations.en).length;
    expect(count, `Expected at least 600 translation keys, found ${count}`).toBeGreaterThanOrEqual(600);
  });
});
