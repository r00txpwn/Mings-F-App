import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
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
import { OrderLocationsScreen } from './screens/OrderLocationsScreen';
import { CombosScreen } from './screens/CombosScreen';
import { AdminOrderSupportScreen } from './screens/AdminOrderSupportScreen';
import {
  CockpitLayout,
  readCockpitScreenFromUrl,
  writeCockpitScreenToUrl,
  type CockpitScreen,
} from './components/cockpit';

function AppContent() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user, loading, signOut, isStaff, isAdminUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<CockpitScreen>(() => readCockpitScreenFromUrl());
  const isDark = theme === 'dark';

  useEffect(() => {
    const onPopState = () => {
      setCurrentScreen(readCockpitScreenFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const inUrl = readCockpitScreenFromUrl();
    if (inUrl !== currentScreen) {
      writeCockpitScreenToUrl(currentScreen);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 'users' && !isAdminUser) {
      setCurrentScreen('home');
      writeCockpitScreenToUrl('home');
    }
  }, [currentScreen, isAdminUser]);

  if (loading) {
    return (
      <div
        className={`cockpit-app min-h-screen flex items-center justify-center font-sans ${
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
      case 'order-locations':
        return <OrderLocationsScreen />;
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
        return isAdminUser ? <UsersScreen /> : <HomeScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <CockpitLayout
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      isAdminUser={isAdminUser}
      userEmail={user?.email}
      onSignOut={() => void signOut()}
    >
      {renderScreen()}
    </CockpitLayout>
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
