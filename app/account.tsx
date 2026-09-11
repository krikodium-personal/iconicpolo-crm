'use client';
import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Field, Pick, ErrorBox } from './ui';
import {
  accountLedger,
  cashoutsByMonth,
  monthlyResults,
  totalsOf,
} from '@/lib/account';
import { formatMoney, parseDecimal } from '@/lib/money';
import type { Data } from '@/lib/types';

const today = () =>
  new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });

function currentYear() {
  return Number(today().slice(0, 4));
}

export function AccountBoard({
  data,
  save,
}: {
  data: Data;
  save: (body: Record<string, unknown>) => Promise<void>;
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
    const withData = years.find(
      (value) =>
        results.some((row) => row.year === value) ||
        data.cashouts.some((row) => row.date.startsWith(String(value))),
    );
    return withData || years[0] || currentYear();
  });
  const [busy, B] = useState(false);
  const [error, E] = useState('');
  const [partnerName, P] = useState('');
  const [expense, X] = useState({
    kind: 'mkt',
    amount: '',
    date: today(),
    notes: '',
  });
  const [cashout, C] = useState({
    partner_id: data.partners.find((partner) => !partner.archived)?.id || '',
    amount: '',
    date: today(),
    notes: '',
  });
  const yearRows = results.filter((row) => row.year === year);
  const yearTotals = totalsOf(yearRows);
  const partners = data.partners.filter((partner) => !partner.archived);
  const caja = cashoutsByMonth(data.cashouts, partners, year);
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
    } finally {
      B(false);
    }
  }
  return (
    <div className="account-board">
      <p className="hint">
        El resultado toma pedidos cerrados. Marketing y comisiones se cargan a
        mano. La ganancia del mes es facturación menos costo, marketing y
        comisiones. Los cashouts no se inventan: quedan registrados cuando los
        cargas.
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
          ['Facturación', yearTotals.billed],
          ['Costo', yearTotals.cost],
          ['Ganancia', yearTotals.profit],
          [
            'Cashouts',
            data.cashouts
              .filter((row) => row.date.startsWith(String(year)))
              .reduce((sum, row) => sum + row.amount, 0),
          ],
        ].map(([label, value]) => (
          <article className="metric" key={String(label)}>
            <p>{label}</p>
            <strong className={Number(value) < 0 ? 'money-neg' : ''}>
              {money(Number(value))}
            </strong>
            <span>
              {label === 'Ganancia'
                ? yearTotals.margin == null
                  ? 'Sin facturación en el año'
                  : `Margen ${yearTotals.margin}%`
                : `${year}`}
            </span>
          </article>
        ))}
      </div>
      <div className="account-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Resultado {year}</h2>
            <span>{yearTotals.orders} pedidos cerrados</span>
          </div>
          <div className="desktop-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Facturación</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>MKT</TableHead>
                  <TableHead>Comisiones</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead>Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearRows.length ? (
                  yearRows.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>{money(row.billed)}</TableCell>
                      <TableCell>{money(row.cost)}</TableCell>
                      <TableCell>{money(row.mkt)}</TableCell>
                      <TableCell>{money(row.commissions)}</TableCell>
                      <TableCell className={row.profit < 0 ? 'money-neg' : ''}>
                        {money(row.profit)}
                      </TableCell>
                      <TableCell>
                        {row.margin == null ? '—' : `${row.margin}%`}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      No hay pedidos cerrados ni gastos en {year}.
                    </TableCell>
                  </TableRow>
                )}
                {yearRows.length ? (
                  <TableRow className="account-total">
                    <TableCell>Total</TableCell>
                    <TableCell>{money(yearTotals.billed)}</TableCell>
                    <TableCell>{money(yearTotals.cost)}</TableCell>
                    <TableCell>{money(yearTotals.mkt)}</TableCell>
                    <TableCell>{money(yearTotals.commissions)}</TableCell>
                    <TableCell
                      className={yearTotals.profit < 0 ? 'money-neg' : ''}
                    >
                      {money(yearTotals.profit)}
                    </TableCell>
                    <TableCell>
                      {yearTotals.margin == null
                        ? '—'
                        : `${yearTotals.margin}%`}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="record-card-list">
            {yearRows.map((row) => (
              <article className="record-card" key={row.month}>
                <div className="record-card-top">
                  <b>{row.label}</b>
                  <span>{row.margin == null ? '—' : `${row.margin}%`}</span>
                </div>
                <dl className="record-card-facts">
                  <div>
                    <dt>Facturación</dt>
                    <dd>{money(row.billed)}</dd>
                  </div>
                  <div>
                    <dt>Costo</dt>
                    <dd>{money(row.cost)}</dd>
                  </div>
                  <div>
                    <dt>MKT</dt>
                    <dd>{money(row.mkt)}</dd>
                  </div>
                  <div>
                    <dt>Comisiones</dt>
                    <dd>{money(row.commissions)}</dd>
                  </div>
                  <div>
                    <dt>Ganancia</dt>
                    <dd className={row.profit < 0 ? 'money-neg' : ''}>
                      {money(row.profit)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Caja de socios</h2>
            <span>{partners.length} socios</span>
          </div>
          {partners.length ? (
            <>
              <div className="desktop-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      {partners.map((partner) => (
                        <TableHead key={partner.id}>{partner.name}</TableHead>
                      ))}
                      <TableHead>Cashout</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caja.length ? (
                      caja.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.label}</TableCell>
                          {partners.map((partner) => (
                            <TableCell key={partner.id}>
                              {row.byPartner[partner.id]
                                ? money(row.byPartner[partner.id] || 0)
                                : '—'}
                            </TableCell>
                          ))}
                          <TableCell>{money(row.total)}</TableCell>
                          <TableCell>{row.lastDate || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={partners.length + 3}>
                          Todavía no hay cashouts en {year}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="record-card-list">
                {caja.map((row) => (
                  <article className="record-card" key={row.month}>
                    <div className="record-card-top">
                      <b>{row.label}</b>
                      <span>{money(row.total)}</span>
                    </div>
                    <dl className="record-card-facts">
                      {partners.map((partner) => (
                        <div key={partner.id}>
                          <dt>{partner.name}</dt>
                          <dd>{money(row.byPartner[partner.id] || 0)}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="hint">
              Agregá un socio para registrar cashouts a su nombre.
            </p>
          )}
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Movimientos {year}</h2>
          <span>Ganancia y cashouts</span>
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
                {entry.notes ? ` · ${entry.notes}` : ''} · saldo{' '}
                {money(entry.balance)}
              </small>
            </article>
          ))}
        </div>
      </section>
      <div className="account-forms">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              {
                action: 'expense',
                kind: expense.kind,
                amount: parseDecimal(expense.amount),
                date: expense.date,
                notes: expense.notes,
              },
              () => X({ ...expense, amount: '', notes: '' }),
            );
          }}
        >
          <h3>Registrar gasto</h3>
          <div className="form-grid">
            <Field label="Tipo *">
              <Pick
                label="Tipo de gasto"
                value={expense.kind}
                onChange={(v) => X({ ...expense, kind: v })}
                options={[
                  { value: 'mkt', label: 'Marketing' },
                  { value: 'comisiones', label: 'Comisiones' },
                ]}
              />
            </Field>
            <Field label="Importe *">
              <input
                inputMode="decimal"
                required
                value={expense.amount}
                onChange={(e) => X({ ...expense, amount: e.target.value })}
              />
            </Field>
            <Field label="Fecha *">
              <input
                type="date"
                required
                value={expense.date}
                onChange={(e) => X({ ...expense, date: e.target.value })}
              />
            </Field>
            <Field label="Notas" wide>
              <input
                value={expense.notes}
                onChange={(e) => X({ ...expense, notes: e.target.value })}
              />
            </Field>
          </div>
          <button className="primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Cargar gasto'}
          </button>
        </form>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              {
                action: 'cashout',
                partner_id: cashout.partner_id || partners[0]?.id,
                amount: parseDecimal(cashout.amount),
                date: cashout.date,
                notes: cashout.notes,
              },
              () => C({ ...cashout, amount: '', notes: '' }),
            );
          }}
        >
          <h3>Registrar cashout</h3>
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
          <button className="primary" disabled={busy || !partners.length}>
            {busy ? 'Guardando…' : 'Cargar cashout'}
          </button>
        </form>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run({ action: 'partner', name: partnerName }, () => P(''));
          }}
        >
          <h3>Nuevo socio</h3>
          <Field label="Nombre *">
            <input
              required
              value={partnerName}
              onChange={(e) => P(e.target.value)}
            />
          </Field>
          <button className="secondary" disabled={busy}>
            {busy ? 'Guardando…' : 'Agregar socio'}
          </button>
        </form>
      </div>
    </div>
  );
}
