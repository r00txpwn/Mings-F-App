export type AppSurface = 'order' | 'sp';

export type StaffScreen =
  | 'home'
  | 'sales'
  | 'kiosk-orders'
  | 'menu-builder'
  | 'combos'
  | 'money'
  | 'reports'
  | 'products'
  | 'suppliers'
  | 'expenses'
  | 'payouts'
  | 'users'
  | 'delivery'
  | 'settings';

export const DEFAULT_STAFF_SCREEN: StaffScreen = 'home';

export const STAFF_SCREEN_PATHS: Record<StaffScreen, string> = {
  home: '/',
  sales: '/sales',
  'kiosk-orders': '/kiosk-orders',
  'menu-builder': '/menu-builder',
  combos: '/combos',
  money: '/money',
  reports: '/reports',
  products: '/products',
  suppliers: '/suppliers',
  expenses: '/expenses',
  payouts: '/payouts',
  users: '/users',
  delivery: '/delivery',
  settings: '/settings',
};

const STAFF_ROUTE_TO_SCREEN = Object.entries(STAFF_SCREEN_PATHS).reduce(
  (acc, [screen, path]) => {
    acc[path] = screen as StaffScreen;
    return acc;
  },
  {} as Record<string, StaffScreen>
);

export function normalizePathname(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getAppSurface(): AppSurface {
  const host = window.location.hostname.toLowerCase();
  if (host.startsWith('order.')) return 'order';
  if (host.startsWith('sp.')) return 'sp';

  const raw = (import.meta.env.VITE_APP_SURFACE ?? '').trim().toLowerCase();
  return raw === 'order' ? 'order' : 'sp';
}

export function readStaffScreenFromPath(pathname: string): StaffScreen | null {
  return STAFF_ROUTE_TO_SCREEN[normalizePathname(pathname)] ?? null;
}

export function isStaffRoutePath(pathname: string): boolean {
  return readStaffScreenFromPath(pathname) !== null;
}

export function getPathForStaffScreen(screen: StaffScreen): string {
  return STAFF_SCREEN_PATHS[screen];
}

export function getOrderAppOrigin(): string {
  const configured = (import.meta.env.VITE_ORDER_APP_ORIGIN ?? '').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith('sp.')) {
    return `${protocol}//order.${hostname.slice(3)}`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

export function getOrderAppUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getOrderAppOrigin()}${normalizedPath}`;
}
