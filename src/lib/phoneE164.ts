/**
 * Normalize user input to E.164 for Supabase Phone Auth (Twilio SMS).
 * Accepts values like "+994501234567", "994501234567", "050 123 45 67" (AZ mobile → +994…).
 */
export function normalizePhoneE164(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const s = trimmed.replace(/[\s()-]/g, '');
  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  const digits = s.replace(/\D/g, '');
  if (!digits) return '';

  // Azerbaijan: 9 digits after leading 0 → +994XXXXXXXXX
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+994${digits.slice(1)}`;
  }
  if (digits.length === 9 && !digits.startsWith('994')) {
    return `+994${digits}`;
  }

  return `+${digits}`;
}

export function isLikelyE164(phone: string): boolean {
  const n = normalizePhoneE164(phone);
  return n.length >= 10 && n.startsWith('+');
}

/** Display/storage: same normalization as auth and SMS (empty stays empty). */
export function formatPhoneDisplayE164(raw: string | null | undefined): string {
  return normalizePhoneE164((raw ?? '').trim());
}
