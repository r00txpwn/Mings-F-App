import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Translations } from '../translations';
import { supabase } from '../lib/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const savedLanguage = localStorage.getItem('app_language') as Language;
        if (savedLanguage && ['en', 'az', 'ru'].includes(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('language')
        .maybeSingle();

      if (data && !error) {
        setLanguageState(data.language as Language);
        localStorage.setItem('app_language', data.language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({ language: lang, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({ language: lang });
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
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
      t: translations.en
    };
  }
  return context;
}
