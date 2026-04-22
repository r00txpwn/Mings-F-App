import { useEffect, useState, type ReactNode } from 'react';
import {
  Home,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
  Package,
  Truck,
  Users,
  LogOut,
  DollarSign,
  Monitor,
  UtensilsCrossed,
  Banknote,
  Moon,
  Sun,
  Activity,
  ClipboardList,
  Flame,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomeScreen } from './screens/HomeScreen';
import { SalesScreen } from './screens/SalesScreen';
import { MoneyScreen } from './screens/MoneyScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { SuppliersScreen } from './screens/SuppliersScreen';
import { UsersScreen } from './screens/UsersScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { LoginScreen } from './screens/LoginScreen';
import { StaffAccessDeniedScreen } from './screens/StaffAccessDeniedScreen';
import { KioskOrdersScreen } from './screens/KioskOrdersScreen';
import { MenuScreen } from './screens/MenuScreen';
import { PayoutsScreen } from './screens/PayoutsScreen';
import { DeliveryScreen } from './screens/DeliveryScreen';
import { CombosScreen } from './screens/CombosScreen';
import { AdminOrderSupportScreen } from './screens/AdminOrderSupportScreen';
import { MingsWordmark } from './components/MingsWordmark';
import { normalizePathname } from './lib/adminPath';

type Screen =
  | 'home'
  | 'sales'
  | 'kiosk-orders'
  | 'order-support'
  | 'delivery'
  | 'menu-builder'
  | 'combos'
  | 'money'
  | 'reports'
  | 'products'
  | 'suppliers'
  | 'expenses'
  | 'payouts'
  | 'users'
  | 'settings';

const SCREEN_QUERY_KEY = 'screen';
const DEFAULT_SCREEN: Screen = 'home';
const ORDER_MANAGER_PATH = '/order-manager';
const ALL_SCREENS: Screen[] = [
  'home',
  'sales',
  'kiosk-orders',
  'order-support',
  'delivery',
  'menu-builder',
  'combos',
  'money',
  'reports',
  'products',
  'suppliers',
  'expenses',
  'payouts',
  'users',
  'settings',
];

function isScreen(value: string | null): value is Screen {
  return Boolean(value) && ALL_SCREENS.includes(value as Screen);
}

type CockpitNavItem = { id: Screen; icon: ReactNode; label: string };

function screenNavItem(
  id: Screen,
  icon: ReactNode,
  label: string
): CockpitNavItem {
  return { id, icon, label };
}

function readScreenFromUrl(): Screen {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(SCREEN_QUERY_KEY);
  if (isScreen(raw)) return raw;
  const p = normalizePathname(window.location.pathname);
  return p === ORDER_MANAGER_PATH || p === '/order-management' ? 'kiosk-orders' : DEFAULT_SCREEN;
}

function writeScreenToUrl(screen: Screen) {
  const params = new URLSearchParams(window.location.search);
  params.set(SCREEN_QUERY_KEY, screen);
  const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.pushState({}, '', next);
}

function AppContent() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut, isStaff } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => readScreenFromUrl());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const onPopState = () => {
      setCurrentScreen(readScreenFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const inUrl = readScreenFromUrl();
    if (inUrl !== currentScreen) {
      writeScreenToUrl(currentScreen);
    }
  }, [currentScreen]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-sans ${
          isDark ? 'neon-shell text-slate-100' : 'cockpit-bg-light text-slate-900'
        }`}
      >
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-cockpit-500/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cockpit-400 border-r-cockpit-500/50" />
            <Activity className="absolute inset-0 m-auto h-6 w-6 text-cockpit-400" />
          </div>
          <p className="text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
            {t.pleaseWait}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!isStaff) {
    return <StaffAccessDeniedScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'kiosk-orders':
        return <KioskOrdersScreen />;
      case 'order-support':
        return <AdminOrderSupportScreen />;
      case 'delivery':
        return <DeliveryScreen />;
      case 'menu-builder':
        return <MenuScreen />;
      case 'combos':
        return <CombosScreen />;
      case 'money':
        return <MoneyScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'suppliers':
        return <SuppliersScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'payouts':
        return <PayoutsScreen />;
      case 'users':
        return <UsersScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const handleNavClick = (screen: Screen) => {
    setCurrentScreen(screen);
    setIsMobileMenuOpen(false);
  };

  const fullNavItems: CockpitNavItem[] = [
    screenNavItem('home', <Home className="h-5 w-5 shrink-0" />, t.home),
    screenNavItem('sales', <ShoppingCart className="h-5 w-5 shrink-0" />, t.sales),
    screenNavItem('kiosk-orders', <Monitor className="h-5 w-5 shrink-0" />, t.kioskOrders),
    screenNavItem('order-support', <ClipboardList className="h-5 w-5 shrink-0" />, t.orderSupport),
    screenNavItem('delivery', <Truck className="h-5 w-5 shrink-0" />, t.deliveryScreenTitle),
    screenNavItem('menu-builder', <UtensilsCrossed className="h-5 w-5 shrink-0" />, t.menuBuilder),
    screenNavItem('combos', <Flame className="h-5 w-5 shrink-0" />, t.combosScreenTitle),
    screenNavItem('products', <Package className="h-5 w-5 shrink-0" />, t.products),
    screenNavItem('suppliers', <Truck className="h-5 w-5 shrink-0" />, t.suppliers),
    screenNavItem('expenses', <DollarSign className="h-5 w-5 shrink-0" />, t.expenses),
    screenNavItem('payouts', <Banknote className="h-5 w-5 shrink-0" />, t.payouts),
    screenNavItem('money', <Wallet className="h-5 w-5 shrink-0" />, t.money),
    screenNavItem('reports', <BarChart3 className="h-5 w-5 shrink-0" />, t.reports),
    screenNavItem('users', <Users className="h-5 w-5 shrink-0" />, t.users),
    screenNavItem('settings', <Settings className="h-5 w-5 shrink-0" />, t.more),
  ];

  const navItems: CockpitNavItem[] = fullNavItems;

  return (
    <div
      className={`min-h-screen font-sans transition-colors ${
        isDark ? 'neon-shell text-slate-100' : 'cockpit-bg-light text-slate-900'
      }`}
    >
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`
        fixed left-0 top-0 z-50 flex min-h-screen w-[17rem] flex-col border-r transition-transform duration-200 ease-out
        ${isDark ? 'border-violet-500/20 bg-slate-950/90 shadow-neon backdrop-blur-xl' : 'border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div
          className={`border-b px-5 py-5 ${isDark ? 'border-white/5' : 'border-slate-100'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-cockpit-500 to-cockpit-700 shadow-lg shadow-cockpit-500/25'
                    : 'bg-slate-900 text-white shadow-lg'
                }`}
              >
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cockpit-500 dark:text-cockpit-400">
                  Ops
                </p>
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {t.commandCenter}
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    active
                      ? isDark
                        ? 'bg-violet-500/20 text-white shadow-inner ring-1 ring-violet-400/35'
                        : 'bg-slate-900 text-white shadow-md'
                      : isDark
                        ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <span
                      className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${
                        isDark ? 'bg-violet-400 shadow-[0_0_14px_rgba(139,92,246,0.7)]' : 'bg-cockpit-500'
                      }`}
                    />
                  )}
                  <span
                    className={
                      active
                        ? isDark
                          ? 'text-violet-200'
                          : 'text-white'
                        : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className={`mt-auto space-y-2 border-t pt-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isDark
                  ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDark ? t.lightMode : t.darkMode}
            </button>
            <div
              className={`rounded-lg border px-3 py-2 ${
                isDark
                  ? 'border-white/10 bg-slate-900/80'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{t.signedIn}</p>
              <p
                className={`truncate text-xs font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
              >
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {t.staffSignOut}
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[17rem]">
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md lg:hidden ${
            isDark ? 'border-white/5 bg-slate-950/80' : 'border-slate-200 bg-white/90'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex min-w-0 max-w-[min(200px,55vw)] items-center gap-2">
              <div className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-black px-2 py-1 shadow-md ring-1 ring-white/10">
                <MingsWordmark className="h-6 w-auto max-w-[100px] object-contain" />
              </div>
              <span className="min-w-0 truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {t.commandCenter}
              </span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1600px]">{renderScreen()}</div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
