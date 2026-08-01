import { roundFinanceMoney } from '../../lib/money';

export type WithdrawalMethod = 'cashier' | 'abb_atm';

export interface WithdrawalFeeConfig {
  rate: number;
  minFee: number;
}

/** Fallback defaults — used when settings row is missing or unloadable. */
export const WITHDRAWAL_FEE_CONFIG: Record<WithdrawalMethod, WithdrawalFeeConfig> = {
  cashier: { rate: 0.005, minFee: 0 },
  abb_atm: { rate: 0.01, minFee: 1 },
};

export const MAX_WITHDRAWAL_FEE_RATE = 0.1;

export interface WithdrawalFeeSettings {
  bank: WithdrawalFeeConfig;
  card: WithdrawalFeeConfig;
}

export interface WithdrawalFeeResult {
  rate: number;
  fee: number;
}

export function defaultWithdrawalFeeSettings(): WithdrawalFeeSettings {
  return {
    bank: { ...WITHDRAWAL_FEE_CONFIG.cashier },
    card: { ...WITHDRAWAL_FEE_CONFIG.abb_atm },
  };
}

export function configForMethod(
  settings: WithdrawalFeeSettings,
  method: WithdrawalMethod,
): WithdrawalFeeConfig {
  return method === 'abb_atm' ? settings.card : settings.bank;
}

/**
 * Fee = round3(min(max(amount × rate, minFee), amount)).
 * Never exceeds the withdrawal amount (avoids negative cash-in).
 */
export function computeWithdrawalFee(
  amount: number,
  method: WithdrawalMethod,
  config?: WithdrawalFeeConfig,
): WithdrawalFeeResult {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const resolved = config ?? WITHDRAWAL_FEE_CONFIG[method];
  const rate = Number.isFinite(resolved.rate) ? Math.max(0, resolved.rate) : 0;
  const minFee = Number.isFinite(resolved.minFee) ? Math.max(0, resolved.minFee) : 0;
  const rawFee = safeAmount * rate;
  const fee = roundFinanceMoney(Math.min(Math.max(rawFee, minFee), safeAmount));
  return { rate, fee };
}

function sanitizeRate(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, MAX_WITHDRAWAL_FEE_RATE);
}

function sanitizeMinFee(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export function parseWithdrawalFeeSettingsRow(row: {
  bank_rate?: number | string | null;
  bank_min_fee?: number | string | null;
  card_rate?: number | string | null;
  card_min_fee?: number | string | null;
} | null | undefined): WithdrawalFeeSettings {
  const defaults = defaultWithdrawalFeeSettings();
  if (!row) return defaults;
  return {
    bank: {
      rate: sanitizeRate(row.bank_rate, defaults.bank.rate),
      minFee: sanitizeMinFee(row.bank_min_fee, defaults.bank.minFee),
    },
    card: {
      rate: sanitizeRate(row.card_rate, defaults.card.rate),
      minFee: sanitizeMinFee(row.card_min_fee, defaults.card.minFee),
    },
  };
}

/** Rate as percent string for UI (e.g. 0.005 → "0.5"). */
export function rateToPercentInput(rate: number): string {
  const pct = rate * 100;
  return Number.isFinite(pct) ? String(Number(pct.toFixed(4))) : '0';
}

/** Percent input → fraction (e.g. "0.5" → 0.005). Clamped to [0, 10%]. */
export function percentInputToRate(percent: string): number {
  const n = Number(percent);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n / 100, MAX_WITHDRAWAL_FEE_RATE);
}
