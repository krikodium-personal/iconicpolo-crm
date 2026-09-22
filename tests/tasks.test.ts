import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TASK_KINDS,
  TASK_KIND_LABELS,
  addCalendarDays,
  sortTasks,
  taskIsOverdue,
  taskKindLabel,
  taskNeedsAttention,
  tasksNeedAttention,
  taskUrgency,
} from '../lib/tasks.ts';

test('task kinds cover the CRM types including otro', () => {
  assert.deepEqual([...TASK_KINDS], [
    'buscar_pedido',
    'cobrar_pedido',
    'pagar_pedido',
    'preparar_pedido',
    'publicar_rrss',
    'pauta_rrss',
    'produccion_fotos',
    'otro',
  ]);
  assert.equal(TASK_KIND_LABELS.buscar_pedido, 'buscar pedido');
  assert.equal(TASK_KIND_LABELS.preparar_pedido, 'preparar pedido');
  assert.equal(TASK_KIND_LABELS.publicar_rrss, 'publicar RRSS');
  assert.equal(TASK_KIND_LABELS.otro, 'otro');
});

test('otro kind label uses custom text with fallback', () => {
  assert.equal(taskKindLabel('otro', 'seguimiento interno'), 'seguimiento interno');
  assert.equal(taskKindLabel('otro', '  '), 'otro');
  assert.equal(taskKindLabel('otro'), 'otro');
  assert.equal(taskKindLabel('cobrar_pedido', 'ignored'), 'cobrar pedido');
});

test('addCalendarDays stays on ISO calendar dates', () => {
  assert.equal(addCalendarDays('2026-09-22', 2), '2026-09-24');
  assert.equal(addCalendarDays('2026-01-31', 1), '2026-02-01');
});

test('overdue and due-soon attention for open tasks', () => {
  const today = '2026-09-22';
  assert.equal(
    taskIsOverdue({ due_date: '2026-09-21', done: 0 }, today),
    true,
  );
  assert.equal(
    taskIsOverdue({ due_date: '2026-09-22', done: 0 }, today),
    false,
  );
  assert.equal(
    taskNeedsAttention({ due_date: '2026-09-21', done: 0 }, today),
    true,
  );
  assert.equal(
    taskNeedsAttention({ due_date: '2026-09-22', done: 0 }, today),
    true,
  );
  assert.equal(
    taskNeedsAttention({ due_date: '2026-09-24', done: 0 }, today),
    true,
  );
  assert.equal(
    taskNeedsAttention({ due_date: '2026-09-25', done: 0 }, today),
    false,
  );
  assert.equal(
    taskNeedsAttention({ due_date: '2026-09-21', done: 1 }, today),
    false,
  );
});

test('nav red-dot aggregates any attentive open task', () => {
  const today = '2026-09-22';
  assert.equal(
    tasksNeedAttention(
      [
        { due_date: '2026-10-01', done: 0 },
        { due_date: '2026-09-20', done: 1 },
      ],
      today,
    ),
    false,
  );
  assert.equal(
    tasksNeedAttention(
      [
        { due_date: '2026-10-01', done: 0 },
        { due_date: '2026-09-23', done: 0 },
      ],
      today,
    ),
    true,
  );
});

test('urgency labels and open-first sort', () => {
  const today = '2026-09-22';
  assert.equal(taskUrgency({ due_date: '2026-09-20', done: 0 }, today), 'overdue');
  assert.equal(taskUrgency({ due_date: '2026-09-23', done: 0 }, today), 'soon');
  assert.equal(taskUrgency({ due_date: '2026-10-01', done: 0 }, today), 'open');
  assert.equal(taskUrgency({ due_date: '2026-09-20', done: 1 }, today), 'done');

  const sorted = sortTasks([
    { due_date: '2026-09-25', done: 0, created_at: 'a' },
    { due_date: '2026-09-20', done: 1, created_at: 'b' },
    { due_date: '2026-09-21', done: 0, created_at: 'c' },
  ]);
  assert.deepEqual(
    sorted.map((task) => task.due_date),
    ['2026-09-21', '2026-09-25', '2026-09-20'],
  );
});
