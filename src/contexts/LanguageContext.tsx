import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { translations, Language, Translations } from '../translations';
import { supabase } from '../lib/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const APP_LANGUAGE_STORAGE_KEY = 'app_language';

function isValidLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'az' || value === 'ru';
}

export function readStoredLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    if (saved && isValidLanguage(saved)) return saved;
  } catch {
    // localStorage unavailable (SSR / private mode)
  }
  return null;
}

async function upsertUserLanguagePreference(userId: string, lang: Language): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase
      .from('user_preferences')
      .update({ language: lang, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('user_preferences').insert({ language: lang, user_id: userId });
  if (error) throw error;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage() ?? 'en');
  const translated = useMemo(
    () =>
      new Proxy(translations[language], {
        get(target, prop: string) {
          const value = target[prop];
          return typeof value === 'string' ? value : prop;
        },
      }) as Translations,
    [language]
  );

  const syncLanguagePreference = useCallback(async () => {
    const stored = readStoredLanguage();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (stored) setLanguageState(stored);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (stored) setLanguageState(stored);
        return;
      }

      if (data?.language && isValidLanguage(data.language)) {
        if (!stored) {
          setLanguageState(data.language);
          localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, data.language);
        }
        return;
      }

      if (stored) {
        setLanguageState(stored);
        try {
          await upsertUserLanguagePreference(user.id, stored);
        } catch (seedError) {
          console.error('Error seeding language preference:', seedError);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
      if (stored) setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    void syncLanguagePreference();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncLanguagePreference();
    });

    return () => subscription.unsubscribe();
  }, [syncLanguagePreference]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await upsertUserLanguagePreference(user.id, lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translated }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: translations.en,
    };
  }
  return context;
}
