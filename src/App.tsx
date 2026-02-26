import { useState } from 'react';
import { Home, ShoppingCart, Wallet, BarChart3, Settings, Menu, X, Package, Truck, Users, LogOut, DollarSign, Monitor } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import { KioskOrdersScreen } from './screens/KioskOrdersScreen';

type Screen = 'home' | 'sales' | 'kiosk-orders' | 'money' | 'reports' | 'products' | 'suppliers' | 'expenses' | 'users' | 'settings';

function AppContent() {
  const { t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'sales':
        return <SalesScreen />;
      case 'kiosk-orders':
        return <KioskOrdersScreen />;
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

  const navItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Home className="w-5 h-5" />, label: t.home },
    { id: 'sales', icon: <ShoppingCart className="w-5 h-5" />, label: t.sales },
    { id: 'kiosk-orders', icon: <Monitor className="w-5 h-5" />, label: t.kioskOrders },
    { id: 'products', icon: <Package className="w-5 h-5" />, label: t.products },
    { id: 'suppliers', icon: <Truck className="w-5 h-5" />, label: t.suppliers },
    { id: 'expenses', icon: <DollarSign className="w-5 h-5" />, label: 'Expenses' },
    { id: 'money', icon: <Wallet className="w-5 h-5" />, label: t.money },
    { id: 'reports', icon: <BarChart3 className="w-5 h-5" />, label: t.reports },
    { id: 'users', icon: <Users className="w-5 h-5" />, label: t.users },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: t.more },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen fixed left-0 top-0 z-50
        transform transition-transform duration-200 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 dark:bg-gray-700 p-2.5 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Business</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-3 flex flex-col h-[calc(100vh-100px)]">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  currentScreen === item.id
                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="transition-transform">
                  {item.icon}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-3 px-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="lg:ml-64 flex-1">
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-600 dark:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 dark:bg-gray-700 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">Business Manager</h1>
            </div>
            <div className="w-6" />
          </div>
        </header>

        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderScreen()}
          </div>
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
