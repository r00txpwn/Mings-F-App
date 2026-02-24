import { useState, useEffect } from 'react';
import { Globe, Trash2, Plus, Check, Moon, Sun, Store, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../translations';
import { supabase } from '../lib/supabase';

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

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t.confirm}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t.delete}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeleteSalesChannel(deleteChannelConfirm)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => setDeleteChannelConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.settings}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t.applicationPreferences}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t.language}
          </h2>
          <div className="space-y-3 mb-6">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full p-4 rounded-xl text-left transition-all font-medium shadow-sm hover:shadow-md ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white scale-[1.02] shadow-blue-500/30'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
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

          <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              {t.theme}
            </h3>
            <button
              onClick={toggleTheme}
              className="w-full p-4 rounded-xl text-left transition-all font-medium shadow-sm hover:shadow-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  <span>{theme === 'dark' ? t.darkMode : t.lightMode}</span>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t.salesChannels}
          </h2>

          {showChannelSuccess && (
            <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-xl p-3 mb-5 flex items-center gap-2 animate-scaleIn">
              <Check className="w-5 h-5 text-green-700 dark:text-green-300" />
              <span className="text-green-900 dark:text-green-100 text-sm font-medium">{t.savedSuccessfully}</span>
            </div>
          )}

          <div className="space-y-3 mb-5">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder={t.enterChannelName}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />

            <input
              type="text"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder={t.enterDescription}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900/30 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />

            <button
              onClick={handleAddSalesChannel}
              disabled={!newChannelName.trim()}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white py-2.5 px-6 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t.addChannel}
            </button>
          </div>

          <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-5">
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">{t.activeChannels}</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {salesChannels.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No channels yet</p>
              ) : (
                salesChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all border ${
                      channel.is_active
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/30'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt={channel.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <Store className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{channel.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{channel.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleSalesChannel(channel.id, channel.is_active)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          channel.is_active
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                      >
                        {channel.is_active ? t.active : t.inactive}
                      </button>
                      <button
                        onClick={() => setDeleteChannelConfirm(channel.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
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
