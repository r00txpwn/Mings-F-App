import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  hubForScreen,
  navItemForScreen,
  type CockpitScreen,
} from './cockpitNav';

interface CockpitHubTabsProps {
  currentScreen: CockpitScreen;
  onNavigate: (screen: CockpitScreen) => void;
}

export function CockpitHubTabs({ currentScreen, onNavigate }: CockpitHubTabsProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hub = hubForScreen(currentScreen);
  if (!hub || hub.members.length <= 1) return null;

  return (
    <div
      className={`sticky top-0 z-20 -mx-4 mb-4 border-b px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
        isDark ? 'border-slate-800 bg-slate-950/95 backdrop-blur-sm' : 'border-slate-200 bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="flex gap-1 overflow-x-auto py-2">
        {hub.members.map((memberId) => {
          const navItem = navItemForScreen(memberId);
          if (!navItem) return null;
          const active = currentScreen === memberId;
          return (
            <button
              key={memberId}
              type="button"
              onClick={() => onNavigate(memberId)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? isDark
                    ? 'bg-cockpit-950 text-cockpit-100 ring-1 ring-cockpit-800'
                    : 'bg-cockpit-50 text-cockpit-900 ring-1 ring-cockpit-200'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t[navItem.labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
