export const TASK_KINDS = [
  'buscar_pedido',
  'cobrar_pedido',
  'pagar_pedido',
  'preparar_pedido',
  'publicar_rrss',
  'pauta_rrss',
  'produccion_fotos',
  'otro',
] as const;

export type TaskKind = (typeof TASK_KINDS)[number];

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  buscar_pedido: 'buscar pedido',
  cobrar_pedido: 'cobrar pedido',
  pagar_pedido: 'pagar pedido',
  preparar_pedido: 'preparar pedido',
  publicar_rrss: 'publicar RRSS',
  pauta_rrss: 'pauta RRSS',
  produccion_fotos: 'produccion fotos',
  otro: 'otro',
};

/** Days ahead that still count as “por vencer” (includes today). */
export const TASK_DUE_SOON_DAYS = 2;

export type TaskLike = {
  due_date: string;
  done?: number | boolean;
};

function todayInBuenosAires() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function taskKindLabel(kind: string, kindOther = '') {
  if (kind === 'otro') {
    const custom = kindOther.trim();
    return custom || TASK_KIND_LABELS.otro;
  }
  return TASK_KIND_LABELS[kind as TaskKind] || kind;
}

export function addCalendarDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function taskIsOpen(task: TaskLike) {
  return !task.done;
}

/** Overdue when due date is before today (BA timezone). */
export function taskIsOverdue(task: TaskLike, today = todayInBuenosAires()) {
  return taskIsOpen(task) && !!task.due_date && task.due_date < today;
}

/**
 * Needs nav attention when open and due today-or-earlier, or within
 * TASK_DUE_SOON_DAYS calendar days ahead.
 */
export function taskNeedsAttention(
  task: TaskLike,
  today = todayInBuenosAires(),
  soonDays = TASK_DUE_SOON_DAYS,
) {
  if (!taskIsOpen(task) || !task.due_date) return false;
  return task.due_date <= addCalendarDays(today, soonDays);
}

export function tasksNeedAttention(
  tasks: TaskLike[],
  today = todayInBuenosAires(),
) {
  return tasks.some((task) => taskNeedsAttention(task, today));
}

export function taskUrgency(
  task: TaskLike,
  today = todayInBuenosAires(),
): 'done' | 'overdue' | 'soon' | 'open' {
  if (!taskIsOpen(task)) return 'done';
  if (taskIsOverdue(task, today)) return 'overdue';
  if (taskNeedsAttention(task, today)) return 'soon';
  return 'open';
}

export function sortTasks<T extends TaskLike & { created_at?: string }>(
  tasks: T[],
) {
  return [...tasks].sort((a, b) => {
    const aDone = taskIsOpen(a) ? 0 : 1;
    const bDone = taskIsOpen(b) ? 0 : 1;
    if (aDone !== bDone) return aDone - bDone;
    if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
    return (b.created_at || '').localeCompare(a.created_at || '');
  });
}
