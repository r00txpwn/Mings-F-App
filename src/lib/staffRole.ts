/** Matches `public.users.role` (`user_role` enum). */
export type StaffRole = 'admin' | 'manager' | 'staff';

const STAFF_ROLES: StaffRole[] = ['admin', 'manager', 'staff'];

export function parseStaffRole(value: unknown): StaffRole {
  return STAFF_ROLES.includes(value as StaffRole) ? (value as StaffRole) : 'staff';
}

/** Order Manager Menu Editor is limited to admin/manager (not `staff`). */
export function roleMayUseOrderManagerMenuEditor(role: StaffRole): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Staff cockpit (`/spec-ops`) is administration-only. `staff`-role users work on
 * the floor surfaces (POS / Kiosk / KDS / Order Manager) and are blocked here.
 * Manager access is intentionally broad for now and will be refined later.
 */
export function roleMayAccessCockpit(role: StaffRole): boolean {
  return role === 'admin' || role === 'manager';
}
