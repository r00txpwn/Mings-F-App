/** Remaining minutes until estimated_ready_at (can be negative). */
export function remainingMinutes(estimatedReadyAtIso: string | null | undefined, nowMs: number): number | null {
  if (!estimatedReadyAtIso) return null;
  const t = new Date(estimatedReadyAtIso).getTime();
  if (Number.isNaN(t)) return null;
  return (t - nowMs) / 60_000;
}

/**
 * KDS card urgency from remaining minutes (countdown).
 * tRem > 3: on track (green)
 * tRem in (0, 3]: almost due (amber)
 * tRem in (-2, 0]: due now (orange + pulse)
 * tRem <= -2: overdue (red)
 */
export function getUrgencyColor(tRem: number): {
  border: string;
  bg: string;
  pulse: boolean;
} {
  if (tRem > 3) {
    return { border: 'border-emerald-500', bg: 'bg-emerald-900/20', pulse: false };
  }
  if (tRem > 0) {
    return { border: 'border-amber-500', bg: 'bg-amber-900/20', pulse: false };
  }
  if (tRem > -2) {
    return { border: 'border-orange-500', bg: 'bg-orange-900/30', pulse: true };
  }
  return { border: 'border-red-600', bg: 'bg-red-900/25', pulse: false };
}
