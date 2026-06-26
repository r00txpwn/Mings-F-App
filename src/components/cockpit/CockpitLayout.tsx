import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { MingsWordmark } from '../MingsWordmark';
import { CockpitSidebar } from './CockpitSidebar';
import type { CockpitScreen } from './cockpitNav';

interface CockpitLayoutProps {
  currentScreen: CockpitScreen;
  onNavigate: (screen: CockpitScreen) => void;
  isAdminUser: boolean;
  userEmail?: string | null;
  onSignOut: () => void;
  children: ReactNode;
}

export function CockpitLayout({
  currentScreen,
  onNavigate,
  isAdminUser,
  userEmail,
  onSignOut,
  children,
}: CockpitLayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mainOffset = sidebarCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[17rem]';

  return (
    <div
      className={`cockpit-app min-h-screen font-sans transition-colors ${
        isDark ? 'neon-shell text-slate-100' : 'cockpit-bg-light text-slate-900'
      }`}
    >
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      ) : null}

      <CockpitSidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          onNavigate(screen);
          setIsMobileMenuOpen(false);
        }}
        isAdminUser={isAdminUser}
        userEmail={userEmail}
        onSignOut={onSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-200 ${mainOffset}`}>
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md lg:hidden ${
            isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-white/90'
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
            <div className="flex min-w-0 max-w-[min(200px,55vw)] items-center justify-center">
              <div className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-black px-2 py-1 shadow-sm ring-1 ring-white/10">
                <MingsWordmark className="h-6 w-auto max-w-[120px] object-contain" />
              </div>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
