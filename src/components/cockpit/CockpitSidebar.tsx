import {
  BarChart3,
  Banknote,
  ClipboardList,
  DollarSign,
  Flame,
  Home,
  LogOut,
  MapPin,
  Moon,
  Package,
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
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MingsWordmark } from '../MingsWordmark';
import type { Translations } from '../../translations';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/shadcn/sidebar';
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
  income: <ShoppingCart className="h-4 w-4 shrink-0" />,
  spending: <DollarSign className="h-4 w-4 shrink-0" />,
  'cash-accounts': <Landmark className="h-4 w-4 shrink-0" />,
  payroll: <UserRound className="h-4 w-4 shrink-0" />,
  insights: <BarChart3 className="h-4 w-4 shrink-0" />,
};

const NAV_ICONS: Record<CockpitScreen, ReactNode> = {
  home: <Home className="h-4 w-4 shrink-0" />,
  sales: <ShoppingCart className="h-4 w-4 shrink-0" />,
  'order-support': <ClipboardList className="h-4 w-4 shrink-0" />,
  delivery: <Truck className="h-4 w-4 shrink-0" />,
  'order-locations': <MapPin className="h-4 w-4 shrink-0" />,
  'menu-builder': <UtensilsCrossed className="h-4 w-4 shrink-0" />,
  combos: <Flame className="h-4 w-4 shrink-0" />,
  products: <Package className="h-4 w-4 shrink-0" />,
  suppliers: <Warehouse className="h-4 w-4 shrink-0" />,
  expenses: <DollarSign className="h-4 w-4 shrink-0" />,
  payouts: <Banknote className="h-4 w-4 shrink-0" />,
  staff: <UserRound className="h-4 w-4 shrink-0" />,
  payments: <CreditCard className="h-4 w-4 shrink-0" />,
  liabilities: <Landmark className="h-4 w-4 shrink-0" />,
  money: <Wallet className="h-4 w-4 shrink-0" />,
  reports: <BarChart3 className="h-4 w-4 shrink-0" />,
  users: <Users className="h-4 w-4 shrink-0" />,
  'audit-log': <ScrollText className="h-4 w-4 shrink-0" />,
  settings: <Settings className="h-4 w-4 shrink-0" />,
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
}

export function CockpitSidebar({
  currentScreen,
  onNavigate,
  isAdminUser,
  userEmail,
  onSignOut,
}: CockpitSidebarProps) {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { setOpenMobile } = useSidebar();
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

  const navigate = (screen: CockpitScreen) => {
    onNavigate(screen);
    setOpenMobile(false);
  };

  const renderHubButton = (hub: CockpitHub) => (
    <SidebarMenuItem key={hub.id}>
      <SidebarMenuButton
        isActive={activeHubId === hub.id}
        tooltip={t[hub.labelKey]}
        onClick={() => navigate(hub.defaultScreen)}
      >
        {HUB_ICONS[hub.id]}
        <span>{t[hub.labelKey]}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center justify-center px-2 group-data-[collapsible=icon]:px-0">
          <MingsWordmark className="h-8 w-auto max-w-[9.5rem] object-contain group-data-[collapsible=icon]:max-w-[2rem]" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {COCKPIT_NAV_SECTIONS.map((section) => {
          if (section === 'finance') {
            return (
              <SidebarGroup key={section}>
                <SidebarGroupLabel>{t[SECTION_LABEL_KEYS[section]]}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{COCKPIT_HUBS.map(renderHubButton)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          const sectionItems = itemsBySection[section];
          if (sectionItems.length === 0) return null;

          return (
            <SidebarGroup key={section}>
              <SidebarGroupLabel>{t[SECTION_LABEL_KEYS[section]]}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sectionItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={currentScreen === item.id}
                        tooltip={t[item.labelKey]}
                        onClick={() => navigate(item.id)}
                      >
                        {NAV_ICONS[item.id]}
                        <span>{t[item.labelKey]}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDark ? t.lightMode : t.darkMode}
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? t.lightMode : t.darkMode}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {userEmail ? (
          <div className="mx-2 mb-1 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t.signedIn}</p>
            <p className="truncate text-xs font-medium text-sidebar-foreground">{userEmail}</p>
          </div>
        ) : null}

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t.staffSignOut}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>{t.staffSignOut}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
