import { describe, expect, it } from 'vitest';
import { extractConfirmedStatus } from '../../supabase/functions/_shared/unitedPayment.ts';

describe('extractConfirmedStatus', () => {
  it('uses isSuccess from detailed CheckStatus response', () => {
    const status = extractConfirmedStatus({
      ok: true,
      status: 'Pending',
      raw: {
        status: 'APPROVED',
        isSuccess: true,
        transactionId: 109152,
      },
    });
    expect(status).toBe('APPROVED');
  });

  it('maps isReversed to REVERSED', () => {
    const status = extractConfirmedStatus({
      ok: true,
      status: 'APPROVED',
      raw: { isReversed: true, status: 'APPROVED' },
    });
    expect(status).toBe('REVERSED');
  });

  it('maps externalStatusCode FullyPaid to APPROVED', () => {
    const status = extractConfirmedStatus({
      ok: true,
      status: 'Pending',
      raw: { externalStatusCode: 'FullyPaid', isSuccess: false },
    });
    expect(status).toBe('APPROVED');
  });

  it('falls back to pending when still in flight', () => {
    const status = extractConfirmedStatus({
      ok: true,
      status: 'Pending',
      raw: { status: 'Pending', isSuccess: false },
    });
    expect(status).toBe('Pending');
  });
});
