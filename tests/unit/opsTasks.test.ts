import { describe, expect, it } from 'vitest';
import {
  compareOpsTasksForBoard,
  isOpsTaskOverdue,
  sortOpsTasksForBoard,
  type OpsTaskSortable,
} from '../../src/lib/opsTasks';

function task(partial: Partial<OpsTaskSortable> & Pick<OpsTaskSortable, 'id'>): OpsTaskSortable {
  return {
    status: 'todo',
    priority: 'none',
    due_date: null,
    created_at: '2026-08-01T00:00:00Z',
    ...partial,
  };
}

describe('opsTasks sort helpers', () => {
  const today = '2026-08-04';

  it('treats past due_date as overdue and today as not overdue', () => {
    expect(isOpsTaskOverdue('2026-08-03', today)).toBe(true);
    expect(isOpsTaskOverdue('2026-08-04', today)).toBe(false);
    expect(isOpsTaskOverdue(null, today)).toBe(false);
  });

  it('sorts overdue first, then due date, then priority, then created', () => {
    const list = [
      task({ id: 'a', due_date: '2026-08-10', priority: 'high', created_at: '2026-08-01T00:00:00Z' }),
      task({ id: 'b', due_date: '2026-08-01', priority: 'low', created_at: '2026-08-02T00:00:00Z' }),
      task({ id: 'c', due_date: '2026-08-10', priority: 'medium', created_at: '2026-08-01T00:00:00Z' }),
      task({ id: 'd', due_date: null, priority: 'high', created_at: '2026-08-03T00:00:00Z' }),
    ];
    const sorted = sortOpsTasksForBoard(list, today).map((t) => t.id);
    expect(sorted).toEqual(['b', 'a', 'c', 'd']);
  });

  it('compare is stable for equal fields via created_at', () => {
    const earlier = task({ id: 'e', created_at: '2026-08-01T00:00:00Z' });
    const later = task({ id: 'f', created_at: '2026-08-02T00:00:00Z' });
    expect(compareOpsTasksForBoard(earlier, later, today)).toBeLessThan(0);
  });
});
