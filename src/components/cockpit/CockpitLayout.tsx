import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/shadcn/sidebar';
import { Separator } from '@/components/shadcn/separator';
import { useLanguage } from '../../contexts/LanguageContext';
import { CockpitSidebar } from './CockpitSidebar';
import {
  hubForScreen,
  navItemForScreen,
  type CockpitScreen,
} from './cockpitNav';
import type { Translations } from '../../translations';

interface CockpitLayoutProps {
  currentScreen: CockpitScreen;
  onNavigate: (screen: CockpitScreen) => void;
  isAdminUser: boolean;
  userEmail?: string | null;
  onSignOut: () => void;
  children: ReactNode;
}

function getScreenTitle(screen: CockpitScreen, t: Translations): string {
  const navItem = navItemForScreen(screen);
  if (navItem) return t[navItem.labelKey];

  const hub = hubForScreen(screen);
  if (hub) return t[hub.labelKey];

  return screen;
}

export function CockpitLayout({
  currentScreen,
  onNavigate,
  isAdminUser,
  userEmail,
  onSignOut,
  children,
}: CockpitLayoutProps) {
  const { t } = useLanguage();
  const screenTitle = getScreenTitle(currentScreen, t);

  return (
    <SidebarProvider className="cockpit-app min-h-svh w-full">
      <CockpitSidebar
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        isAdminUser={isAdminUser}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />
      <SidebarInset className="min-h-svh bg-muted/40">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{screenTitle}</p>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
