/**
 * Hostname-based routing for splitting staff vs public surfaces on subdomains.
 * When no env match, callers fall back to pathname routing (localhost, *.vercel.app).
 */

export type HostedSurface = 'admin' | 'order' | 'kiosk' | 'kds' | 'track' | 'pos';

function parseHostList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function hostnameInList(hostname: string, list: string[]): boolean {
  const h = hostname.toLowerCase();
  return list.some((entry) => h === entry);
}

/**
 * Maps current hostname to a surface. Returns null if unset / no match (use path-based routing).
 */
export function resolveHostedSurface(hostname: string): HostedSurface | null {
  const h = hostname.trim().toLowerCase();
  if (!h) return null;

  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_ADMIN_HOSTS))) return 'admin';
  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_ORDER_HOSTS))) return 'order';
  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_KIOSK_HOSTS))) return 'kiosk';
  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_KDS_HOSTS))) return 'kds';
  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_TRACK_HOSTS))) return 'track';
  if (hostnameInList(h, parseHostList(import.meta.env.VITE_SURFACE_POS_HOSTS))) return 'pos';

  return null;
}

/** Full URL customers use to open the online storefront (subdomain root or path-based). */
export function getPublicOrderUrl(): string {
  const configured = (import.meta.env.VITE_PUBLIC_ORDER_URL ?? '').trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/order`;
  }
  return '/order';
}

/** Kiosk preview URL (includes ?key= when VITE_KIOSK_SECRET is set). */
export function getPublicKioskEntryUrl(): string {
  const configured = (import.meta.env.VITE_PUBLIC_KIOSK_URL ?? '').trim().replace(/\/$/, '');
  const secret = (import.meta.env.VITE_KIOSK_SECRET ?? '').trim();
  const qs = secret ? `?key=${encodeURIComponent(secret)}` : '';
  if (configured) {
    return `${configured}${qs}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/kiosk${qs}`;
  }
  return `/kiosk${qs}`;
}
