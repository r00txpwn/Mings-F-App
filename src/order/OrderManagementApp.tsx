import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { StaffAccessDeniedScreen } from '../screens/StaffAccessDeniedScreen';
import { KioskOrdersScreen } from '../screens/KioskOrdersScreen';

export function OrderManagementApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OrderManagementInner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function OrderManagementInner() {
  const { user, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cockpit-bg flex items-center justify-center">
        <div className="text-cockpit-muted text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  if (!isStaff) return <StaffAccessDeniedScreen />;

  return <KioskOrdersScreen />;
}
