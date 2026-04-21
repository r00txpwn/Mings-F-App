/**
 * Staff cockpit (admin) URL path. Default: **`/spec-ops`** (with or without trailing slash in the browser).
 *
 * Override with `VITE_ADMIN_APP_PATH` if you deploy a different path.
 * Security: Supabase Auth + RLS + strong credentials — the path alone is not a secret.
 */

/** Default admin route — `https://your-domain/spec-ops/` */
export const DEFAULT_ADMIN_APP_PATH = '/spec-ops';

export function normalizePathname(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Resolves admin base path (`/spec-ops` unless `VITE_ADMIN_APP_PATH` is set). */
export function getResolvedAdminPath(): string {
  const raw = (import.meta.env.VITE_ADMIN_APP_PATH ?? '').trim();
  if (raw) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  return DEFAULT_ADMIN_APP_PATH;
}

export function isAdminPath(pathname: string): boolean {
  const resolved = getResolvedAdminPath();
  if (!resolved) return false;
  return normalizePathname(pathname) === normalizePathname(resolved);
}

const RESERVED = new Set(['/', '/kiosk', '/kds', '/order', '/track', '/order-manager']);

export function assertAdminPathDoesNotCollide(): void {
  if (!import.meta.env.DEV) return;
  const p = getResolvedAdminPath();
  if (p && RESERVED.has(normalizePathname(p))) {
    console.warn(
      `[admin] VITE_ADMIN_APP_PATH (${p}) conflicts with a public route. Choose another value.`
    );
  }
}
