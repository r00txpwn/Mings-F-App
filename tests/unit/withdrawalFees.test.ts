import { describe, it, expect } from 'vitest';
import {
  computeWithdrawalFee,
  parseWithdrawalFeeSettingsRow,
  percentInputToRate,
  rateToPercentInput,
} from '../../src/services/finance/withdrawalFees';

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

  it('accepts custom config', () => {
    expect(computeWithdrawalFee(1000, 'cashier', { rate: 0.02, minFee: 0 })).toEqual({
      rate: 0.02,
      fee: 20,
    });
  });

  it('clamps fee so it never exceeds amount', () => {
    // min fee 1 on a 0.50 withdrawal → fee capped at 0.50
    expect(computeWithdrawalFee(0.5, 'abb_atm', { rate: 0.01, minFee: 1 })).toEqual({
      rate: 0.01,
      fee: 0.5,
    });
  });
});

describe('fee settings helpers', () => {
  it('parses settings row with defaults for bad values', () => {
    const parsed = parseWithdrawalFeeSettingsRow({
      bank_rate: 0.02,
      bank_min_fee: 0.5,
      card_rate: 'nope',
      card_min_fee: -3,
    });
    expect(parsed.bank).toEqual({ rate: 0.02, minFee: 0.5 });
    expect(parsed.card.rate).toBe(0.01); // fallback default
    expect(parsed.card.minFee).toBe(1); // fallback default for negative
  });

  it('caps rate at 10%', () => {
    const parsed = parseWithdrawalFeeSettingsRow({
      bank_rate: 0.5,
      bank_min_fee: 0,
      card_rate: 0.01,
      card_min_fee: 1,
    });
    expect(parsed.bank.rate).toBe(0.1);
  });

  it('converts percent input to rate', () => {
    expect(percentInputToRate('0.5')).toBe(0.005);
    expect(percentInputToRate('10')).toBe(0.1);
    expect(percentInputToRate('50')).toBe(0.1); // capped
    expect(rateToPercentInput(0.005)).toBe('0.5');
  });
});
