/**
 * Pure two-click date-range state machine.
 * Parent filters keep the last committed range until `committed` is non-null.
 */
export type RangePickState = {
  selecting: 'start' | 'end';
  draftStart: string;
  draftEnd: string;
};

export function nextDateRangePick(
  state: RangePickState,
  dateStr: string,
): RangePickState & { committed: { start: string; end: string } | null } {
  if (state.selecting === 'start') {
    return {
      selecting: 'end',
      draftStart: dateStr,
      draftEnd: '',
      committed: null,
    };
  }
  if (state.draftStart && dateStr < state.draftStart) {
    return {
      selecting: 'end',
      draftStart: dateStr,
      draftEnd: '',
      committed: null,
    };
  }
  const start = state.draftStart || dateStr;
  return {
    selecting: 'start',
    draftStart: start,
    draftEnd: dateStr,
    committed: { start, end: dateStr },
  };
}
