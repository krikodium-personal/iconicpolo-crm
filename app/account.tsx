'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ArrowUpRight, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Pick, ErrorBox } from './ui';
import {
  MONTHS,
  accountLedger,
  cashoutLimit,
  monthlyResults,
  partnerBalances,
  remainingProfit,
  shareLabel,
  sharesAreComplete,
  totalsOf,
  yearSheet,
  type MonthlyResult,
} from '@/lib/account';
import { decimal, formatMoney, parseDecimal } from '@/lib/money';
import type { Data } from '@/lib/types';

const today = () =>
  new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

function currentYear() {
  return Number(today().slice(0, 4));
}
function currentMonthIndex() {
  return Number(today().slice(5, 7)) - 1;
}
function sheetValue(cents: number, money: (n: number) => string) {
  return cents ? money(cents) : '—';
}

function MonthAmount({
  cents,
  disabled,
  label,
  onSave,
}: {
  cents: number;
  disabled: boolean;
  label: string;
  onSave: (amount: number) => Promise<void>;
}) {
  const [text, setText] = useState(cents ? decimal(cents).replace('.', ',') : '');
  useEffect(() => {
    setText(cents ? decimal(cents).replace('.', ',') : '');
  }, [cents]);
  async function commit() {
    const next = text.trim() ? parseDecimal(text) : 0;
    if (next === cents) return;
    await onSave(next);
  }
  return (
    <input
      className="sheet-amount"
      aria-label={label}
      inputMode="decimal"
      disabled={disabled}
      value={text}
      placeholder="—"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        void commit().catch(() => {
          setText(cents ? decimal(cents).replace('.', ',') : '');
        });
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
      }}
    />
  );
}

function ResultMonth({
  row,
  money,
  busy,
  onSave,
}: {
  row: MonthlyResult;
  money: (n: number) => string;
  busy: boolean;
  onSave: (kind: 'mkt' | 'comisiones', amount: number) => Promise<void>;
}) {
  const hasResult = !!(row.billed || row.cost || row.mkt || row.commissions);
  return (
    <article className="result-month">
      <h3>
        {row.label} {row.year}
      </h3>
      <dl>
        <div>
          <dt>Fact</dt>
          <dd className="amount">{sheetValue(row.billed, money)}</dd>
        </div>
        <div>
          <dt>Costo</dt>
          <dd className="amount">{sheetValue(row.cost, money)}</dd>
        </div>
        <div>
          <dt>MKT</dt>
          <dd>
            <MonthAmount
              cents={row.mkt}
              disabled={busy}
              label={`MKT ${row.label}`}
              onSave={(amount) => onSave('mkt', amount)}
            />
          </dd>
        </div>
        <div>
          <dt>Comisiones</dt>
          <dd>
            <MonthAmount
              cents={row.commissions}
              disabled={busy}
              label={`Comisiones ${row.label}`}
              onSave={(amount) => onSave('comisiones', amount)}
            />
          </dd>
        </div>
        <div className="result-profit-row">
          <dt>Ganancia</dt>
          <dd
            className={`sheet-profit${row.profit < 0 ? ' money-neg' : ''}`}
          >
            {hasResult ? money(row.profit) : '—'}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function AccountBoard({
  data,
  save,
  view = 'board',
  initialYear,
}: {
  data: Data;
  save: (body: Record<string, unknown>) => Promise<void>;
  view?: 'board' | 'resultados';
  initialYear?: number;
}) {
  const results = useMemo(
    () => monthlyResults(data.orders, data.expenses),
    [data.orders, data.expenses],
  );
  const years = useMemo(() => {
    const set = new Set<number>([
      currentYear(),
      ...results.map((row) => row.year),
      ...data.cashouts.map((row) => Number(row.date.slice(0, 4))),
    ]);
    return [...set]
      .filter((year) => Number.isFinite(year))
      .sort((a, b) => b - a);
  }, [results, data.cashouts]);
  const [year, Y] = useState(() => {
    if (initialYear && years.includes(initialYear)) return initialYear;
    const withData = years.find(
      (value) =>
        results.some((row) => row.year === value) ||
        data.cashouts.some((row) => row.date.startsWith(String(value))),
    );
    return withData || years[0] || currentYear();
  });
  const [monthIndex, setMonthIndex] = useState(() => {
    const now = currentMonthIndex();
    return now >= 0 && now < 12 ? now : 0;
  });
  const [busy, B] = useState(false);
  const [error, E] = useState('');
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashout, C] = useState({
    partner_id: data.partners.find((partner) => !partner.archived)?.id || '',
    amount: '',
    date: today(),
    notes: '',
  });
  const yearRows = yearSheet(year, results);
  const previewRow = yearRows[monthIndex] || yearRows[0];
  const yearTotals = totalsOf(yearRows);
  const allProfit = totalsOf(results).profit;
  const leftover = remainingProfit(allProfit, data.cashouts);
  const yearCashouts = data.cashouts
    .filter((row) => row.date.startsWith(String(year)))
    .reduce((sum, row) => sum + row.amount, 0);
  const partners = data.partners.filter((partner) => !partner.archived);
  const sharesReady = sharesAreComplete(partners);
  const selectedPartner =
    partners.find((partner) => partner.id === cashout.partner_id) ||
    partners[0];
  const partnerAvailable = cashoutLimit(
    selectedPartner,
    allProfit,
    data.cashouts,
    partners,
  );
  const balances = partnerBalances(allProfit, partners, data.cashouts);
  const yearBalances = partnerBalances(
    yearTotals.profit,
    partners,
    data.cashouts.filter((row) => row.date.startsWith(String(year))),
  );
  const ledger = accountLedger(results, data.cashouts, data.partners);
  const yearLedger = ledger.filter((entry) =>
    entry.date.startsWith(String(year)),
  );
  const money = (cents: number) => formatMoney(cents, data.currency);
  async function run(body: Record<string, unknown>, after?: () => void) {
    B(true);
    E('');
    try {
      await save(body);
      after?.();
    } catch (e) {
      E((e as Error).message);
      throw e;
    } finally {
      B(false);
    }
  }
  function saveMonth(month: string, kind: 'mkt' | 'comisiones', amount: number) {
    return run({ action: 'month_expense', kind, month, amount });
  }
  const yearPick = (
    <Pick
      label="Año"
      value={String(year)}
      onChange={(value) => Y(Number(value))}
      options={years.map((value) => ({
        value: String(value),
        label: String(value),
      }))}
    />
  );
  const monthPick = (
    <Pick
      label="Mes"
      value={String(monthIndex)}
      onChange={(value) => setMonthIndex(Number(value))}
      options={MONTHS.map((label, index) => ({
        value: String(index),
        label,
      }))}
    />
  );
  if (view === 'resultados') {
    return (
      <div className="account-board">
        <ErrorBox message={error} />
        <section className="panel account-sheet">
          <div className="panel-heading">
            <h2>Resultados</h2>
          </div>
          <div className="result-tools result-tools-bar">{yearPick}</div>
          <div className="result-months">
            {yearRows.map((row) => (
              <ResultMonth
                key={row.month}
                row={row}
                money={money}
                busy={busy}
                onSave={(kind, amount) => saveMonth(row.month, kind, amount)}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="account-board">
      <p className="hint">
        FACT es lo cobrado, aunque el pedido no esté facturado ni cerrado.
        Ganancia es lo cobrado menos costo, MKT y comisiones, y se reparte
        entre los socios según su %. Un cashout no puede superar lo que le
        queda a ese socio después de su parte.
      </p>
      <ErrorBox message={error} />
      <div className="seg year-seg" role="tablist" aria-label="Año">
        {years.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={year === value}
            className={year === value ? 'selected' : ''}
            onClick={() => Y(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="metrics">
        {[
          {
            label: 'Facturación',
            value: yearTotals.billed,
            hint: `${yearTotals.orders} pedido${yearTotals.orders === 1 ? '' : 's'} cobrado${yearTotals.orders === 1 ? '' : 's'}`,
          },
          {
            label: 'En cuenta',
            value: leftover,
            hint: sharesReady
              ? 'Suma disponible de los socios'
              : 'Definí los % en Configuración',
          },
          {
            label: 'Ganancia',
            value: yearTotals.profit,
            hint: sharesReady
              ? yearBalances
                  .map(
                    (row) =>
                      `${row.partner.name.split(' ')[0]} ${shareLabel(row.partner.share)} ${money(row.assigned)}`,
                  )
                  .join(' · ')
              : yearTotals.margin == null
                ? 'Sin cobros en el año'
                : `Margen ${yearTotals.margin}%`,
          },
          {
            label: 'Cashouts',
            value: yearCashouts,
            hint: `${year}`,
          },
        ].map(({ label, value, hint }) => (
          <article className="metric" key={label}>
            <p>{label}</p>
            <strong className={value < 0 ? 'money-neg' : ''}>
              {money(value)}
            </strong>
            <span>{hint}</span>
          </article>
        ))}
      </div>
      <section className="panel account-sheet">
        <div className="panel-heading">
          <h2>Resultados</h2>
          <a href={`/tablero?vista=resultados&anio=${year}`}>
            Ver todo <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="result-tools result-tools-bar">
          {monthPick}
          {yearPick}
        </div>
        {previewRow ? (
          <div className="result-months result-preview">
            <ResultMonth
              row={previewRow}
              money={money}
              busy={busy}
              onSave={(kind, amount) =>
                saveMonth(previewRow.month, kind, amount)
              }
            />
          </div>
        ) : null}
      </section>
      <section className="panel">
          <div className="panel-heading">
            <h2>Caja de socios</h2>
            <span>
              {sharesReady
                ? `${partners.length} socios`
                : 'Faltan los %'}
            </span>
          </div>
          {partners.length ? (
            <>
              <div className="desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Socio</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Ganancia</TableHead>
                      <TableHead>Cashouts</TableHead>
                      <TableHead>Disponible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((row) => (
                      <TableRow key={row.partner.id}>
                        <TableCell>{row.partner.name}</TableCell>
                        <TableCell>{shareLabel(row.partner.share)}</TableCell>
                        <TableCell>{money(row.assigned)}</TableCell>
                        <TableCell>
                          {row.taken ? money(row.taken) : '—'}
                        </TableCell>
                        <TableCell
                          className={row.available < 0 ? 'money-neg' : ''}
                        >
                          {money(row.available)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="record-card-list partner-balance-cards">
                {balances.map((row) => (
                  <article className="record-card" key={row.partner.id}>
                    <div className="record-card-top">
                      <b>
                        {row.partner.name}
                        {row.partner.share
                          ? ` · ${shareLabel(row.partner.share)}`
                          : ''}
                      </b>
                      <span className={row.available < 0 ? 'money-neg' : ''}>
                        {money(row.available)}
                      </span>
                    </div>
                    <dl className="record-card-facts">
                      <div>
                        <dt>Ganancia</dt>
                        <dd>{money(row.assigned)}</dd>
                      </div>
                      <div>
                        <dt>Cashouts</dt>
                        <dd>{row.taken ? money(row.taken) : '—'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="hint">
              Agregá un socio en Configuración para registrar cashouts a su
              nombre.
            </p>
          )}
        </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Movimientos {year}</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              E('');
              setCashoutOpen(true);
            }}
          >
            <Plus size={15} /> cashout
          </button>
        </div>
        <div className="desktop-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearLedger.length ? (
                yearLedger.map((entry, index) => (
                  <TableRow key={`${entry.date}-${entry.label}-${index}`}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      {entry.label}
                      {entry.partner ? ` · ${entry.partner}` : ''}
                      {entry.actor ? ` · Registrado por ${entry.actor}` : ''}
                      {entry.notes ? ` · ${entry.notes}` : ''}
                    </TableCell>
                    <TableCell className={entry.amount < 0 ? 'money-neg' : ''}>
                      {money(entry.amount)}
                    </TableCell>
                    <TableCell className={entry.balance < 0 ? 'money-neg' : ''}>
                      {money(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    No hay movimientos para mostrar en {year}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="record-card-list">
          {yearLedger.map((entry, index) => (
            <article
              className="record-card"
              key={`${entry.date}-${entry.label}-${index}`}
            >
              <div className="record-card-top">
                <b>{entry.label}</b>
                <span className={entry.amount < 0 ? 'money-neg' : ''}>
                  {money(entry.amount)}
                </span>
              </div>
              <small>
                {entry.date}
                {entry.partner ? ` · ${entry.partner}` : ''}
                {entry.actor ? ` · Registrado por ${entry.actor}` : ''}
                {entry.notes ? ` · ${entry.notes}` : ''} · saldo{' '}
                {money(entry.balance)}
              </small>
            </article>
          ))}
        </div>
      </section>
      <Dialog
        open={cashoutOpen}
        onOpenChange={(open) => {
          setCashoutOpen(open);
          if (!open) E('');
        }}
      >
        <DialogContent className="crm-dialog crm-dialog-cashout max-[767px]:top-0 max-[767px]:left-0 max-[767px]:right-0 max-[767px]:bottom-0 max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:w-full max-[767px]:max-w-none max-[767px]:h-dvh max-[767px]:max-h-dvh max-[767px]:rounded-none max-[767px]:animate-none">
          <DialogHeader>
            <DialogTitle>Registrar cashout</DialogTitle>
            <DialogDescription>
              {sharesReady && selectedPartner
                ? `${selectedPartner.name} recibe ${shareLabel(selectedPartner.share)} de la ganancia. Puede retirar hasta ${money(partnerAvailable)}.`
                : 'Definí los % de cada socio en Configuración para repartir la ganancia.'}
            </DialogDescription>
          </DialogHeader>
          <ErrorBox message={error} />
          {!partners.length ? (
            <p className="hint">
              Agregá un socio en Configuración para registrar cashouts a su
              nombre.
            </p>
          ) : null}
          <form
            className="cashout-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const amount = parseDecimal(cashout.amount);
                if (!sharesReady) {
                  throw new Error(
                    'Definí los porcentajes de los socios en Configuración.',
                  );
                }
                if (amount > partnerAvailable) {
                  throw new Error(
                    partnerAvailable <= 0
                      ? 'Este socio no tiene ganancia disponible para retirar.'
                      : 'El cashout no puede superar la parte de este socio.',
                  );
                }
                void run(
                  {
                    action: 'cashout',
                    partner_id: cashout.partner_id || partners[0]?.id,
                    amount,
                    date: cashout.date,
                    notes: cashout.notes,
                  },
                  () => {
                    C({ ...cashout, amount: '', notes: '' });
                    setCashoutOpen(false);
                  },
                );
              } catch (err) {
                E((err as Error).message);
              }
            }}
          >
            <div className="form-grid">
              <Field label="Socio *">
                <Pick
                  label="Socio"
                  value={cashout.partner_id || partners[0]?.id || ''}
                  onChange={(v) => C({ ...cashout, partner_id: v })}
                  options={partners.map((partner) => ({
                    value: partner.id,
                    label: partner.name,
                  }))}
                />
              </Field>
              <Field label="Importe *">
                <input
                  inputMode="decimal"
                  required
                  value={cashout.amount}
                  onChange={(e) => C({ ...cashout, amount: e.target.value })}
                />
              </Field>
              <Field label="Fecha *">
                <input
                  type="date"
                  required
                  value={cashout.date}
                  onChange={(e) => C({ ...cashout, date: e.target.value })}
                />
              </Field>
              <Field label="Notas" wide>
                <input
                  value={cashout.notes}
                  onChange={(e) => C({ ...cashout, notes: e.target.value })}
                />
              </Field>
            </div>
            <button
              className="primary"
              disabled={busy || !partners.length || partnerAvailable <= 0}
            >
              {busy ? 'Guardando…' : 'Cargar cashout'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
