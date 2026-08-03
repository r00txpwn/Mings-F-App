import { describe, expect, it } from 'vitest';
import { nextDateRangePick } from '../../src/lib/dateRangePick';

describe('nextDateRangePick', () => {
  it('does not commit after start-only selection (keeps prior parent range intact)', () => {
    const afterStart = nextDateRangePick(
      { selecting: 'start', draftStart: '2026-08-01', draftEnd: '2026-08-31' },
      '2026-07-01',
    );
    expect(afterStart.committed).toBeNull();
    expect(afterStart.draftStart).toBe('2026-07-01');
    expect(afterStart.draftEnd).toBe('');
    expect(afterStart.selecting).toBe('end');
  });

  it('commits only after end is chosen', () => {
    const afterStart = nextDateRangePick(
      { selecting: 'start', draftStart: '2026-08-01', draftEnd: '2026-08-31' },
      '2026-07-01',
    );
    const afterEnd = nextDateRangePick(
      {
        selecting: afterStart.selecting,
        draftStart: afterStart.draftStart,
        draftEnd: afterStart.draftEnd,
      },
      '2026-07-15',
    );
    expect(afterEnd.committed).toEqual({ start: '2026-07-01', end: '2026-07-15' });
  });
});
