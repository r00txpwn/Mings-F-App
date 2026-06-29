export type WithdrawalMethod = 'cashier' | 'abb_atm';

export interface WithdrawalFeeConfig {
  rate: number;
  minFee: number;
}

export const WITHDRAWAL_FEE_CONFIG: Record<WithdrawalMethod, WithdrawalFeeConfig> = {
  cashier: { rate: 0.005, minFee: 0 },
  abb_atm: { rate: 0.01, minFee: 1 },
};

export interface WithdrawalFeeResult {
  rate: number;
  fee: number;
}

export function computeWithdrawalFee(amount: number, method: WithdrawalMethod): WithdrawalFeeResult {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const config = WITHDRAWAL_FEE_CONFIG[method];
  const rawFee = safeAmount * config.rate;
  const fee = Math.max(rawFee, config.minFee);
  return { rate: config.rate, fee: Math.round(fee * 100) / 100 };
}
