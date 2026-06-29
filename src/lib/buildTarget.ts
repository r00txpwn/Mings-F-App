/** Which SPA bundle is being built or served (`staff` | `storefront`). */
export type BuildTarget = 'staff' | 'storefront';

export function getBuildTarget(): BuildTarget {
  const raw = (import.meta.env.VITE_BUILD_TARGET ?? 'staff').trim().toLowerCase();
  return raw === 'storefront' ? 'storefront' : 'staff';
}

export function isStaffBuild(): boolean {
  return getBuildTarget() === 'staff';
}

export function isStorefrontBuild(): boolean {
  return getBuildTarget() === 'storefront';
}

export function getAuthStorageKey(): string {
  return isStorefrontBuild() ? 'mings-storefront-auth' : 'mings-staff-auth';
}
