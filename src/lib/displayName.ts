/** Matches E2E automation seed rows shown in the cockpit. */
const TEST_RECORD_PATTERN = /^E2E-/i;

export function isTestRecord(name: string | null | undefined): boolean {
  if (!name) return false;
  return TEST_RECORD_PATTERN.test(name.trim());
}

/** Relabel test seed rows for staff-facing UI; pass through real names unchanged. */
export function displayName(
  name: string | null | undefined,
  testLabel = 'Test record',
): string {
  if (!name?.trim()) return '—';
  if (isTestRecord(name)) return testLabel;
  return name.trim();
}
