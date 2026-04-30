export type CustomerFullNameValidation =
  | { valid: true; normalized: string }
  | { valid: false; reason: 'required' | 'invalid' };

export function normalizeCustomerFullName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function getCustomerFullNameValidation(value: string): CustomerFullNameValidation {
  const normalized = normalizeCustomerFullName(value);
  if (normalized.length < 2) return { valid: false, reason: 'required' };
  if (normalized.length > 80 || /^[\d\s()+\-.,]+$/.test(normalized)) {
    return { valid: false, reason: 'invalid' };
  }
  return { valid: true, normalized };
}

export function toCustomerFullNamePatch(
  nextValue: string,
  currentValue: string | null | undefined
): { full_name: string } | null {
  const validation = getCustomerFullNameValidation(nextValue);
  if (!validation.valid) return null;
  const current = normalizeCustomerFullName(currentValue ?? '');
  if (current === validation.normalized) return null;
  return { full_name: validation.normalized };
}
