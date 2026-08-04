import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  Archive,
  ArchiveRestore,
  Calendar,
  KanbanSquare,
  Loader2,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/cockpit';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { adminInsert, adminUpdate } from '../lib/adminApi';
import { getBakuDateKey } from '../lib/kitchenAcceptance';
import { withOptimisticState } from '../lib/optimisticUpdate';
import {
  OPS_TASK_PRIORITIES,
  OPS_TASK_STATUSES,
  isOpsTaskStatus,
  sortOpsTasksForBoard,
  type OpsTaskPriority,
  type OpsTaskStatus,
  isOpsTaskOverdue,
} from '../lib/opsTasks';
import { supabase, type Employee } from '../lib/supabase';
import type { Translations } from '../translations';

export interface OpsTaskRow {
  id: string;
  title: string;
  description: string;
  status: OpsTaskStatus;
  priority: OpsTaskPriority;
  assignee_employee_id: string | null;
  due_date: string | null;
  archived_at: string | null;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employees?: Pick<Employee, 'id' | 'full_name' | 'is_active' | 'left_at'> | null;
}

type TaskFormState = {
  title: string;
  description: string;
  assignee_employee_id: string;
  due_date: string;
  priority: OpsTaskPriority;
  status: OpsTaskStatus;
};

const emptyForm = (): TaskFormState => ({
  title: '',
  description: '',
  assignee_employee_id: '',
  due_date: '',
  priority: 'none',
  status: 'backlog',
});

function statusLabel(t: Translations, status: OpsTaskStatus): string {
  switch (status) {
    case 'backlog':
      return t.taskMasterStatusBacklog;
    case 'todo':
      return t.taskMasterStatusTodo;
    case 'in_progress':
      return t.taskMasterStatusInProgress;
    case 'done':
      return t.taskMasterStatusDone;
  }
}

function priorityLabel(t: Translations, priority: OpsTaskPriority): string {
  switch (priority) {
    case 'none':
      return t.taskMasterPriorityNone;
    case 'low':
      return t.taskMasterPriorityLow;
    case 'medium':
      return t.taskMasterPriorityMedium;
    case 'high':
      return t.taskMasterPriorityHigh;
  }
}

function priorityChipClass(priority: OpsTaskPriority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500/15 text-red-700 ring-1 ring-red-500/30 dark:text-red-300';
    case 'medium':
      return 'bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200';
    case 'low':
      return 'bg-sky-500/15 text-sky-800 ring-1 ring-sky-500/30 dark:text-sky-200';
    default:
      return '';
  }
}

/** Column shell: full-height board chrome with soft status tint (no accent stripe). */
function columnChrome(status: OpsTaskStatus): {
  shell: string;
  head: string;
  title: string;
  count: string;
} {
  switch (status) {
    case 'backlog':
      return {
        shell:
          'border-violet-300/50 bg-gradient-to-b from-violet-50 to-white shadow-sm dark:border-violet-500/30 dark:from-violet-950/40 dark:to-slate-950/90 dark:shadow-[inset_0_1px_0_0_rgba(167,139,250,0.12)]',
        head: 'border-violet-200/80 bg-violet-100/60 dark:border-violet-500/20 dark:bg-violet-950/40',
        title: 'text-violet-800 dark:text-violet-200',
        count: 'bg-violet-200/80 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100',
      };
    case 'todo':
      return {
        shell:
          'border-sky-300/50 bg-gradient-to-b from-sky-50 to-white shadow-sm dark:border-sky-500/30 dark:from-sky-950/40 dark:to-slate-950/90 dark:shadow-[inset_0_1px_0_0_rgba(56,189,248,0.12)]',
        head: 'border-sky-200/80 bg-sky-100/60 dark:border-sky-500/20 dark:bg-sky-950/40',
        title: 'text-sky-800 dark:text-sky-200',
        count: 'bg-sky-200/80 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100',
      };
    case 'in_progress':
      return {
        shell:
          'border-amber-300/50 bg-gradient-to-b from-amber-50 to-white shadow-sm dark:border-cockpit-500/35 dark:from-amber-950/35 dark:to-slate-950/90 dark:shadow-[inset_0_1px_0_0_rgba(245,158,11,0.12)]',
        head: 'border-amber-200/80 bg-amber-100/60 dark:border-cockpit-500/25 dark:bg-cockpit-950/40',
        title: 'text-amber-900 dark:text-cockpit-200',
        count: 'bg-amber-200/80 text-amber-950 dark:bg-cockpit-500/20 dark:text-cockpit-100',
      };
    case 'done':
      return {
        shell:
          'border-emerald-300/50 bg-gradient-to-b from-emerald-50 to-white shadow-sm dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-slate-950/90 dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.12)]',
        head: 'border-emerald-200/80 bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-950/40',
        title: 'text-emerald-900 dark:text-emerald-200',
        count: 'bg-emerald-200/80 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-100',
      };
  }
}

function isActiveEmployee(e: Pick<Employee, 'is_active' | 'left_at'>): boolean {
  if (!e.is_active) return false;
  if (e.left_at && e.left_at <= getBakuDateKey(new Date())) return false;
  return true;
}

function TaskCardBody({
  task,
  assigneeName,
  bakuToday,
  t,
  compact,
}: {
  task: OpsTaskRow;
  assigneeName: string | null;
  bakuToday: string;
  t: Translations;
  compact?: boolean;
}) {
  const overdue = isOpsTaskOverdue(task.due_date, bakuToday);
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">{task.title}</p>
        {task.priority !== 'none' ? (
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityChipClass(task.priority)}`}
          >
            {priorityLabel(t, task.priority)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3" aria-hidden />
          {assigneeName ?? t.taskMasterUnassigned}
        </span>
        {task.due_date ? (
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? 'font-semibold text-red-600 dark:text-red-300' : ''
            }`}
          >
            <Calendar className="h-3 w-3" aria-hidden />
            {task.due_date}
            {overdue ? ` · ${t.taskMasterOverdue}` : ''}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  task,
  assigneeName,
  bakuToday,
  t,
  onOpen,
}: {
  task: OpsTaskRow;
  assigneeName: string | null;
  bakuToday: string;
  t: Translations;
  onOpen: (task: OpsTaskRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      data-task-status={task.status}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(task)}
      className={`w-full rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-sm transition hover:border-cockpit-400 hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:hover:border-cockpit-500/50 dark:hover:bg-slate-900 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <TaskCardBody task={task} assigneeName={assigneeName} bakuToday={bakuToday} t={t} />
    </button>
  );
}

function StatusColumn({
  status,
  title,
  tasks,
  nameById,
  bakuToday,
  t,
  onOpen,
}: {
  status: OpsTaskStatus;
  title: string;
  tasks: OpsTaskRow[];
  nameById: Map<string, string>;
  bakuToday: string;
  t: Translations;
  onOpen: (task: OpsTaskRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const chrome = columnChrome(status);
  return (
    <div
      ref={setNodeRef}
      data-column-status={status}
      className={`flex h-full min-h-0 min-w-[260px] flex-1 flex-col overflow-hidden rounded-2xl border ${chrome.shell} ${
        isOver ? 'ring-2 ring-cockpit-500/60 ring-offset-2 ring-offset-transparent dark:ring-offset-slate-950' : ''
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-between border-b px-3 py-3 ${chrome.head}`}
      >
        <h2 className={`text-xs font-semibold uppercase tracking-wide ${chrome.title}`}>{title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${chrome.count}`}
        >
          {tasks.length}
        </span>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5"
        data-column-dropzone={status}
      >
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            assigneeName={
              task.assignee_employee_id
                ? nameById.get(task.assignee_employee_id) ??
                  task.employees?.full_name ??
                  null
                : null
            }
            bakuToday={bakuToday}
            t={t}
            onOpen={onOpen}
          />
        ))}
        {tasks.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {t.taskMasterColumnEmpty}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TaskMasterScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();
  const bakuToday = getBakuDateKey(new Date());

  const [tasks, setTasks] = useState<OpsTaskRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<OpsTaskRow | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const boardScrollRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  /**
   * Trackpads often only emit vertical wheel (deltaY). Map that to horizontal
   * board scroll while the pointer is anywhere over the board — including
   * card areas — unless a column list has real vertical range left to use.
   */
  useEffect(() => {
    const el = boardScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      // Trackpad horizontal swipe already has |deltaX| dominant — leave alone.
      if (!e.shiftKey && Math.abs(deltaX) > Math.abs(deltaY)) return;

      // Shift+wheel always pans the board sideways.
      const forceHorizontal = e.shiftKey;

      if (!forceHorizontal) {
        const columnList = (e.target as HTMLElement | null)?.closest?.(
          '[data-column-dropzone]'
        ) as HTMLElement | null;
        if (columnList) {
          // Ignore 1–2px subpixel “overflow” that blocked horizontal pan before.
          const maxY = columnList.scrollHeight - columnList.clientHeight;
          if (maxY > 12) {
            const canScrollUp = columnList.scrollTop > 1;
            const canScrollDown = columnList.scrollTop < maxY - 1;
            if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
              return;
            }
          }
        }
      }

      const maxX = el.scrollWidth - el.clientWidth;
      if (maxX <= 0) return;
      const amount = forceHorizontal ? deltaY || deltaX : deltaY + deltaX;
      if (
        (amount < 0 && el.scrollLeft <= 0) ||
        (amount > 0 && el.scrollLeft >= maxX - 1)
      ) {
        return;
      }

      // Capture + preventDefault so overflow-y columns/overscroll-contain don't eat the gesture.
      e.preventDefault();
      e.stopPropagation();
      el.scrollLeft = Math.max(0, Math.min(maxX, el.scrollLeft + amount));
    };

    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
  }, [loading]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) map.set(e.id, e.full_name);
    for (const task of tasks) {
      if (task.employees?.id && task.employees.full_name) {
        map.set(task.employees.id, task.employees.full_name);
      }
    }
    return map;
  }, [employees, tasks]);

  const activeEmployees = useMemo(
    () => employees.filter(isActiveEmployee).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [employees]
  );

  const loadBoard = useCallback(async () => {
    const [taskRes, empRes] = await Promise.all([
      supabase
        .from('ops_tasks')
        .select('*, employees(id, full_name, is_active, left_at)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
      supabase.from('employees').select('*').order('full_name'),
    ]);

    if (taskRes.error) {
      toast.error(taskRes.error.message);
      setTasks([]);
    } else {
      setTasks((taskRes.data ?? []) as OpsTaskRow[]);
    }

    if (empRes.error) {
      toast.error(empRes.error.message);
      setEmployees([]);
    } else {
      setEmployees((empRes.data ?? []) as Employee[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const channel = supabase
      .channel('ops-tasks-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ops_tasks' },
        () => {
          void loadBoard();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBoard]);

  const activeTasks = useMemo(
    () =>
      sortOpsTasksForBoard(
        tasks.filter((row) => !row.is_deleted && !row.archived_at),
        bakuToday
      ),
    [tasks, bakuToday]
  );

  const archivedTasks = useMemo(
    () =>
      tasks
        .filter((row) => !row.is_deleted && row.archived_at)
        .sort((a, b) => (b.archived_at ?? '').localeCompare(a.archived_at ?? '')),
    [tasks]
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<OpsTaskStatus, OpsTaskRow[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of activeTasks) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [activeTasks]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (task: OpsTaskRow) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      assignee_employee_id: task.assignee_employee_id ?? '',
      due_date: task.due_date ?? '',
      priority: task.priority,
      status: task.status,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error(t.taskMasterTitleRequired);
      return;
    }
    setSaving(true);
    const payload = {
      title,
      description: form.description.trim(),
      assignee_employee_id: form.assignee_employee_id || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
    };

    if (editing) {
      const result = await adminUpdate<OpsTaskRow>('ops_tasks', editing.id, payload);
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error ?? t.taskMasterSaveFailed);
        return;
      }
      toast.success(t.taskMasterUpdated);
      closeEditor();
      void loadBoard();
      return;
    }

    const result = await adminInsert<OpsTaskRow>('ops_tasks', {
      ...payload,
      status: 'backlog',
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.taskMasterSaveFailed);
      return;
    }
    toast.success(t.taskMasterCreated);
    closeEditor();
    void loadBoard();
  };

  const changeStatus = async (taskId: string, status: OpsTaskStatus) => {
    const err = await withOptimisticState({
      getPrevious: () => tasks,
      setState: setTasks,
      nextState: (prev) =>
        prev.map((row) =>
          row.id === taskId ? { ...row, status, updated_at: new Date().toISOString() } : row
        ),
      persist: () => adminUpdate('ops_tasks', taskId, { status }),
    });
    if (err) toast.error(err);
  };

  const archiveTask = async (task: OpsTaskRow) => {
    const at = new Date().toISOString();
    const err = await withOptimisticState({
      getPrevious: () => tasks,
      setState: setTasks,
      nextState: (prev) =>
        prev.map((row) => (row.id === task.id ? { ...row, archived_at: at } : row)),
      persist: () => adminUpdate('ops_tasks', task.id, { archived_at: at }),
    });
    if (err) toast.error(err);
    else {
      toast.success(t.taskMasterArchived);
      closeEditor();
    }
  };

  const unarchiveTask = async (task: OpsTaskRow) => {
    const err = await withOptimisticState({
      getPrevious: () => tasks,
      setState: setTasks,
      nextState: (prev) =>
        prev.map((row) => (row.id === task.id ? { ...row, archived_at: null } : row)),
      persist: () => adminUpdate('ops_tasks', task.id, { archived_at: null }),
    });
    if (err) toast.error(err);
    else toast.success(t.taskMasterUnarchived);
  };

  const softDeleteTask = async (task: OpsTaskRow) => {
    if (!window.confirm(t.taskMasterDeleteConfirm.replace('{title}', task.title))) return;
    const err = await withOptimisticState({
      getPrevious: () => tasks,
      setState: setTasks,
      nextState: (prev) =>
        prev.map((row) => (row.id === task.id ? { ...row, is_deleted: true } : row)),
      persist: () => adminUpdate('ops_tasks', task.id, { is_deleted: true }),
    });
    if (err) toast.error(err);
    else {
      toast.success(t.taskMasterDeleted);
      closeEditor();
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);
    let nextStatus: OpsTaskStatus | null = null;
    if (isOpsTaskStatus(overId)) {
      nextStatus = overId;
    } else {
      const overTask = tasks.find((row) => row.id === overId);
      if (overTask) nextStatus = overTask.status;
    }
    if (!nextStatus) return;
    const current = tasks.find((row) => row.id === taskId);
    if (!current || current.status === nextStatus || current.archived_at) return;
    await changeStatus(taskId, nextStatus);
  };

  const activeDragTask = activeDragId ? tasks.find((row) => row.id === activeDragId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t.cockpitLoadingContent}
      </div>
    );
  }

  return (
    /* Board fills remaining viewport; each column scrolls cards independently. */
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-3 lg:h-[calc(100dvh-4.5rem)]">
      <div className="shrink-0 [&_header]:mb-0">
        <PageHeader
          title={t.taskMaster}
          description={t.taskMasterSubtitle}
          icon={KanbanSquare}
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-white/20"
              >
                <Archive className="h-4 w-4" aria-hidden />
                {showArchived ? t.taskMasterHideArchived : t.taskMasterShowArchived}
                {archivedTasks.length > 0 ? (
                  <span className="rounded-full bg-slate-100 px-1.5 text-xs tabular-nums dark:bg-white/10">
                    {archivedTasks.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cockpit-500 px-3 py-2 text-sm font-medium text-white hover:bg-cockpit-400"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t.taskMasterNewTask}
              </button>
            </div>
          }
        />
      </div>

      {showArchived ? (
        <section className="max-h-[28vh] shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t.taskMasterArchivedList}
          </h2>
          {archivedTasks.length === 0 ? (
            <p className="text-sm text-slate-500">{t.taskMasterNoArchived}</p>
          ) : (
            <ul className="space-y-2">
              {archivedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {statusLabel(t, task.status)}
                      {task.archived_at
                        ? ` · ${new Date(task.archived_at).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void unarchiveTask(task)}
                    className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:border-cockpit-500/40 dark:border-white/10 dark:text-slate-200"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                    {t.taskMasterUnarchive}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={(ev) => void onDragEnd(ev)}
      >
        <div
          ref={boardScrollRef}
          className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {OPS_TASK_STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              title={statusLabel(t, status)}
              tasks={tasksByStatus[status]}
              nameById={nameById}
              bakuToday={bakuToday}
              t={t}
              onOpen={openEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDragTask ? (
            <div className="w-[260px] rounded-xl border border-cockpit-500/50 bg-white p-3 shadow-xl dark:bg-slate-900">
              <TaskCardBody
                task={activeDragTask}
                assigneeName={
                  activeDragTask.assignee_employee_id
                    ? nameById.get(activeDragTask.assignee_employee_id) ?? null
                    : null
                }
                bakuToday={bakuToday}
                t={t}
                compact
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-master-editor-title"
        >
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="task-master-editor-title" className="text-lg font-semibold text-slate-100">
                {editing ? t.taskMasterEditTask : t.taskMasterNewTask}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                aria-label={t.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-400">{t.taskMasterTitle}</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-400">{t.taskMasterNotes}</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">{t.taskMasterAssignee}</span>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                    value={form.assignee_employee_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, assignee_employee_id: e.target.value }))
                    }
                  >
                    <option value="">{t.taskMasterUnassigned}</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                    {editing?.assignee_employee_id &&
                    !activeEmployees.some((e) => e.id === editing.assignee_employee_id) ? (
                      <option value={editing.assignee_employee_id}>
                        {nameById.get(editing.assignee_employee_id) ?? t.taskMasterFormerAssignee}
                      </option>
                    ) : null}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">{t.taskMasterDeadline}</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-400">{t.taskMasterPriority}</span>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        priority: e.target.value as OpsTaskPriority,
                      }))
                    }
                  >
                    {OPS_TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabel(t, p)}
                      </option>
                    ))}
                  </select>
                </label>

                {editing ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-slate-400">{t.status}</span>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value as OpsTaskStatus,
                        }))
                      }
                    >
                      {OPS_TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(t, s)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {editing && !editing.archived_at ? (
                  <button
                    type="button"
                    onClick={() => void archiveTask(editing)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20"
                  >
                    <Archive className="h-4 w-4" aria-hidden />
                    {t.taskMasterArchive}
                  </button>
                ) : null}
                {editing?.archived_at ? (
                  <button
                    type="button"
                    onClick={() => void unarchiveTask(editing)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20"
                  >
                    <ArchiveRestore className="h-4 w-4" aria-hidden />
                    {t.taskMasterUnarchive}
                  </button>
                ) : null}
                {editing ? (
                  <button
                    type="button"
                    onClick={() => void softDeleteTask(editing)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {t.delete}
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cockpit-500 px-3 py-2 text-sm font-medium text-white hover:bg-cockpit-400 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editing ? t.save : t.create}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
