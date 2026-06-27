/**
 * Resolve staff QA login from env. Prefer STAFF_*; fall back to ADMIN_* in .env.local.
 * Used by Playwright runners and staging RLS checks — not for production deploy.
 */

/** @returns {string | undefined} */
export function qaStaffEmail() {
  return (
    process.env.STAFF_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'staff@mings.az'
  );
}

/** @returns {string | undefined} */
export function qaStaffPassword() {
  return process.env.STAFF_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim();
}

/** Mirror ADMIN_* → STAFF_* when STAFF_* unset (for Playwright child processes). */
export function applyQaCredentialAliases() {
  if (!process.env.STAFF_EMAIL?.trim() && process.env.ADMIN_EMAIL?.trim()) {
    process.env.STAFF_EMAIL = process.env.ADMIN_EMAIL.trim();
  }
  if (!process.env.STAFF_PASSWORD?.trim() && process.env.ADMIN_PASSWORD?.trim()) {
    process.env.STAFF_PASSWORD = process.env.ADMIN_PASSWORD.trim();
  }
}

/** @returns {boolean} */
export function requireQaStaffPassword(label = 'QA staff login') {
  applyQaCredentialAliases();
  if (!qaStaffPassword()) {
    console.error(
      `${label}: set STAFF_PASSWORD or ADMIN_PASSWORD in .env.local (see .env.example).`,
    );
    return false;
  }
  return true;
}
