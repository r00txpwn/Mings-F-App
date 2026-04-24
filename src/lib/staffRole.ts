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
