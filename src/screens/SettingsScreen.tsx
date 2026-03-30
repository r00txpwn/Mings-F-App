import { useState, useEffect } from 'react';
import { Globe, Trash2, Plus, Check, Moon, Sun, Store, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../translations';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';

interface SalesChannel {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [showChannelSuccess, setShowChannelSuccess] = useState(false);
  const [deleteChannelConfirm, setDeleteChannelConfirm] = useState<string | null>(null);

  const languageNames: Record<Language, Record<Language, string>> = {
    en: { en: 'English', az: 'Azerbaijani', ru: 'Russian' },
    az: { en: 'İngilis', az: 'Azərbaycan', ru: 'Rus' },
    ru: { en: 'Английский', az: 'Азербайджанский', ru: 'Русский' },
  };
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: languageNames[language].en, flag: '🇬🇧' },
    { code: 'az', name: languageNames[language].az, flag: '🇦🇿' },
    { code: 'ru', name: languageNames[language].ru, flag: '🇷🇺' },
  ];

  const localizeChannelDescription = (channel: SalesChannel) => {
    const base = channel.description?.trim();
    if (!base) return '';
    if (base === 'Food delivery and ride-hailing platform') {
      if (language === 'az') return 'Yemək çatdırılması və ride-hailing platforması';
      if (language === 'ru') return 'Платформа доставки еды и такси';
      return base;
    }
    if (base === 'QR code ordering system') {
      if (language === 'az') return 'QR kod sifariş sistemi';
      if (language === 'ru') return 'Система заказов по QR-коду';
      return base;
    }
    if (base === 'Food delivery platform') {
      if (language === 'az') return 'Yemək çatdırılması platforması';
      if (language === 'ru') return 'Платформа доставки еды';
      return base;
    }
    return base;
  };

  useEffect(() => {
    fetchSalesChannels();
  }, []);

  const fetchSalesChannels = async () => {
    const { data, error } = await supabase
      .from('sales_channels')
      .select('*')
      .order('name', { ascending: true });

    if (data && !error) {
      setSalesChannels(data);
    }
  };

  const handleAddSalesChannel = async () => {
    if (!newChannelName.trim()) return;

    const { error } = await supabase
      .from('sales_channels')
      .insert([
        {
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || 'Sales channel',
          is_active: true
        }
      ]);

    if (error) {
      console.error('Error adding sales channel:', error);
      alert(`Error adding sales channel: ${error.message}`);
      return;
    }

    setNewChannelName('');
    setNewChannelDescription('');
    setShowChannelSuccess(true);
    setTimeout(() => setShowChannelSuccess(false), 3000);
    fetchSalesChannels();
  };

  const handleToggleSalesChannel = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('sales_channels')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchSalesChannels();
    }
  };

  const handleDeleteSalesChannel = async (id: string) => {
    const { error } = await supabase
      .from('sales_channels')
      .delete()
      .eq('id', id);

    if (!error) {
      setDeleteChannelConfirm(null);
      fetchSalesChannels();
    }
  };

  return (
    <div className="animate-fadeIn">
      {deleteChannelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="cockpit-panel-solid max-w-md w-full animate-scaleIn p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
                <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                  {t.confirm}
                </h3>
                <p className="mb-6 text-slate-600 dark:text-slate-400">
                  {t.delete}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteSalesChannel(deleteChannelConfirm)}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-rose-700"
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteChannelConfirm(null)}
                    className="cockpit-btn-ghost flex-1 justify-center"
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader eyebrow={t.system} title={t.settings} description={t.applicationPreferences} icon={Globe} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="cockpit-panel p-6">
          <h2 className="cockpit-section-title mb-5 flex items-center gap-2">
            <Globe className="h-5 w-5 text-cockpit-600 dark:text-cockpit-400" />
            {t.language}
          </h2>
          <div className="mb-6 space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`w-full rounded-xl p-4 text-left font-medium shadow-sm transition-all hover:shadow-md ${
                  language === lang.code
                    ? 'scale-[1.02] bg-gradient-to-r from-cockpit-600 to-cockpit-700 text-white shadow-lg shadow-cockpit-500/25'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {language === lang.code && (
                    <Check className="w-5 h-5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-5 dark:border-white/5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-slate-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              {t.theme}
            </h3>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full rounded-xl bg-slate-50 p-4 text-left font-medium text-slate-900 shadow-sm transition-all hover:shadow-md dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span>{theme === 'dark' ? t.darkMode : t.lightMode}</span>
                </div>
                <div className={`relative h-6 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-cockpit-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="cockpit-panel p-6">
          <h2 className="cockpit-section-title mb-5 flex items-center gap-2">
            <Store className="h-5 w-5 text-cockpit-600 dark:text-cockpit-400" />
            {t.salesChannels}
          </h2>

          {showChannelSuccess && (
            <div className="cockpit-alert-success mb-5 animate-scaleIn">
              <Check className="h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-100" />
              <span>{t.savedSuccessfully}</span>
            </div>
          )}

          <div className="mb-5 space-y-3">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder={t.enterChannelName}
              className="cockpit-input"
            />

            <input
              type="text"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder={t.enterDescription}
              className="cockpit-input"
            />

            <button
              type="button"
              onClick={handleAddSalesChannel}
              disabled={!newChannelName.trim()}
              className="cockpit-btn-primary w-full justify-center disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
              {t.addChannel}
            </button>
          </div>

          <div className="border-t border-white/10 pt-5 dark:border-white/5">
            <h3 className="mb-3 text-base font-bold text-slate-700 dark:text-slate-300">{t.activeChannels}</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {salesChannels.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t.noDataForPeriod}</p>
              ) : (
                salesChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                      channel.is_active
                        ? 'border-cockpit-500/30 bg-cockpit-500/5 hover:bg-cockpit-500/10'
                        : 'border-slate-200 bg-slate-50/80 opacity-60 dark:border-white/5 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt={channel.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <Store className="h-5 w-5 shrink-0 text-cockpit-600 dark:text-cockpit-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{channel.name}</p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-400">{localizeChannelDescription(channel)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSalesChannel(channel.id, channel.is_active)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          channel.is_active
                            ? 'bg-cockpit-600 text-white hover:bg-cockpit-700'
                            : 'bg-slate-300 text-slate-700 hover:bg-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500'
                        }`}
                      >
                        {channel.is_active ? t.active : t.inactive}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteChannelConfirm(channel.id)}
                        className="rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
