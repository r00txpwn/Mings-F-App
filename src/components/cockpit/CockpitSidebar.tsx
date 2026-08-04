import {
  BarChart3,
  Banknote,
  ClipboardList,
  DollarSign,
  Flame,
  Home,
  KanbanSquare,
  LogOut,
  MapPin,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  CreditCard,
  Landmark,
  UserRound,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MingsWordmark } from '../MingsWordmark';
import type { Translations } from '../../translations';
import {
  COCKPIT_HUBS,
  COCKPIT_NAV_ITEMS,
  COCKPIT_NAV_SECTIONS,
  hubForScreen,
  type CockpitHub,
  type CockpitHubId,
  type CockpitNavItem,
  type CockpitNavSection,
  type CockpitScreen,
} from './cockpitNav';

const HUB_ICONS: Record<CockpitHubId, ReactNode> = {
  income: <ShoppingCart className="h-5 w-5 shrink-0" />,
  spending: <DollarSign className="h-5 w-5 shrink-0" />,
  'cash-accounts': <Landmark className="h-5 w-5 shrink-0" />,
  payroll: <UserRound className="h-5 w-5 shrink-0" />,
  insights: <BarChart3 className="h-5 w-5 shrink-0" />,
};

const NAV_ICONS: Record<CockpitScreen, ReactNode> = {
  home: <Home className="h-5 w-5 shrink-0" />,
  'task-master': <KanbanSquare className="h-5 w-5 shrink-0" />,
  sales: <ShoppingCart className="h-5 w-5 shrink-0" />,
  'order-support': <ClipboardList className="h-5 w-5 shrink-0" />,
  delivery: <Truck className="h-5 w-5 shrink-0" />,
  'order-locations': <MapPin className="h-5 w-5 shrink-0" />,
  'menu-builder': <UtensilsCrossed className="h-5 w-5 shrink-0" />,
  combos: <Flame className="h-5 w-5 shrink-0" />,
  products: <Package className="h-5 w-5 shrink-0" />,
  suppliers: <Warehouse className="h-5 w-5 shrink-0" />,
  expenses: <DollarSign className="h-5 w-5 shrink-0" />,
  payouts: <Banknote className="h-5 w-5 shrink-0" />,
  staff: <UserRound className="h-5 w-5 shrink-0" />,
  payments: <CreditCard className="h-5 w-5 shrink-0" />,
  liabilities: <Landmark className="h-5 w-5 shrink-0" />,
  money: <Wallet className="h-5 w-5 shrink-0" />,
  reports: <BarChart3 className="h-5 w-5 shrink-0" />,
  users: <Users className="h-5 w-5 shrink-0" />,
  'audit-log': <ScrollText className="h-5 w-5 shrink-0" />,
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

  const visibleItems = COCKPIT_NAV_ITEMS.filter(
    (item) => !item.hiddenFromNav && (!item.adminOnly || isAdminUser),
  );

  const itemsBySection = COCKPIT_NAV_SECTIONS.reduce<Record<CockpitNavSection, CockpitNavItem[]>>(
    (acc, section) => {
      acc[section] = visibleItems.filter((item) => item.section === section);
      return acc;
    },
    { overview: [], orders: [], catalog: [], finance: [], system: [] },
  );

  const activeHubId = hubForScreen(currentScreen)?.id ?? null;

  const renderNavButton = (
    key: string,
    label: string,
    icon: ReactNode,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={key}
      type="button"
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      onClick={onClick}
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
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-cockpit-500" />
      ) : null}
      <span className={active ? 'text-cockpit-600 dark:text-cockpit-400' : ''}>{icon}</span>
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </button>
  );

  const renderHubButton = (hub: CockpitHub) => {
    const active = activeHubId === hub.id;
    return renderNavButton(
      hub.id,
      t[hub.labelKey],
      HUB_ICONS[hub.id],
      active,
      () => onNavigate(hub.defaultScreen),
    );
  };

  const sidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-[17rem]';

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r transition-all duration-200 ease-out ${sidebarWidth} ${
        isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white shadow-sm'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className={`relative shrink-0 border-b ${collapsed ? 'px-2' : 'px-3'} py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className={`flex w-full items-center justify-center ${collapsed ? 'h-12' : 'h-16'}`}>
          <MingsWordmark
            className={`object-contain ${collapsed ? 'h-8 w-auto max-w-[2.35rem]' : 'h-auto w-full max-w-[10.15rem]'}`}
          />
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
        {COCKPIT_NAV_SECTIONS.map((section) => {
          if (section === 'finance') {
            return (
              <div key={section} className="mb-3">
                {!collapsed ? (
                  <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    {t[SECTION_LABEL_KEYS[section]]}
                  </p>
                ) : null}
                <div className="space-y-0.5">{COCKPIT_HUBS.map(renderHubButton)}</div>
              </div>
            );
          }

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
                {sectionItems.map((item) =>
                  renderNavButton(
                    item.id,
                    t[item.labelKey],
                    NAV_ICONS[item.id],
                    currentScreen === item.id,
                    () => onNavigate(item.id),
                  ),
                )}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={`shrink-0 space-y-1 border-t p-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
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
            title={collapsed ? (isDark ? t.lightMode : t.darkMode) : undefined}
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
          {!collapsed ? (
            <p className="px-3 pt-1 text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-600">
              v{import.meta.env.VITE_APP_VERSION ?? '0.0.0'}
            </p>
          ) : null}
        </div>
    </aside>
  );
}
