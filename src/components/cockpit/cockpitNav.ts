export type CockpitScreen =
  | 'home'
  | 'task-master'
  | 'sales'
  | 'order-support'
  | 'delivery'
  | 'order-locations'
  | 'menu-builder'
  | 'combos'
  | 'money'
  | 'payments'
  | 'liabilities'
  | 'reports'
  | 'products'
  | 'suppliers'
  | 'expenses'
  | 'payouts'
  | 'staff'
  | 'users'
  | 'audit-log'
  | 'settings';

export const COCKPIT_SCREEN_QUERY_KEY = 'screen';
export const COCKPIT_DEFAULT_SCREEN: CockpitScreen = 'home';

export const ALL_COCKPIT_SCREENS: CockpitScreen[] = [
  'home',
  'task-master',
  'sales',
  'order-support',
  'delivery',
  'order-locations',
  'menu-builder',
  'combos',
  'money',
  'payments',
  'liabilities',
  'reports',
  'products',
  'suppliers',
  'expenses',
  'payouts',
  'staff',
  'users',
  'audit-log',
  'settings',
];

export type CockpitNavSection = 'overview' | 'orders' | 'catalog' | 'finance' | 'system';

export interface CockpitNavItem {
  id: CockpitScreen;
  section: CockpitNavSection;
  labelKey:
    | 'home'
    | 'taskMaster'
    | 'sales'
    | 'orderSupport'
    | 'deliveryScreenTitle'
    | 'orderLocations'
    | 'menuBuilder'
    | 'combosScreenTitle'
    | 'products'
    | 'suppliers'
    | 'expenses'
    | 'payouts'
    | 'staff'
    | 'money'
    | 'payments'
    | 'cashDebt'
    | 'reports'
    | 'users'
    | 'auditLog'
    | 'settings';
  adminOnly?: boolean;
  /** Screen remains routable via `?screen=` but is omitted from the sidebar. */
  hiddenFromNav?: boolean;
}

export const COCKPIT_NAV_ITEMS: CockpitNavItem[] = [
  { id: 'home', section: 'overview', labelKey: 'home' },
  { id: 'task-master', section: 'overview', labelKey: 'taskMaster' },
  { id: 'order-support', section: 'orders', labelKey: 'orderSupport' },
  { id: 'delivery', section: 'orders', labelKey: 'deliveryScreenTitle' },
  { id: 'order-locations', section: 'orders', labelKey: 'orderLocations' },
  { id: 'menu-builder', section: 'catalog', labelKey: 'menuBuilder' },
  { id: 'combos', section: 'catalog', labelKey: 'combosScreenTitle' },
  { id: 'products', section: 'catalog', labelKey: 'products', hiddenFromNav: true },
  { id: 'suppliers', section: 'finance', labelKey: 'suppliers', hiddenFromNav: true },
  { id: 'sales', section: 'finance', labelKey: 'sales', hiddenFromNav: true },
  { id: 'payments', section: 'finance', labelKey: 'payments', hiddenFromNav: true },
  { id: 'liabilities', section: 'finance', labelKey: 'cashDebt', hiddenFromNav: true },
  { id: 'money', section: 'finance', labelKey: 'money', hiddenFromNav: true },
  { id: 'expenses', section: 'finance', labelKey: 'expenses', hiddenFromNav: true },
  { id: 'payouts', section: 'finance', labelKey: 'payouts', hiddenFromNav: true },
  { id: 'staff', section: 'finance', labelKey: 'staff', hiddenFromNav: true },
  { id: 'reports', section: 'finance', labelKey: 'reports', hiddenFromNav: true },
  { id: 'users', section: 'system', labelKey: 'users', adminOnly: true },
  { id: 'audit-log', section: 'system', labelKey: 'auditLog', adminOnly: true },
  { id: 'settings', section: 'system', labelKey: 'settings' },
];

export const COCKPIT_NAV_SECTIONS: CockpitNavSection[] = [
  'overview',
  'orders',
  'catalog',
  'finance',
  'system',
];

/** Finance sidebar hubs — member screen ids are unchanged for ?screen= deep links. */
export type CockpitHubId = 'income' | 'spending' | 'cash-accounts' | 'payroll' | 'insights';

export interface CockpitHub {
  id: CockpitHubId;
  labelKey: 'navHubIncome' | 'navHubSpending' | 'navHubCashAccounts' | 'navHubPayroll' | 'navHubInsights';
  defaultScreen: CockpitScreen;
  members: CockpitScreen[];
}

export const COCKPIT_HUBS: CockpitHub[] = [
  {
    id: 'income',
    labelKey: 'navHubIncome',
    defaultScreen: 'sales',
    members: ['sales', 'payments', 'payouts'],
  },
  {
    id: 'spending',
    labelKey: 'navHubSpending',
    defaultScreen: 'expenses',
    members: ['expenses', 'suppliers'],
  },
  {
    id: 'cash-accounts',
    labelKey: 'navHubCashAccounts',
    defaultScreen: 'liabilities',
    members: ['liabilities'],
  },
  {
    id: 'payroll',
    labelKey: 'navHubPayroll',
    defaultScreen: 'staff',
    members: ['staff'],
  },
  {
    id: 'insights',
    labelKey: 'navHubInsights',
    defaultScreen: 'money',
    members: ['money', 'reports'],
  },
];

const HUB_BY_MEMBER = new Map<CockpitScreen, CockpitHub>(
  COCKPIT_HUBS.flatMap((hub) => hub.members.map((member) => [member, hub] as const)),
);

export function hubForScreen(screen: CockpitScreen): CockpitHub | null {
  return HUB_BY_MEMBER.get(screen) ?? null;
}

export function hubMembers(hubId: CockpitHubId): CockpitScreen[] {
  return COCKPIT_HUBS.find((hub) => hub.id === hubId)?.members ?? [];
}

export function navItemForScreen(screen: CockpitScreen): CockpitNavItem | undefined {
  return COCKPIT_NAV_ITEMS.find((item) => item.id === screen);
}

/** True when the current screen belongs to a multi-tab finance hub. */
export function screenHasHubTabs(screen: CockpitScreen): boolean {
  const hub = hubForScreen(screen);
  return Boolean(hub && hub.members.length > 1);
}

export function isCockpitScreen(value: string | null): value is CockpitScreen {
  return Boolean(value) && ALL_COCKPIT_SCREENS.includes(value as CockpitScreen);
}

/** Removed/renamed screens kept as redirects so old bookmarks/deep links still resolve. */
const LEGACY_SCREEN_ALIASES: Record<string, CockpitScreen> = {
  // Kiosk Orders was merged into Order Support (same orders, broader view).
  'kiosk-orders': 'order-support',
  // Taxes module removed — track tax as operational expenses; payroll lives on Staff.
  taxes: 'staff',
};

export function readCockpitScreenFromUrl(): CockpitScreen {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(COCKPIT_SCREEN_QUERY_KEY);
  if (isCockpitScreen(raw)) return raw;
  if (raw && LEGACY_SCREEN_ALIASES[raw]) return LEGACY_SCREEN_ALIASES[raw];
  return COCKPIT_DEFAULT_SCREEN;
}

export function writeCockpitScreenToUrl(screen: CockpitScreen) {
  const params = new URLSearchParams(window.location.search);
  params.set(COCKPIT_SCREEN_QUERY_KEY, screen);
  const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.pushState({}, '', next);
}

export function navigateCockpitScreen(screen: CockpitScreen) {
  writeCockpitScreenToUrl(screen);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
