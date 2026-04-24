/**
 * Integer-safe money helpers for AZN (₼): store/compare in qəpik (100 per manat).
 * Use for totals and line math to avoid float drift in Edge Functions.
 */

export function toQepik(amountManat: number): number {
  return Math.round((amountManat + Number.EPSILON) * 100);
}

export function fromQepik(qepik: number): number {
  return Math.round(qepik) / 100;
}

/** Round a manat amount to 2 decimal places via qəpik. */
export function roundMoney(amountManat: number): number {
  return fromQepik(toQepik(amountManat));
}
