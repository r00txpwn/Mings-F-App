import {
  BarChart3,
  Banknote,
  ClipboardList,
  DollarSign,
  Flame,
  Home,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MingsWordmark } from '../MingsWordmark';
import type { Translations } from '../../translations';
import {
  COCKPIT_NAV_ITEMS,
  COCKPIT_NAV_SECTIONS,
  type CockpitNavItem,
  type CockpitNavSection,
  type CockpitScreen,
} from './cockpitNav';

const NAV_ICONS: Record<CockpitScreen, ReactNode> = {
  home: <Home className="h-5 w-5 shrink-0" />,
  sales: <ShoppingCart className="h-5 w-5 shrink-0" />,
  'kiosk-orders': <Monitor className="h-5 w-5 shrink-0" />,
  'order-support': <ClipboardList className="h-5 w-5 shrink-0" />,
  delivery: <Truck className="h-5 w-5 shrink-0" />,
  'order-locations': <MapPin className="h-5 w-5 shrink-0" />,
  'menu-builder': <UtensilsCrossed className="h-5 w-5 shrink-0" />,
  combos: <Flame className="h-5 w-5 shrink-0" />,
  products: <Package className="h-5 w-5 shrink-0" />,
  suppliers: <Warehouse className="h-5 w-5 shrink-0" />,
  expenses: <DollarSign className="h-5 w-5 shrink-0" />,
  payouts: <Banknote className="h-5 w-5 shrink-0" />,
  money: <Wallet className="h-5 w-5 shrink-0" />,
  reports: <BarChart3 className="h-5 w-5 shrink-0" />,
  users: <Users className="h-5 w-5 shrink-0" />,
  settings: <Settings className="h-5 w-5 shrink-0" />,
};

const SECTION_LABEL_KEYS: Record<CockpitNavSection, keyof Translations> = {
  overview: 'navOverview',
  orders: 'navOrders',
  catalog: 'navCatalog',
  finance: 'navFinance',
  system: 'navSystem',
};

interface CockpitSidebarProps {
  currentScreen: CockpitScreen;
  onNavigate: (screen: CockpitScreen) => void;
  isAdminUser: boolean;
  userEmail?: string | null;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function CockpitSidebar({
  currentScreen,
  onNavigate,
  isAdminUser,
  userEmail,
  onSignOut,
  collapsed,
  onToggleCollapsed,
  isMobileOpen,
  onMobileClose,
}: CockpitSidebarProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const visibleItems = COCKPIT_NAV_ITEMS.filter((item) => !item.adminOnly || isAdminUser);

  const itemsBySection = COCKPIT_NAV_SECTIONS.reduce<Record<CockpitNavSection, CockpitNavItem[]>>(
    (acc, section) => {
      acc[section] = visibleItems.filter((item) => item.section === section);
      return acc;
    },
    { overview: [], orders: [], catalog: [], finance: [], system: [] },
  );

  const sidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-[17rem]';

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex min-h-screen flex-col border-r transition-all duration-200 ease-out ${sidebarWidth} ${
        isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white shadow-sm'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className={`border-b px-4 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-black px-2 py-1 shadow-sm ring-1 ring-black/10">
              <MingsWordmark
                className={`h-7 w-auto object-contain ${collapsed ? 'max-w-[2.25rem]' : 'max-w-[9rem]'}`}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto p-2">
        {COCKPIT_NAV_SECTIONS.map((section) => {
          const sectionItems = itemsBySection[section];
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-3">
              {!collapsed ? (
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {t[SECTION_LABEL_KEYS[section]]}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const active = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={collapsed ? t[item.labelKey] : undefined}
                      onClick={() => onNavigate(item.id)}
                      className={`group relative flex w-full items-center rounded-lg text-left text-sm font-medium transition-all ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
                      } ${
                        active
                          ? isDark
                            ? 'bg-cockpit-950 text-cockpit-100 ring-1 ring-cockpit-800'
                            : 'bg-cockpit-50 text-cockpit-900 ring-1 ring-cockpit-200'
                          : isDark
                            ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {active && !collapsed ? (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-cockpit-500" />
                      ) : null}
                      <span className={active ? 'text-cockpit-600 dark:text-cockpit-400' : ''}>
                        {NAV_ICONS[item.id]}
                      </span>
                      {!collapsed ? <span className="truncate">{t[item.labelKey]}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={`mt-auto space-y-1 border-t pt-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`hidden w-full items-center rounded-lg text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 lg:flex ${
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
            }`}
            aria-label={collapsed ? t.expandSidebar : t.collapseSidebar}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            {!collapsed ? <span>{t.collapseSidebar}</span> : null}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex w-full items-center rounded-lg text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
            }`}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {!collapsed ? <span>{isDark ? t.lightMode : t.darkMode}</span> : null}
          </button>
          {!collapsed ? (
            <div
              className={`rounded-lg border px-3 py-2 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{t.signedIn}</p>
              <p className={`truncate text-xs font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {userEmail}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onSignOut}
            className={`flex w-full items-center rounded-lg text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>{t.staffSignOut}</span> : null}
          </button>
        </div>
      </nav>
    </aside>
  );
}
