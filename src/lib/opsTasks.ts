/** Pure helpers for Task Master board (status, priority, sort). */

export type OpsTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type OpsTaskPriority = 'none' | 'low' | 'medium' | 'high';

export const OPS_TASK_STATUSES: OpsTaskStatus[] = ['backlog', 'todo', 'in_progress', 'done'];

export const OPS_TASK_PRIORITIES: OpsTaskPriority[] = ['none', 'low', 'medium', 'high'];

const PRIORITY_RANK: Record<OpsTaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export interface OpsTaskSortable {
  id: string;
  status: OpsTaskStatus;
  priority: OpsTaskPriority;
  due_date: string | null;
  created_at: string;
  is_deleted?: boolean;
  archived_at?: string | null;
}

/** Compare two YYYY-MM-DD dates; null due dates sort last. */
export function compareDueDateAsc(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/**
 * Overdue when due_date is strictly before the Baku calendar day key (YYYY-MM-DD).
 * End-of-day rule: date === today is not overdue.
 */
export function isOpsTaskOverdue(dueDate: string | null, bakuTodayKey: string): boolean {
  if (!dueDate) return false;
  return dueDate < bakuTodayKey;
}

/**
 * Active board sort: overdue first → soonest due → High→None priority → created_at.
 */
export function compareOpsTasksForBoard(
  a: OpsTaskSortable,
  b: OpsTaskSortable,
  bakuTodayKey: string
): number {
  const aOver = isOpsTaskOverdue(a.due_date, bakuTodayKey) ? 0 : 1;
  const bOver = isOpsTaskOverdue(b.due_date, bakuTodayKey) ? 0 : 1;
  if (aOver !== bOver) return aOver - bOver;

  const due = compareDueDateAsc(a.due_date, b.due_date);
  if (due !== 0) return due;

  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;

  return a.created_at.localeCompare(b.created_at);
}

export function sortOpsTasksForBoard<T extends OpsTaskSortable>(
  tasks: T[],
  bakuTodayKey: string
): T[] {
  return [...tasks].sort((a, b) => compareOpsTasksForBoard(a, b, bakuTodayKey));
}

export function isOpsTaskStatus(value: string): value is OpsTaskStatus {
  return (OPS_TASK_STATUSES as string[]).includes(value);
}

export function isOpsTaskPriority(value: string): value is OpsTaskPriority {
  return (OPS_TASK_PRIORITIES as string[]).includes(value);
}
