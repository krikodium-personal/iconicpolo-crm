'use client';
import { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, Pick, ErrorBox, DateCalendar, Check as CheckField } from './ui';
import {
  TASK_KINDS,
  TASK_KIND_LABELS,
  sortTasks,
  taskKindLabel,
  taskUrgency,
  type TaskKind,
} from '@/lib/tasks';
import { todayInBuenosAires, type Data, type Task } from '@/lib/types';
import type { Save } from './forms';

const today = () => todayInBuenosAires();

function formatCreated(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function urgencyLabel(urgency: ReturnType<typeof taskUrgency>) {
  if (urgency === 'overdue') return 'Vencida';
  if (urgency === 'soon') return 'Por vencer';
  if (urgency === 'done') return 'Hecha';
  return 'Pendiente';
}

type Draft = {
  due_date: string;
  partner_id: string;
  supplier_id: string;
  customer_id: string;
  kind: TaskKind;
  kind_other: string;
  description: string;
  done: boolean;
};

function emptyDraft(data: Data): Draft {
  const partners = data.partners.filter((partner) => !partner.archived);
  return {
    due_date: today(),
    partner_id: partners[0]?.id || '',
    supplier_id: '',
    customer_id: '',
    kind: TASK_KINDS[0],
    kind_other: '',
    description: '',
    done: false,
  };
}

function draftFromTask(task: Task): Draft {
  return {
    due_date: task.due_date,
    partner_id: task.partner_id,
    supplier_id: task.supplier_id || '',
    customer_id: task.customer_id || '',
    kind: task.kind,
    kind_other: task.kind_other || '',
    description: task.description || '',
    done: !!task.done,
  };
}

export function TasksBoard({ data, save }: { data: Data; save: Save }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(data));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remove, setRemove] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'open' | 'all' | 'done'>('open');

  const partners = useMemo(
    () => data.partners.filter((partner) => !partner.archived),
    [data.partners],
  );
  const suppliers = useMemo(
    () =>
      data.contacts.filter(
        (contact) => contact.kind === 'supplier' && !contact.archived,
      ),
    [data.contacts],
  );
  const customers = useMemo(
    () =>
      data.contacts.filter(
        (contact) => contact.kind === 'customer' && !contact.archived,
      ),
    [data.contacts],
  );
  const tasks = useMemo(() => sortTasks(data.tasks || []), [data.tasks]);
  const visible = useMemo(() => {
    if (filter === 'open') return tasks.filter((task) => !task.done);
    if (filter === 'done') return tasks.filter((task) => !!task.done);
    return tasks;
  }, [tasks, filter]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft(data));
    setError('');
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setDraft(draftFromTask(task));
    setError('');
    setOpen(true);
  }

  function submit() {
    try {
      if (!draft.partner_id) throw new Error('Elegí un responsable.');
      if (!draft.due_date) throw new Error('Indicá la fecha de vencimiento.');
      if (draft.kind === 'otro' && !draft.kind_other.trim()) {
        throw new Error('Indicá el tipo personalizado.');
      }
      setBusy(true);
      setError('');
      const body: Record<string, unknown> = {
        action: 'task',
        due_date: draft.due_date,
        partner_id: draft.partner_id,
        supplier_id: draft.supplier_id,
        customer_id: draft.customer_id,
        kind: draft.kind,
        kind_other: draft.kind === 'otro' ? draft.kind_other.trim() : '',
        description: draft.description,
        done: draft.done ? 1 : 0,
      };
      if (editing) {
        body.id = editing.id;
        body.version = editing.version;
      }
      void save(body)
        .then(() => setOpen(false))
        .catch((err) => setError((err as Error).message))
        .finally(() => setBusy(false));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function toggleDone(task: Task) {
    void save({
      action: 'task',
      id: task.id,
      version: task.version,
      due_date: task.due_date,
      partner_id: task.partner_id,
      supplier_id: task.supplier_id || '',
      customer_id: task.customer_id || '',
      kind: task.kind,
      kind_other: task.kind_other || '',
      description: task.description,
      done: task.done ? 0 : 1,
    }).catch((err) => setError((err as Error).message));
  }

  return (
    <section className="panel records tasks-panel">
      <div className="toolbar">
        <div className="toolbar-filters">
          {(
            [
              { id: 'open', label: 'Pendientes' },
              { id: 'all', label: 'Todas' },
              { id: 'done', label: 'Hechas' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`secondary ${filter === item.id ? 'selected' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="primary"
          disabled={!partners.length}
          onClick={openCreate}
        >
          <Plus size={18} /> Nueva tarea
        </button>
      </div>

      <ErrorBox message={error} />

      {!partners.length ? (
        <Empty className="empty">
          <EmptyHeader>
            <EmptyTitle>Faltan socios</EmptyTitle>
            <EmptyDescription>
              Agregá al menos un socio en Configuración para asignar
              responsables.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !visible.length ? (
        <Empty className="empty">
          <EmptyHeader>
            <EmptyTitle>
              {filter === 'done'
                ? 'Todavía no hay tareas hechas'
                : filter === 'all'
                  ? 'Sin tareas'
                  : 'No hay pendientes'}
            </EmptyTitle>
            <EmptyDescription>
              Creá una tarea con vencimiento, responsable y tipo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="task-list">
          {visible.map((task) => {
            const urgency = taskUrgency(task);
            const partner = data.partners.find(
              (row) => row.id === task.partner_id,
            );
            const supplier = data.contacts.find(
              (row) => row.id === task.supplier_id,
            );
            const customer = data.contacts.find(
              (row) => row.id === task.customer_id,
            );
            return (
              <li
                key={task.id}
                className={`task-card task-${urgency}${task.done ? ' is-done' : ''}`}
              >
                <div className="task-card-top">
                  <span className={`task-pill kind-${task.kind}`}>
                    {taskKindLabel(task.kind, task.kind_other)}
                  </span>
                  <span className={`task-urgency task-urgency-${urgency}`}>
                    {urgencyLabel(urgency)}
                  </span>
                </div>
                {task.description ? (
                  <p className="task-description">{task.description}</p>
                ) : (
                  <p className="task-description muted">Sin descripción</p>
                )}
                <dl className="task-meta">
                  <div>
                    <dt>Vence</dt>
                    <dd>{task.due_date}</dd>
                  </div>
                  <div>
                    <dt>Responsable</dt>
                    <dd>{partner?.name || '—'}</dd>
                  </div>
                  {supplier ? (
                    <div>
                      <dt>Proveedor</dt>
                      <dd>{supplier.name}</dd>
                    </div>
                  ) : null}
                  {customer ? (
                    <div>
                      <dt>Cliente</dt>
                      <dd>{customer.name}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Creada</dt>
                    <dd>{formatCreated(task.created_at)}</dd>
                  </div>
                </dl>
                <div className="task-card-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => toggleDone(task)}
                  >
                    <Check size={15} />
                    {task.done ? 'Reabrir' : 'Marcar hecha'}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Editar tarea"
                    onClick={() => openEdit(task)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label="Borrar tarea"
                    onClick={() => setRemove(task)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError('');
        }}
      >
        <DialogContent className="crm-dialog crm-dialog-movement max-[767px]:top-0 max-[767px]:left-0 max-[767px]:right-0 max-[767px]:bottom-0 max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:w-full max-[767px]:max-w-none max-[767px]:h-dvh max-[767px]:max-h-dvh max-[767px]:rounded-none max-[767px]:animate-none">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar tarea' : 'Nueva tarea'}
            </DialogTitle>
            <DialogDescription>
              Asigná responsable, tipo y vencimiento. Proveedor y cliente son
              opcionales.
            </DialogDescription>
          </DialogHeader>
          <ErrorBox message={error} />
          <form
            className="cashout-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="form-grid">
              {editing ? (
                <Field label="Fecha de creación" wide>
                  <input
                    readOnly
                    value={formatCreated(editing.created_at)}
                  />
                </Field>
              ) : null}
              <Field label="Fecha de vencimiento *" wide>
                <DateCalendar
                  label="Fecha de vencimiento"
                  value={draft.due_date}
                  onChange={(value) =>
                    setDraft({ ...draft, due_date: value })
                  }
                />
              </Field>
              <Field label="Responsable *">
                <Pick
                  label="Responsable"
                  value={draft.partner_id}
                  onChange={(value) =>
                    setDraft({ ...draft, partner_id: value })
                  }
                  options={partners.map((partner) => ({
                    value: partner.id,
                    label: partner.name,
                  }))}
                />
              </Field>
              <Field label="Proveedor involucrado">
                <Pick
                  label="Proveedor involucrado"
                  value={draft.supplier_id}
                  onChange={(value) =>
                    setDraft({ ...draft, supplier_id: value })
                  }
                  options={[
                    { value: '', label: 'Sin proveedor' },
                    ...suppliers
                      .concat(
                        editing?.supplier_id &&
                          !suppliers.some((s) => s.id === editing.supplier_id)
                          ? data.contacts.filter(
                              (c) => c.id === editing.supplier_id,
                            )
                          : [],
                      )
                      .map((supplier) => ({
                        value: supplier.id,
                        label: supplier.name,
                      })),
                  ]}
                />
              </Field>
              <Field label="Cliente">
                <Pick
                  label="Cliente"
                  value={draft.customer_id}
                  onChange={(value) =>
                    setDraft({ ...draft, customer_id: value })
                  }
                  options={[
                    { value: '', label: 'Sin cliente' },
                    ...customers
                      .concat(
                        editing?.customer_id &&
                          !customers.some((c) => c.id === editing.customer_id)
                          ? data.contacts.filter(
                              (c) => c.id === editing.customer_id,
                            )
                          : [],
                      )
                      .map((customer) => ({
                        value: customer.id,
                        label: customer.name,
                      })),
                  ]}
                />
              </Field>
              <Field label="Tipo de tarea *" wide>
                <Pick
                  label="Tipo de tarea"
                  value={draft.kind}
                  onChange={(value) =>
                    setDraft({
                      ...draft,
                      kind: value as TaskKind,
                      kind_other: value === 'otro' ? draft.kind_other : '',
                    })
                  }
                  options={TASK_KINDS.map((kind) => ({
                    value: kind,
                    label: TASK_KIND_LABELS[kind],
                  }))}
                />
              </Field>
              {draft.kind === 'otro' ? (
                <Field label="Tipo personalizado *" wide>
                  <input
                    value={draft.kind_other}
                    onChange={(event) =>
                      setDraft({ ...draft, kind_other: event.target.value })
                    }
                    placeholder="Otro tipo"
                    maxLength={120}
                  />
                </Field>
              ) : null}
              <Field label="Descripción" wide>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Detalle de la tarea"
                />
              </Field>
              {editing ? (
                <CheckField
                  label="Marcada como hecha"
                  checked={draft.done}
                  onChange={(checked) =>
                    setDraft({ ...draft, done: checked })
                  }
                />
              ) : null}
            </div>
            <div className="form-footer">
              <span>Los campos con * son obligatorios.</span>
              <button type="submit" className="primary" disabled={busy}>
                {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!remove}
        onOpenChange={(next) => {
          if (!next) setRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Se elimina de forma permanente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!remove) return;
                void save({ action: 'task_delete', id: remove.id })
                  .then(() => setRemove(null))
                  .catch((err) => setError((err as Error).message));
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
