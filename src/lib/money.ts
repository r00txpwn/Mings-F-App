export const AZN_SYMBOL = '₼';

/** Non-breaking space so amount and currency stay on one line when wrapped. */
const NBSP = '\u00A0';

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toFixed(2);
}

export function formatMoneyWithSymbol(
  value: number | string | null | undefined,
  position: 'prefix' | 'suffix' = 'suffix',
): string {
  const formatted = formatMoney(value);
  return position === 'prefix'
    ? `${AZN_SYMBOL}${NBSP}${formatted}`
    : `${formatted}${NBSP}${AZN_SYMBOL}`;
}

export function formatSignedMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return `0.00${NBSP}${AZN_SYMBOL}`;
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${formatMoney(Math.abs(amount))}${NBSP}${AZN_SYMBOL}`;
}
