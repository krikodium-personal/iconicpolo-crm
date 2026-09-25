'use client';
import { useEffect, useMemo, useState } from 'react';
import { CrmLink } from './crm-nav';
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
import { Field, Pick, ErrorBox, DateCalendar, Photos } from './ui';
import {
  ACCOUNT_CONCEPTS,
  MONTHS,
  accountInflow,
  accountLedger,
  cashoutLimit,
  financialSituation,
  monthlyResults,
  partnerBalances,
  remainingProfit,
  shareLabel,
  sharesAreComplete,
  totalsOf,
  yearSheet,
  type LedgerEntry,
  type MonthlyResult,
} from '@/lib/account';
import { decimal, formatMoney, formatRate, parseDecimal, arsFromUsd } from '@/lib/money';
import { orderIsLive, type Data, type Order } from '@/lib/types';

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

function previewArs(amount: string, rate: string) {
  try {
    if (!amount.trim() || !rate.trim()) return null;
    return arsFromUsd(parseDecimal(amount), parseDecimal(rate));
  } catch {
    return null;
  }
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
          <dt>Facturación</dt>
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
  onOpenOrder,
}: {
  data: Data;
  save: (body: Record<string, unknown>) => Promise<void>;
  view?: 'board' | 'resultados';
  initialYear?: number;
  onOpenOrder?: (order: Order) => void;
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
      ...(data.entries || []).map((row) => Number(row.date.slice(0, 4))),
    ]);
    return [...set]
      .filter((year) => Number.isFinite(year))
      .sort((a, b) => b - a);
  }, [results, data.cashouts, data.entries]);
  const [year, Y] = useState(() => {
    if (initialYear && years.includes(initialYear)) return initialYear;
    const withData = years.find(
      (value) =>
        results.some((row) => row.year === value) ||
        data.cashouts.some((row) => row.date.startsWith(String(value))) ||
        (data.entries || []).some((row) =>
          row.date.startsWith(String(value)),
        ),
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
  const [entryOpen, setEntryOpen] = useState(false);
  const [cashout, C] = useState({
    partner_id: data.partners.find((partner) => !partner.archived)?.id || '',
    amount: '',
    date: today(),
    notes: '',
  });
  const [entry, setEntry] = useState({
    concept: 'pago_proveedor',
    detail: '',
    partner_id: data.partners.find((partner) => !partner.archived)?.id || '',
    supplier_id: '',
    order_id: '',
    receipt: '',
    amount: '',
    currency: data.currency === 'ARS' ? 'ARS' : 'USD',
    fx_rate: '',
    date: today(),
  });
  const yearRows = yearSheet(year, results);
  const previewRow = yearRows[monthIndex] || yearRows[0];
  const boardTotals = totalsOf(results);
  const allProfit = boardTotals.profit;
  // En cuenta = cobros − MKT − comisiones − cashouts − movimientos.
  // No resta order.cost: el egreso del proveedor solo cuenta como movimiento.
  const leftover = remainingProfit(
    accountInflow(boardTotals),
    data.cashouts,
    data.entries || [],
    data.currency,
  );
  const yearCashouts = data.cashouts
    .filter((row) => row.date.startsWith(String(year)))
    .reduce((sum, row) => sum + row.amount, 0);
  const activeOrders = data.orders.filter(orderIsLive);
  const outstanding = activeOrders.reduce(
    (sum, order) => sum + Math.max(0, order.total - order.paid),
    0,
  );
  const unpaidOrders = activeOrders.filter((order) => order.paid < order.total);
  const partners = data.partners.filter((partner) => !partner.archived);
  const suppliers = data.contacts.filter(
    (contact) => contact.kind === 'supplier' && !contact.archived,
  );
  const supplierNames = useMemo(
    () =>
      new Map(
        data.contacts
          .filter((contact) => contact.kind === 'supplier')
          .map((contact) => [contact.id, contact.name]),
      ),
    [data.contacts],
  );
  const customerNames = useMemo(
    () =>
      new Map(
        data.contacts
          .filter((contact) => contact.kind === 'customer')
          .map((contact) => [contact.id, contact.name]),
      ),
    [data.contacts],
  );
  const ordersById = useMemo(
    () => new Map(data.orders.map((order) => [order.id, order])),
    [data.orders],
  );
  const entrySupplierId = entry.supplier_id || suppliers[0]?.id || '';
  const orderOptions = useMemo(() => {
    const live = data.orders.filter(
      (order) =>
        !order.archived && !order.deleted && order.status !== 'cotización',
    );
    const matched = entrySupplierId
      ? live.filter((order) =>
          order.items.some(
            (item) => item.selections.supplier_id === entrySupplierId,
          ),
        )
      : live;
    const list = matched.length ? matched : live;
    return [...list]
      .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
      .slice(0, 80)
      .map((order) => ({
        value: order.id,
        label: [
          order.number,
          customerNames.get(order.customer_id) || 'Sin cliente',
          order.date,
        ].join(' · '),
      }));
  }, [data.orders, entrySupplierId, customerNames]);
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
  const situation = financialSituation(
    allProfit,
    partners,
    data.cashouts,
    data.orders,
    data.movements,
    data.products,
    data.entries || [],
    data.currency,
  );
  const ledger = accountLedger(
    results,
    data.cashouts,
    data.partners,
    data.entries || [],
    data.currency,
    supplierNames,
    data.orders,
    customerNames,
  );
  const yearLedger = [
    ...ledger.filter((entry) => entry.date.startsWith(String(year))),
  ].reverse();
  // Running cash ledger (cobros − cashouts − movimientos), not leftover/"En cuenta".
  // yearLedger is newest-first, so [0] is the year-end balance.
  const yearEndBalance =
    yearLedger[0]?.balance ??
    ledger.filter((entry) => entry.date < `${year}-01-01`).at(-1)?.balance ??
    0;
  const money = (cents: number) => formatMoney(cents, data.currency);
  function openLedgerOrder(entry: LedgerEntry) {
    if (!entry.order_id || !onOpenOrder) return;
    const order = ordersById.get(entry.order_id);
    if (order) onOpenOrder(order);
  }
  const arsPreview =
    entry.currency === 'USD'
      ? previewArs(entry.amount, entry.fx_rate)
      : null;
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
            label: 'Por cobrar',
            value: outstanding,
            hint: unpaidOrders.length
              ? `${unpaidOrders.length} pedido${unpaidOrders.length === 1 ? '' : 's'} con saldo`
              : 'Sin saldos pendientes',
          },
          {
            label: 'En cuenta',
            value: leftover,
            hint: sharesReady
              ? 'Suma disponible de los socios'
              : 'Definí los % en Configuración',
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
          <CrmLink href={`/?vista=resultados&anio=${year}`}>
            Ver todo <ArrowUpRight size={15} />
          </CrmLink>
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
          <h2>Movimientos {year}</h2>
          <div className="ledger-heading-actions">
            <span
              className={`ledger-heading-saldo${yearEndBalance < 0 ? ' money-neg' : ''}`}
            >
              Saldo {money(yearEndBalance)}
            </span>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                E('');
                setEntry({
                  concept: 'pago_proveedor',
                  detail: '',
                  partner_id: partners[0]?.id || '',
                  supplier_id: suppliers[0]?.id || '',
                  order_id: '',
                  receipt: '',
                  amount: '',
                  currency: data.currency === 'ARS' ? 'ARS' : 'USD',
                  fx_rate: '',
                  date: today(),
                });
                setEntryOpen(true);
              }}
            >
              <Plus size={15} /> movimiento
            </button>
          </div>
        </div>
        <div className="desktop-table ledger-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-col-date">Fecha</TableHead>
                <TableHead className="ledger-col-movement">Movimiento</TableHead>
                <TableHead className="ledger-col-amount">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearLedger.length ? (
                yearLedger.map((entry, index) => {
                  const clickable =
                    !!entry.order_id &&
                    !!onOpenOrder &&
                    ordersById.has(entry.order_id);
                  return (
                    <TableRow
                      key={`${entry.date}-${entry.label}-${index}`}
                      className={clickable ? 'clickable-row' : undefined}
                      onClick={
                        clickable ? () => openLedgerOrder(entry) : undefined
                      }
                    >
                      <TableCell className="ledger-col-date">
                        {entry.date}
                      </TableCell>
                      <TableCell className="ledger-col-movement">
                        {clickable ? (
                          <button
                            type="button"
                            className="record-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLedgerOrder(entry);
                            }}
                          >
                            {entry.label}
                          </button>
                        ) : (
                          entry.label
                        )}
                        {entry.partner ? ` · ${entry.partner}` : ''}
                        {entry.actor ? ` · Registrado por ${entry.actor}` : ''}
                        {entry.notes ? ` · ${entry.notes}` : ''}
                        {entry.receipt ? (
                          <a
                            className="entry-receipt"
                            href={entry.receipt}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Factura
                          </a>
                        ) : null}
                      </TableCell>
                      <TableCell
                        className={`ledger-col-amount${entry.amount < 0 ? ' money-neg' : ''}`}
                      >
                        {formatMoney(
                          entry.amount,
                          entry.currency || data.currency,
                        )}
                        {entry.currency === 'USD' && entry.amount_ars ? (
                          <small className="entry-fx">
                            {formatMoney(entry.amount_ars, 'ARS')} · TC{' '}
                            {formatRate(entry.fx_rate || 0)}
                          </small>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>
                    No hay movimientos para mostrar en {year}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="record-card-list ledger-list">
          {yearLedger.map((entry, index) => {
            const clickable =
              !!entry.order_id &&
              !!onOpenOrder &&
              ordersById.has(entry.order_id);
            return (
              <article
                className={`ledger-row${clickable ? ' clickable-row' : ''}`}
                key={`${entry.date}-${entry.label}-${index}`}
                onClick={clickable ? () => openLedgerOrder(entry) : undefined}
              >
                <div className="ledger-row-top">
                  {clickable ? (
                    <button
                      type="button"
                      className="record-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLedgerOrder(entry);
                      }}
                    >
                      {entry.label}
                    </button>
                  ) : (
                    <b>{entry.label}</b>
                  )}
                  <span className={entry.amount < 0 ? 'money-neg' : ''}>
                    {formatMoney(
                      entry.amount,
                      entry.currency || data.currency,
                    )}
                  </span>
                </div>
                <small>
                  {entry.date}
                  {entry.partner ? ` · ${entry.partner}` : ''}
                  {entry.actor ? ` · Registrado por ${entry.actor}` : ''}
                  {entry.notes ? ` · ${entry.notes}` : ''}
                  {entry.receipt ? ' · factura' : ''}
                  {entry.currency === 'USD' && entry.amount_ars
                    ? ` · ${formatMoney(entry.amount_ars, 'ARS')} · TC ${formatRate(entry.fx_rate || 0)}`
                    : ''}
                </small>
              </article>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Situación financiera</h2>
        </div>
        <p className="hint">
          Inversión = costos de stock pagados + movimientos. En cada venta, un
          socio recupera el costo del proveedor; la ganancia se reparte según el
          %. Ejemplo: costo 200, venta 300 → quien recupera cobra 250 y el otro
          50.
        </p>
        {partners.length ? (
          <>
            <div className="desktop-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Inversión</TableHead>
                    <TableHead>Capital recuperado</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Liquidación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {situation.map((row) => (
                    <TableRow key={row.partner.id}>
                      <TableCell>
                        {row.partner.name}
                        <small>{shareLabel(row.partner.share)}</small>
                      </TableCell>
                      <TableCell>{money(row.investment)}</TableCell>
                      <TableCell>
                        {row.recovered ? money(row.recovered) : '—'}
                      </TableCell>
                      <TableCell
                        className={row.pending > 0 ? 'money-neg' : ''}
                      >
                        {money(row.pending)}
                      </TableCell>
                      <TableCell>{money(row.profit)}</TableCell>
                      <TableCell>{money(row.settlement)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="record-card-list partner-balance-cards">
              {situation.map((row) => (
                <article className="record-card" key={row.partner.id}>
                  <div className="record-card-top">
                    <b>
                      {row.partner.name}
                      {row.partner.share
                        ? ` · ${shareLabel(row.partner.share)}`
                        : ''}
                    </b>
                    <span className={row.pending > 0 ? 'money-neg' : ''}>
                      {money(row.pending)}
                    </span>
                  </div>
                  <dl className="record-card-facts">
                    <div>
                      <dt>Inversión</dt>
                      <dd>{money(row.investment)}</dd>
                    </div>
                    <div>
                      <dt>Recuperado</dt>
                      <dd>{row.recovered ? money(row.recovered) : '—'}</dd>
                    </div>
                    <div>
                      <dt>Ganancia</dt>
                      <dd>{money(row.profit)}</dd>
                    </div>
                    <div>
                      <dt>Liquidación</dt>
                      <dd>{money(row.settlement)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="hint">
            Agregá socios en Configuración para ver la situación financiera.
          </p>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Caja de socios</h2>
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
      <Dialog
        open={entryOpen}
        onOpenChange={(open) => {
          setEntryOpen(open);
          if (!open) E('');
        }}
      >
        <DialogContent className="crm-dialog crm-dialog-movement max-[767px]:top-0 max-[767px]:left-0 max-[767px]:right-0 max-[767px]:bottom-0 max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:w-full max-[767px]:max-w-none max-[767px]:h-dvh max-[767px]:max-h-dvh max-[767px]:rounded-none max-[767px]:animate-none">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>
              Un gasto pagado por un socio, con fecha y moneda.
            </DialogDescription>
          </DialogHeader>
          <ErrorBox message={error} />
          {!partners.length ? (
            <p className="hint">
              Agregá un socio en Configuración para indicar quién pagó.
            </p>
          ) : null}
          <form
            className="cashout-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                if (
                  (entry.concept === 'otros' ||
                    entry.concept === 'pago_proveedor') &&
                  !entry.detail.trim()
                ) {
                  throw new Error(
                    entry.concept === 'pago_proveedor'
                      ? 'Describí el concepto del gasto.'
                      : 'Especificá el concepto.',
                  );
                }
                if (
                  entry.concept === 'pago_proveedor' &&
                  !(entry.supplier_id || suppliers[0]?.id)
                ) {
                  throw new Error('Elegí el proveedor.');
                }
                const amount = parseDecimal(entry.amount);
                const fxRate =
                  entry.currency === 'USD'
                    ? parseDecimal(entry.fx_rate)
                    : 0;
                if (entry.currency === 'USD' && !fxRate) {
                  throw new Error('Tipo de cambio: debe ser mayor a cero.');
                }
                if (!partners.length) {
                  throw new Error(
                    'Agregá un socio en Configuración para indicar quién pagó.',
                  );
                }
                void run(
                  {
                    action: 'account_entry',
                    concept: entry.concept,
                    detail: entry.detail,
                    partner_id: entry.partner_id || partners[0]?.id,
                    supplier_id: entry.supplier_id || suppliers[0]?.id,
                    order_id:
                      entry.concept === 'pago_proveedor'
                        ? entry.order_id
                        : '',
                    receipt: entry.receipt,
                    amount,
                    currency: entry.currency,
                    fx_rate: fxRate,
                    date: entry.date,
                  },
                  () => {
                    setEntry({
                      ...entry,
                      detail: '',
                      order_id: '',
                      receipt: '',
                      amount: '',
                      fx_rate: '',
                    });
                    setEntryOpen(false);
                  },
                );
              } catch (err) {
                E((err as Error).message);
              }
            }}
          >
            <div className="form-grid">
              <Field label="Concepto *">
                <Pick
                  label="Concepto"
                  value={entry.concept}
                  onChange={(value) =>
                    setEntry({
                      ...entry,
                      concept: value,
                      detail:
                        value === 'otros' || value === 'pago_proveedor'
                          ? entry.detail
                          : '',
                      supplier_id:
                        value === 'pago_proveedor' ? entry.supplier_id : '',
                      order_id: value === 'pago_proveedor' ? entry.order_id : '',
                      receipt: value === 'pago_proveedor' ? entry.receipt : '',
                    })
                  }
                  options={ACCOUNT_CONCEPTS.map((item) => ({
                    value: item.id,
                    label: item.label,
                  }))}
                />
              </Field>
              <Field label="Pagado por *">
                <Pick
                  label="Pagado por"
                  value={entry.partner_id || partners[0]?.id || ''}
                  onChange={(value) =>
                    setEntry({ ...entry, partner_id: value })
                  }
                  options={partners.map((partner) => ({
                    value: partner.id,
                    label: partner.name,
                  }))}
                />
              </Field>
              {entry.concept === 'pago_proveedor' ? (
                <>
                  <Field label="Proveedor *" wide>
                    {suppliers.length ? (
                      <Pick
                        label="Proveedor"
                        value={entry.supplier_id || suppliers[0]?.id || ''}
                        onChange={(value) =>
                          setEntry({
                            ...entry,
                            supplier_id: value,
                            order_id: '',
                          })
                        }
                        options={suppliers.map((supplier) => ({
                          value: supplier.id,
                          label: supplier.name,
                        }))}
                      />
                    ) : (
                      <p className="hint">
                        Agregá un proveedor en Proveedores para registrar el
                        pago.
                      </p>
                    )}
                  </Field>
                  <Field label="Pedido asociado" wide>
                    <Pick
                      label="Pedido asociado"
                      value={entry.order_id || '__none__'}
                      onChange={(value) =>
                        setEntry({
                          ...entry,
                          order_id: value === '__none__' ? '' : value,
                        })
                      }
                      options={[
                        { value: '__none__', label: 'Sin pedido' },
                        ...orderOptions,
                      ]}
                    />
                  </Field>
                  <Field label="Concepto del gasto *" wide>
                    <input
                      required
                      value={entry.detail}
                      onChange={(e) =>
                        setEntry({ ...entry, detail: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Factura o recibo" wide>
                    <Photos
                      value={entry.receipt ? [entry.receipt] : []}
                      onChange={(urls) =>
                        setEntry({ ...entry, receipt: urls[0] || '' })
                      }
                      onError={E}
                      onBusy={B}
                      max={1}
                      camera
                    />
                  </Field>
                </>
              ) : null}
              {entry.concept === 'otros' ? (
                <Field label="Especificar *" wide>
                  <input
                    required
                    value={entry.detail}
                    onChange={(e) =>
                      setEntry({ ...entry, detail: e.target.value })
                    }
                  />
                </Field>
              ) : null}
              <Field label="Monto *" wide>
                <div className="amount-currency">
                  <Pick
                    label="Moneda"
                    value={entry.currency}
                    onChange={(value) =>
                      setEntry({
                        ...entry,
                        currency: value,
                        fx_rate: value === 'USD' ? entry.fx_rate : '',
                      })
                    }
                    options={[
                      { value: 'ARS', label: 'Pesos' },
                      { value: 'USD', label: 'Dólares' },
                    ]}
                  />
                  <input
                    inputMode="decimal"
                    required
                    value={entry.amount}
                    onChange={(e) =>
                      setEntry({ ...entry, amount: e.target.value })
                    }
                  />
                </div>
              </Field>
              {entry.currency === 'USD' ? (
                <>
                  <Field label="Tipo de cambio *" wide>
                    <input
                      inputMode="decimal"
                      required
                      placeholder="Pesos por dólar"
                      value={entry.fx_rate}
                      onChange={(e) =>
                        setEntry({ ...entry, fx_rate: e.target.value })
                      }
                    />
                  </Field>
                  <p className="entry-fx-preview">
                    {arsPreview != null
                      ? `Equivale a ${formatMoney(arsPreview, 'ARS')}`
                      : 'Ingresá el monto y el tipo de cambio para ver el equivalente en pesos.'}
                  </p>
                </>
              ) : null}
              <Field label="Fecha *" wide>
                <DateCalendar
                  label="Fecha"
                  value={entry.date}
                  onChange={(value) => setEntry({ ...entry, date: value })}
                />
              </Field>
            </div>
            <button
              className="primary"
              disabled={
                busy ||
                !partners.length ||
                (entry.concept === 'pago_proveedor' && !suppliers.length)
              }
            >
              {busy ? 'Guardando…' : 'Cargar movimiento'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
