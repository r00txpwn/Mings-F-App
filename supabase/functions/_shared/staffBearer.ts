/**
 * Pure Bearer pre-check for staff Edge Functions (no Deno / JWT verify).
 * Rejects missing Authorization and the anon key used as Bearer.
 */

export type StaffBearerOk = { ok: true; token: string };
export type StaffBearerFail = {
  ok: false;
  status: 401;
  code: 'UNAUTHORIZED';
  message: string;
};
export type StaffBearerResult = StaffBearerOk | StaffBearerFail;

/**
 * Wolt Drive create/cancel roles. Matches `wolt-drive-manual-dispatch`
 * (admin|staff only — manager is excluded).
 */
export const WOLT_DRIVE_MUTATION_ROLES = ['admin', 'staff'] as const;

export type WoltDriveMutationRole = (typeof WOLT_DRIVE_MUTATION_ROLES)[number];

export function inspectStaffBearer(
  authorization: string | null | undefined,
  anonKey: string | null | undefined
): StaffBearerResult {
  if (!authorization?.startsWith('Bearer ')) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Missing authorization' };
  }
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Missing authorization' };
  }
  const anon = (anonKey ?? '').trim();
  if (anon && token === anon) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Staff session required' };
  }
  return { ok: true, token };
}

export function staffRoleAllowed(
  role: string | null | undefined,
  allowed: readonly string[]
): boolean {
  return Boolean(role && allowed.includes(role));
}
