import { describe, it, expect } from 'vitest';
import { computeWithdrawalFee } from '../../src/services/finance/withdrawalFees';

describe('computeWithdrawalFee', () => {
  it('cashier: 0.5% with no min fee', () => {
    expect(computeWithdrawalFee(500, 'cashier')).toEqual({ rate: 0.005, fee: 2.5 });
    expect(computeWithdrawalFee(50, 'cashier')).toEqual({ rate: 0.005, fee: 0.25 });
  });

  it('abb_atm: 1% with 1 AZN min fee', () => {
    expect(computeWithdrawalFee(500, 'abb_atm')).toEqual({ rate: 0.01, fee: 5 });
    expect(computeWithdrawalFee(50, 'abb_atm')).toEqual({ rate: 0.01, fee: 1 });
    expect(computeWithdrawalFee(80, 'abb_atm')).toEqual({ rate: 0.01, fee: 1 });
  });

  it('handles non-finite amounts as zero', () => {
    expect(computeWithdrawalFee(NaN, 'cashier')).toEqual({ rate: 0.005, fee: 0 });
  });
});
