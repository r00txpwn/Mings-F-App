export const AZN_SYMBOL = '₼';

/** Decimal places for cockpit finance amounts (expenses, payroll, cash, etc.). */
export const FINANCE_DECIMALS = 3;

/** HTML step for cockpit finance amount inputs. */
export const FINANCE_AMOUNT_STEP = '0.001';

/** Non-breaking space so amount and currency stay on one line when wrapped. */
const NBSP = '\u00A0';

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '0.00';
  return amount.toFixed(2);
}

/** Format cockpit finance amounts with 3 decimal places. */
export function formatFinanceMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return `0.${'0'.repeat(FINANCE_DECIMALS)}`;
  return amount.toFixed(FINANCE_DECIMALS);
}

/** Round to finance precision (3 dp). */
export function roundFinanceMoney(value: number): number {
  const factor = 10 ** FINANCE_DECIMALS;
  return Math.round(value * factor) / factor;
}

export function formatFinanceMoneyWithSymbol(
  value: number | string | null | undefined,
  position: 'prefix' | 'suffix' = 'suffix',
): string {
  const formatted = formatFinanceMoney(value);
  return position === 'prefix'
    ? `${AZN_SYMBOL}${NBSP}${formatted}`
    : `${formatted}${NBSP}${AZN_SYMBOL}`;
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
