export const AZN_SYMBOL = '₼';

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
  return position === 'prefix' ? `${AZN_SYMBOL}${formatted}` : `${formatted} ${AZN_SYMBOL}`;
}

export function formatSignedMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return `${AZN_SYMBOL}0.00`;
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${AZN_SYMBOL}${formatMoney(Math.abs(amount))}`;
}
