export type CockpitScreen =
  | 'home'
  | 'sales'
  | 'kiosk-orders'
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
  | 'users'
  | 'settings';

export const COCKPIT_SCREEN_QUERY_KEY = 'screen';
export const COCKPIT_DEFAULT_SCREEN: CockpitScreen = 'home';

export const ALL_COCKPIT_SCREENS: CockpitScreen[] = [
  'home',
  'sales',
  'kiosk-orders',
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
  'users',
  'settings',
];

export type CockpitNavSection = 'overview' | 'orders' | 'catalog' | 'finance' | 'system';

export interface CockpitNavItem {
  id: CockpitScreen;
  section: CockpitNavSection;
  labelKey:
    | 'home'
    | 'sales'
    | 'kioskOrders'
    | 'orderSupport'
    | 'deliveryScreenTitle'
    | 'orderLocations'
    | 'menuBuilder'
    | 'combosScreenTitle'
    | 'products'
    | 'suppliers'
    | 'expenses'
    | 'payouts'
    | 'money'
    | 'payments'
    | 'cashDebt'
    | 'reports'
    | 'users'
    | 'settings';
  adminOnly?: boolean;
}

export const COCKPIT_NAV_ITEMS: CockpitNavItem[] = [
  { id: 'home', section: 'overview', labelKey: 'home' },
  { id: 'order-support', section: 'orders', labelKey: 'orderSupport' },
  { id: 'kiosk-orders', section: 'orders', labelKey: 'kioskOrders' },
  { id: 'delivery', section: 'orders', labelKey: 'deliveryScreenTitle' },
  { id: 'order-locations', section: 'orders', labelKey: 'orderLocations' },
  { id: 'menu-builder', section: 'catalog', labelKey: 'menuBuilder' },
  { id: 'combos', section: 'catalog', labelKey: 'combosScreenTitle' },
  { id: 'products', section: 'catalog', labelKey: 'products' },
  { id: 'suppliers', section: 'catalog', labelKey: 'suppliers' },
  { id: 'sales', section: 'finance', labelKey: 'sales' },
  { id: 'payments', section: 'finance', labelKey: 'payments' },
  { id: 'liabilities', section: 'finance', labelKey: 'cashDebt' },
  { id: 'money', section: 'finance', labelKey: 'money' },
  { id: 'expenses', section: 'finance', labelKey: 'expenses' },
  { id: 'payouts', section: 'finance', labelKey: 'payouts' },
  { id: 'reports', section: 'finance', labelKey: 'reports' },
  { id: 'users', section: 'system', labelKey: 'users', adminOnly: true },
  { id: 'settings', section: 'system', labelKey: 'settings' },
];

export const COCKPIT_NAV_SECTIONS: CockpitNavSection[] = [
  'overview',
  'orders',
  'catalog',
  'finance',
  'system',
];

export function isCockpitScreen(value: string | null): value is CockpitScreen {
  return Boolean(value) && ALL_COCKPIT_SCREENS.includes(value as CockpitScreen);
}

export function readCockpitScreenFromUrl(): CockpitScreen {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(COCKPIT_SCREEN_QUERY_KEY);
  if (isCockpitScreen(raw)) return raw;
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
