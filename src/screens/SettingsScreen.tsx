import { useState, useEffect } from 'react';
import { Globe, Trash2, Plus, Check, Moon, Sun, Store, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../translations';
import { supabase } from '../lib/supabase';
import { adminInsert, adminUpdate } from '../lib/adminApi';
import {
  canToggleSalesChannelActive,
  dedupeSalesChannelsForDisplay,
  isDeletableSalesChannel,
  isProtectedSalesChannel,
  isProtectedSalesChannelName,
} from '../lib/salesChannelPolicy';
import { PageHeader } from '../components/cockpit';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface SalesChannel {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [addingChannel, setAddingChannel] = useState(false);
  const [deleteChannelConfirm, setDeleteChannelConfirm] = useState<SalesChannel | null>(null);
  const [deleteChannelError, setDeleteChannelError] = useState<string | null>(null);
  const [deleteChannelLoading, setDeleteChannelLoading] = useState(false);

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
    if (base === 'In-store point of sale') {
      if (language === 'az') return 'Mağaza daxili satış nöqtəsi (POS)';
      if (language === 'ru') return 'Касса в зале (POS)';
      return base;
    }
    if (base === 'In-store self-service kiosk') {
      if (language === 'az') return 'Mağaza daxili self-servis kiosk';
      if (language === 'ru') return 'Киоск самообслуживания в зале';
      return base;
    }
    if (base === 'Website and mobile ordering') {
      if (language === 'az') return 'Vebsayt və mobil sifariş';
      if (language === 'ru') return 'Сайт и мобильные заказы';
      return base;
    }
    return base;
  };

  useEffect(() => {
    void fetchSalesChannels();
  }, []);

  const fetchSalesChannels = async () => {
    const primary = await supabase
      .from('sales_channels')
      .select('*')
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (primary.error?.message?.includes('is_deleted')) {
      const fallback = await supabase.from('sales_channels').select('*').order('name', { ascending: true });
      if (fallback.data && !fallback.error) {
        setSalesChannels(dedupeSalesChannelsForDisplay(fallback.data));
      }
      return;
    }

    if (primary.error) {
      console.error('Error loading sales channels:', primary.error.message);
      return;
    }

    if (primary.data) {
      setSalesChannels(dedupeSalesChannelsForDisplay(primary.data));
    }
  };

  const handleAddSalesChannel = async () => {
    if (!newChannelName.trim() || addingChannel) return;

    if (isProtectedSalesChannelName(newChannelName.trim())) {
      toast.error(t.salesChannelProtectedError);
      return;
    }

    setAddingChannel(true);
    const result = await adminInsert('sales_channels', {
      name: newChannelName.trim(),
      description: newChannelDescription.trim() || 'Sales channel',
      is_active: true,
      is_deleted: false,
    });
    setAddingChannel(false);

    if (!result.ok) {
      console.error('Error adding sales channel:', result.error);
      toast.error(result.error ?? t.errorOccurred);
      return;
    }

    setNewChannelName('');
    setNewChannelDescription('');
    toast.success(t.savedSuccessfully);
    void fetchSalesChannels();
  };

  const handleToggleSalesChannel = async (channel: SalesChannel) => {
    if (!canToggleSalesChannelActive(channel)) {
      toast.error(t.salesChannelProtectedError);
      return;
    }

    const result = await adminUpdate('sales_channels', channel.id, { is_active: !channel.is_active });

    if (result.ok) {
      void fetchSalesChannels();
    } else {
      toast.error(result.error ?? t.errorOccurred);
    }
  };

  const handleDeleteSalesChannel = async () => {
    if (!deleteChannelConfirm) return;

    if (!isDeletableSalesChannel(deleteChannelConfirm)) {
      setDeleteChannelError(t.salesChannelProtectedError);
      return;
    }

    const channelId = deleteChannelConfirm.id;
    const previousChannels = salesChannels;

    setDeleteChannelLoading(true);
    setDeleteChannelError(null);
    setSalesChannels((prev) => prev.filter((ch) => ch.id !== channelId));

    const result = await adminUpdate('sales_channels', channelId, {
      is_deleted: true,
      is_active: false,
    });

    setDeleteChannelLoading(false);

    if (result.ok) {
      setDeleteChannelConfirm(null);
      toast.success(t.channelRemovedSuccess);
      void fetchSalesChannels();
      return;
    }

    setSalesChannels(previousChannels);
    setDeleteChannelError(result.error ?? t.deleteChannelError);
  };

  return (
    <div className="animate-fadeIn">
      <ConfirmDialog
        open={Boolean(deleteChannelConfirm)}
        title={t.deleteChannelConfirmTitle}
        message={
          deleteChannelConfirm
            ? t.deleteChannelConfirmMessage.replace('{name}', deleteChannelConfirm.name)
            : ''
        }
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        tone="danger"
        confirmLoading={deleteChannelLoading}
        confirmLoadingLabel={t.pleaseWait}
        errorMessage={deleteChannelError}
        disableClose={deleteChannelLoading}
        onConfirm={() => void handleDeleteSalesChannel()}
        onCancel={() => {
          if (deleteChannelLoading) return;
          setDeleteChannelConfirm(null);
          setDeleteChannelError(null);
        }}
      />

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
                    ? 'scale-[1.02] bg-cockpit-600 text-white shadow-lg shadow-cockpit-500/25'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {language === lang.code ? <Check className="h-5 w-5" /> : null}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-slate-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              {t.settingsAppearance}
            </h3>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full rounded-xl bg-slate-50 p-4 text-left font-medium text-slate-900 shadow-sm transition-all hover:shadow-md dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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
              onClick={() => void handleAddSalesChannel()}
              disabled={!newChannelName.trim() || addingChannel}
              className="cockpit-btn-primary w-full justify-center disabled:opacity-40"
            >
              {addingChannel ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {t.addChannel}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <h3 className="mb-3 text-base font-bold text-slate-700 dark:text-slate-300">{t.activeChannels}</h3>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {salesChannels.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t.noDataForPeriod}</p>
              ) : (
                salesChannels.map((channel) => {
                  const protectedChannel = isProtectedSalesChannel(channel);
                  const deletable = isDeletableSalesChannel(channel);
                  return (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                      channel.is_active
                        ? 'border-cockpit-500/30 bg-cockpit-500/5 hover:bg-cockpit-500/10'
                        : 'border-slate-200 bg-slate-50/80 opacity-60 dark:border-slate-700 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt={channel.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <Store className="h-5 w-5 shrink-0 text-cockpit-600 dark:text-cockpit-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{channel.name}</p>
                          {protectedChannel ? (
                            <span className="shrink-0 rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {t.systemSalesChannel}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-400">{localizeChannelDescription(channel)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {canToggleSalesChannelActive(channel) ? (
                        <button
                          type="button"
                          onClick={() => void handleToggleSalesChannel(channel)}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                            channel.is_active
                              ? 'bg-cockpit-600 text-white hover:bg-cockpit-700'
                              : 'bg-slate-300 text-slate-700 hover:bg-slate-400 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500'
                          }`}
                        >
                          {channel.is_active ? t.active : t.inactive}
                        </button>
                      ) : (
                        <span className="rounded-md bg-cockpit-600 px-2.5 py-1 text-xs font-semibold text-white">
                          {t.active}
                        </span>
                      )}
                      {deletable ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteChannelError(null);
                            setDeleteChannelConfirm(channel);
                          }}
                          className="rounded-md p-1.5 text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                          title={t.delete}
                          aria-label={`${t.delete} ${channel.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
