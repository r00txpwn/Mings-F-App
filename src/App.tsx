import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TooltipProvider } from '@/components/shadcn/tooltip';
import { Skeleton } from '@/components/shadcn/skeleton';
import { HomeScreen } from './screens/HomeScreen';
import { SalesScreen } from './screens/SalesScreen';
import { MoneyScreen } from './screens/MoneyScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { SuppliersScreen } from './screens/SuppliersScreen';
import { UsersScreen } from './screens/UsersScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { StaffScreen } from './screens/StaffScreen';
import { LoginScreen } from './screens/LoginScreen';
import { StaffAccessDeniedScreen } from './screens/StaffAccessDeniedScreen';
import { AdminAccessDeniedScreen } from './screens/AdminAccessDeniedScreen';
import { roleMayAccessCockpit } from './lib/staffRole';
import { MenuScreen } from './screens/MenuScreen';
import { PayoutsScreen } from './screens/PayoutsScreen';
import { DeliveryScreen } from './screens/DeliveryScreen';
import { OrderLocationsScreen } from './screens/OrderLocationsScreen';
import { CombosScreen } from './screens/CombosScreen';
import { AdminOrderSupportScreen } from './screens/AdminOrderSupportScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { CashDebtScreen } from './screens/CashDebtScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import {
  CockpitLayout,
  CockpitHubTabs,
  readCockpitScreenFromUrl,
  screenHasHubTabs,
  writeCockpitScreenToUrl,
  type CockpitScreen,
} from './components/cockpit';

function AppContent() {
  const { t } = useLanguage();
  const { user, loading, signOut, isStaff, isAdminUser, staffRole } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<CockpitScreen>(() => readCockpitScreenFromUrl());

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
    if ((currentScreen === 'users' || currentScreen === 'audit-log') && !isAdminUser) {
      setCurrentScreen('home');
      writeCockpitScreenToUrl('home');
    }
  }, [currentScreen, isAdminUser]);

  if (loading) {
    return (
      <div className="cockpit-app flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 px-6 text-center">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-primary" />
          <Skeleton className="mx-auto h-4 w-40" />
          <p className="text-sm text-muted-foreground">{t.pleaseWait}</p>
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

  // Cockpit is administration-only. `staff`-role users work the floor surfaces
  // (POS / Kiosk / KDS / Order Manager) and are blocked from the cockpit shell.
  if (staffRole && !roleMayAccessCockpit(staffRole)) {
    return <AdminAccessDeniedScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'sales':
        return <SalesScreen />;
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
      case 'payments':
        return <PaymentsScreen />;
      case 'liabilities':
        return <CashDebtScreen />;
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
      case 'staff':
        return <StaffScreen />;
      case 'users':
        return isAdminUser ? <UsersScreen /> : <HomeScreen />;
      case 'audit-log':
        return isAdminUser ? <AuditLogScreen /> : <HomeScreen />;
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
      {screenHasHubTabs(currentScreen) ? (
        <CockpitHubTabs currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      ) : null}
      {renderScreen()}
    </CockpitLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
