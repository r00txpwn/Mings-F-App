import { formatMoney } from '../lib/money';

/** Wireframe price copy: `8.00 AZN` (ISO code, not ₼). Menu + item only. */
export function formatStorefrontAzn(value: number | string | null | undefined): string {
  return `${formatMoney(value)} AZN`;
}

export function formatStorefrontAznDelta(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return '';
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${formatMoney(Math.abs(amount))} AZN`;
}
