import { useEffect, useState } from 'react';
import { ClipboardList, History, Loader2, LogOut, UtensilsCrossed } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { parseStaffRole, roleMayUseOrderManagerMenuEditor } from '../lib/staffRole';
import { LoginScreen } from '../screens/LoginScreen';
import { StaffAccessDeniedScreen } from '../screens/StaffAccessDeniedScreen';
import { ActiveOrdersTab } from './ActiveOrdersTab';
import { MenuEditorTab } from './MenuEditorTab';
import { PastOrdersTab } from './PastOrdersTab';
import { KitchenStatusPanel } from './KitchenStatusPanel';

type OrderManagerTab = 'active' | 'past' | 'menu';

function OrderManagerShell() {
  const { t } = useLanguage();
  const { user, isStaff, loading, session, signOut } = useAuth();
  const [tab, setTab] = useState<OrderManagerTab>('active');
  /** Authoritative for this surface: direct `users.role` read (avoids stale auth context between overlapping session applies). */
  const [menuEditorAllowed, setMenuEditorAllowed] = useState(false);

  useEffect(() => {
    if (loading || !user?.id || !isStaff) {
      setMenuEditorAllowed(false);
      return;
    }

    setMenuEditorAllowed(false);
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setMenuEditorAllowed(false);
        return;
      }
      setMenuEditorAllowed(roleMayUseOrderManagerMenuEditor(parseStaffRole(data.role)));
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, isStaff]);

  const canUseMenuEditor = menuEditorAllowed;

  useEffect(() => {
    if (!canUseMenuEditor && tab === 'menu') {
      setTab('active');
    }
  }, [canUseMenuEditor, tab]);

  if (loading) {
    return (
      <div className="neon-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  if (!isStaff) return <StaffAccessDeniedScreen />;

  return (
    <div className="neon-shell flex min-h-screen flex-col text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-bold tracking-wide text-cockpit-200">{t.omTitle}</h1>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.staffSignOut}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 pb-20">
        <KitchenStatusPanel />
        {tab === 'active' ? <ActiveOrdersTab accessToken={session?.access_token ?? null} /> : null}
        {tab === 'past' ? <PastOrdersTab /> : null}
        {tab === 'menu' ? <MenuEditorTab /> : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 p-2 backdrop-blur">
        <div
          className={`mx-auto grid w-full max-w-xl gap-2 ${canUseMenuEditor ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`flex flex-col items-center rounded-lg py-2 text-xs font-semibold ${
              tab === 'active' ? 'bg-cockpit-500/25 text-cockpit-200' : 'text-slate-400'
            }`}
          >
            <ClipboardList className="mb-1 h-4 w-4" />
            {t.omActiveOrders}
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={`flex flex-col items-center rounded-lg py-2 text-xs font-semibold ${
              tab === 'past' ? 'bg-cockpit-500/25 text-cockpit-200' : 'text-slate-400'
            }`}
          >
            <History className="mb-1 h-4 w-4" />
            {t.omPastOrders}
          </button>
          {canUseMenuEditor ? (
            <button
              type="button"
              onClick={() => setTab('menu')}
              className={`flex flex-col items-center rounded-lg py-2 text-xs font-semibold ${
                tab === 'menu' ? 'bg-cockpit-500/25 text-cockpit-200' : 'text-slate-400'
              }`}
            >
              <UtensilsCrossed className="mb-1 h-4 w-4" />
              {t.omMenuEditor}
            </button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

export function OrderManagerApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OrderManagerShell />
          <Analytics />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
