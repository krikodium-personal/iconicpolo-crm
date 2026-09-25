import type {
  AccountEntry,
  AccountExpense,
  Order,
  Partner,
  PartnerCashout,
} from './types';

export const SHARE_TOTAL = 10000;

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export type MonthKey = `${number}-${string}`;

export type MonthlyResult = {
  month: MonthKey;
  year: number;
  monthIndex: number;
  label: string;
  billed: number;
  cost: number;
  mkt: number;
  commissions: number;
  profit: number;
  margin: number | null;
  orders: number;
};

export type LedgerEntry = {
  date: string;
  label: string;
  kind: 'ganancia' | 'cobro' | 'cashout' | 'movimiento';
  amount: number;
  currency?: string;
  partner?: string;
  actor?: string;
  notes: string;
  receipt?: string;
  fx_rate?: number;
  amount_ars?: number;
  order_id?: string;
  balance: number;
};

export function monthKey(isoDate: string): MonthKey {
  return isoDate.slice(0, 7) as MonthKey;
}

export function monthLabel(key: MonthKey) {
  const monthIndex = Number(key.slice(5, 7)) - 1;
  return MONTHS[monthIndex] || key;
}

export function monthAnchorDate(key: MonthKey) {
  return `${key}-01`;
}

export function collectedOrders(orders: Order[]) {
  return orders.filter(
    (order) =>
      !order.archived &&
      !order.deleted &&
      order.paid > 0 &&
      order.status !== 'cotización',
  );
}

export function yearSheet(year: number, results: MonthlyResult[]) {
  return MONTHS.map((label, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}` as MonthKey;
    return (
      results.find((row) => row.month === month) || {
        month,
        year,
        monthIndex: index,
        label,
        billed: 0,
        cost: 0,
        mkt: 0,
        commissions: 0,
        profit: 0,
        margin: null,
        orders: 0,
      }
    );
  });
}

export const ACCOUNT_CONCEPTS = [
  { id: 'pago_proveedor', label: 'Pago proveedor' },
  { id: 'gasto_publicitario', label: 'Gasto publicitario' },
  { id: 'gastos_extras', label: 'Gastos extras' },
  { id: 'otros', label: 'Otros' },
] as const;

export function conceptLabel(
  concept: AccountEntry['concept'],
  detail = '',
  supplier = '',
) {
  const extra = detail.trim();
  if (concept === 'pago_proveedor') {
    return ['Pago proveedor', supplier.trim(), extra].filter(Boolean).join(' · ');
  }
  if (concept === 'otros') {
    return extra ? `Otros · ${extra}` : 'Otros';
  }
  return (
    ACCOUNT_CONCEPTS.find((item) => item.id === concept)?.label || concept
  );
}

export function entryTotal(
  entries: AccountEntry[],
  currency?: string,
) {
  return entries.reduce((sum, row) => {
    if (!currency || row.currency === currency) return sum + row.amount;
    if (currency === 'ARS' && row.currency === 'USD')
      return sum + (row.amount_ars || 0);
    return sum;
  }, 0);
}

export function cashoutTotal(cashouts: PartnerCashout[]) {
  return cashouts.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Cobros que alimentan “En cuenta”: facturado − MKT − comisiones.
 * No resta el costo del pedido; ese egreso solo cuenta si hay un movimiento
 * (pago proveedor / etc.) en `account_entries`.
 */
export function accountInflow(totals: {
  billed: number;
  mkt: number;
  commissions: number;
}) {
  return totals.billed - totals.mkt - totals.commissions;
}

/** Dinero en cuenta = cobros netos − cashouts − movimientos. */
export function remainingProfit(
  inflow: number,
  cashouts: PartnerCashout[],
  entries: AccountEntry[] = [],
  currency?: string,
) {
  return inflow - cashoutTotal(cashouts) - entryTotal(entries, currency);
}

export function assertCashoutFits(remaining: number, amount: number) {
  if (amount > remaining) {
    throw new Error(
      remaining <= 0
        ? 'No hay ganancia disponible para retirar.'
        : 'El cashout no puede superar lo que queda en cuenta.',
    );
  }
}

export function parseShare(value: string) {
  if (!value.trim()) return 0;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized))
    throw new Error('Ingresá un porcentaje con hasta 2 decimales.');
  const [whole, fraction = ''] = normalized.split('.');
  const share = Number(
    BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')),
  );
  if (share > SHARE_TOTAL)
    throw new Error('El porcentaje no puede superar 100%.');
  return share;
}

export function shareInput(share: number) {
  if (!share) return '';
  const whole = Math.trunc(share / 100);
  const fraction = share % 100;
  return fraction
    ? `${whole},${String(fraction).padStart(2, '0')}`.replace(/0$/, '')
    : String(whole);
}

export function shareLabel(share: number) {
  return `${shareInput(share) || '0'}%`;
}

export function sharesTotal(partners: Partner[]) {
  return partners
    .filter((partner) => !partner.archived)
    .reduce((sum, partner) => sum + (partner.share || 0), 0);
}

export function sharesAreComplete(partners: Partner[]) {
  const active = partners.filter((partner) => !partner.archived);
  return active.length > 0 && sharesTotal(active) === SHARE_TOTAL;
}

export function assertSharesComplete(partners: Partner[]) {
  if (!partners.filter((partner) => !partner.archived).length) return;
  if (!sharesAreComplete(partners))
    throw new Error('Los porcentajes de los socios deben sumar 100%.');
}

export function partnerShareOf(amount: number, share: number) {
  if (!share) return 0;
  return Number((BigInt(amount) * BigInt(share) + 5000n) / 10000n);
}

export function allocateShares(amount: number, partners: Partner[]) {
  const active = partners.filter((partner) => !partner.archived);
  const parts = new Map<string, number>();
  let used = 0;
  active.forEach((partner, index) => {
    const part =
      index === active.length - 1
        ? amount - used
        : partnerShareOf(amount, partner.share);
    parts.set(partner.id, part);
    used += part;
  });
  return parts;
}

export function partnerTaken(partnerId: string, cashouts: PartnerCashout[]) {
  return cashouts
    .filter((cashout) => cashout.partner_id === partnerId)
    .reduce((sum, cashout) => sum + cashout.amount, 0);
}

export type PartnerBalance = {
  partner: Partner;
  assigned: number;
  taken: number;
  available: number;
};

export function partnerBalances(
  profit: number,
  partners: Partner[],
  cashouts: PartnerCashout[],
): PartnerBalance[] {
  const assigned = allocateShares(profit, partners);
  return partners
    .filter((partner) => !partner.archived)
    .map((partner) => {
      const share = assigned.get(partner.id) || 0;
      const taken = partnerTaken(partner.id, cashouts);
      return {
        partner,
        assigned: share,
        taken,
        available: share - taken,
      };
    });
}

export function partnerRemaining(
  profit: number,
  partner: Partner,
  cashouts: PartnerCashout[],
  partners: Partner[],
) {
  return (
    (allocateShares(profit, partners).get(partner.id) || 0) -
    partnerTaken(partner.id, cashouts)
  );
}

export function cashoutLimit(
  partner: Partner | undefined,
  profit: number,
  cashouts: PartnerCashout[],
  partners: Partner[],
) {
  if (!partner || !sharesAreComplete(partners)) return 0;
  return Math.max(0, partnerRemaining(profit, partner, cashouts, partners));
}

export function monthlyResults(
  orders: Order[],
  expenses: AccountExpense[],
): MonthlyResult[] {
  const buckets = new Map<
    MonthKey,
    {
      billed: number;
      cost: number;
      mkt: number;
      commissions: number;
      orders: number;
    }
  >();
  function bucket(key: MonthKey) {
    const current = buckets.get(key) || {
      billed: 0,
      cost: 0,
      mkt: 0,
      commissions: 0,
      orders: 0,
    };
    buckets.set(key, current);
    return current;
  }
  for (const order of collectedOrders(orders)) {
    const row = bucket(monthKey(order.date));
    row.billed += order.paid;
    row.cost += order.cost;
    row.orders += 1;
  }
  for (const expense of expenses) {
    const row = bucket(monthKey(expense.date));
    if (expense.kind === 'mkt') row.mkt += expense.amount;
    else row.commissions += expense.amount;
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, row]) => {
      const profit = row.billed - row.cost - row.mkt - row.commissions;
      return {
        month,
        year: Number(month.slice(0, 4)),
        monthIndex: Number(month.slice(5, 7)) - 1,
        label: monthLabel(month),
        billed: row.billed,
        cost: row.cost,
        mkt: row.mkt,
        commissions: row.commissions,
        profit,
        margin: row.billed
          ? Math.round((profit / row.billed) * 10000) / 100
          : null,
        orders: row.orders,
      };
    });
}

export function totalsOf(
  rows: MonthlyResult[],
): Omit<MonthlyResult, 'month' | 'year' | 'monthIndex' | 'label'> {
  const billed = rows.reduce((sum, row) => sum + row.billed, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const mkt = rows.reduce((sum, row) => sum + row.mkt, 0);
  const commissions = rows.reduce((sum, row) => sum + row.commissions, 0);
  const profit = billed - cost - mkt - commissions;
  return {
    billed,
    cost,
    mkt,
    commissions,
    profit,
    margin: billed ? Math.round((profit / billed) * 10000) / 100 : null,
    orders: rows.reduce((sum, row) => sum + row.orders, 0),
  };
}

export function accountLedger(
  _results: MonthlyResult[],
  cashouts: PartnerCashout[],
  partners: Partner[],
  entries: AccountEntry[] = [],
  boardCurrency = 'USD',
  supplierNames: Map<string, string> = new Map(),
  orders: Order[] = [],
  customerNames: Map<string, string> = new Map(),
): LedgerEntry[] {
  const names = new Map(partners.map((partner) => [partner.id, partner.name]));
  const orderNumbers = new Map(orders.map((order) => [order.id, order.number]));
  const cobros = collectedOrders(orders).map((order) => {
    const customer = customerNames.get(order.customer_id) || 'Sin cliente';
    return {
      date: order.date,
      label: `Cobro · ${order.number}`,
      kind: 'cobro' as const,
      amount: order.paid,
      currency: order.currency || boardCurrency,
      partner: names.get(order.paid_partner_id) || undefined,
      notes: customer,
      order_id: order.id,
    };
  });
  const raw: Omit<LedgerEntry, 'balance'>[] = [
    ...cobros,
    ...cashouts.map((cashout) => ({
      date: cashout.date,
      label: 'Cashout',
      kind: 'cashout' as const,
      amount: -cashout.amount,
      currency: boardCurrency,
      partner: names.get(cashout.partner_id),
      actor: names.get(cashout.created_by || '') || undefined,
      notes: cashout.notes,
    })),
    ...entries.map((entry) => {
      const orderNumber = entry.order_id
        ? orderNumbers.get(entry.order_id)
        : '';
      return {
        date: entry.date,
        label: conceptLabel(
          entry.concept,
          entry.detail,
          supplierNames.get(entry.supplier_id || '') || '',
        ),
        kind: 'movimiento' as const,
        amount: -entry.amount,
        currency: entry.currency,
        partner: names.get(entry.partner_id),
        actor: names.get(entry.created_by || '') || undefined,
        notes: orderNumber ? `Pedido ${orderNumber}` : '',
        receipt: entry.receipt || '',
        fx_rate: entry.fx_rate || 0,
        amount_ars: entry.amount_ars || 0,
        order_id: entry.order_id || undefined,
      };
    }),
  ];
  const kindRank = { cobro: 0, ganancia: 1, movimiento: 2, cashout: 3 };
  raw.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate) return byDate;
    return kindRank[a.kind] - kindRank[b.kind];
  });
  let balance = 0;
  return raw.map((entry) => {
    const currency = entry.currency || boardCurrency;
    if (currency === boardCurrency) balance += entry.amount;
    else if (
      boardCurrency === 'ARS' &&
      currency === 'USD' &&
      entry.amount_ars
    )
      balance += entry.kind === 'movimiento' ? -entry.amount_ars : entry.amount_ars;
    return { ...entry, balance };
  });
}

export function cashoutsByMonth(
  cashouts: PartnerCashout[],
  partners: Partner[],
  year: number,
) {
  const active = partners.filter((partner) => !partner.archived);
  return MONTHS.map((label, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}` as MonthKey;
    const inMonth = cashouts.filter(
      (cashout) => monthKey(cashout.date) === key,
    );
    const byPartner = Object.fromEntries(
      active.map((partner) => [
        partner.id,
        inMonth
          .filter((cashout) => cashout.partner_id === partner.id)
          .reduce((sum, cashout) => sum + cashout.amount, 0),
      ]),
    );
    const dates = inMonth.map((cashout) => cashout.date).sort();
    return {
      month: key,
      label,
      byPartner,
      total: inMonth.reduce((sum, cashout) => sum + cashout.amount, 0),
      lastDate: dates.at(-1) || '',
    };
  }).filter((row) => row.total || Object.values(row.byPartner).some(Boolean));
}

export type FinancialPosition = {
  partner: Partner;
  /** Aportes: stock pagado + movimientos de cuenta. */
  investment: number;
  /** Costo de ventas cobradas donde este socio recupera capital. */
  recovered: number;
  /** Inversión menos capital recuperado. */
  pending: number;
  /** Parte de la ganancia según %. */
  profit: number;
  cashouts: number;
  /** Ganancia menos cashouts. */
  available: number;
  /**
   * Liquidación típica de cobros: capital recuperado + ganancia.
   * (Ej.: costo 200 + 50% de 100 = 250.)
   */
  settlement: number;
};

/** Costo recuperable de un pedido cobrado (prorrateado si el cobro es parcial). */
export function orderCostRecovered(order: Order) {
  if (order.paid <= 0 || order.cost <= 0) return 0;
  if (!order.total || order.paid >= order.total) return order.cost;
  return Number(
    (BigInt(order.cost) * BigInt(order.paid) + BigInt(order.total) / 2n) /
      BigInt(order.total),
  );
}

/**
 * Situación financiera por socio:
 * - Inversión = costos de stock que pagó + movimientos de cuenta que pagó
 * - Recuperado = costos de ventas cobradas asignados a ese socio
 * - Ganancia = % sobre la ganancia del negocio (igual que caja de socios)
 */
export function financialSituation(
  profit: number,
  partners: Partner[],
  cashouts: PartnerCashout[],
  orders: Order[],
  movements: {
    product_id: string;
    quantity: number;
    cost_paid?: number;
    paid_partner_id?: string;
  }[],
  products: { id: string; cost: number }[],
  entries: AccountEntry[] = [],
  currency?: string,
): FinancialPosition[] {
  const productCost = new Map(products.map((p) => [p.id, p.cost]));
  const investment = new Map<string, number>();
  const recovered = new Map<string, number>();
  function add(map: Map<string, number>, id: string, amount: number) {
    if (!id || !amount) return;
    map.set(id, (map.get(id) || 0) + amount);
  }
  for (const movement of movements) {
    if (
      movement.quantity <= 0 ||
      !movement.cost_paid ||
      !movement.paid_partner_id
    )
      continue;
    const unit = productCost.get(movement.product_id) || 0;
    add(investment, movement.paid_partner_id, unit * movement.quantity);
  }
  for (const entry of entries) {
    if (!entry.partner_id) continue;
    let amount = 0;
    if (!currency || entry.currency === currency) amount = entry.amount;
    else if (currency === 'ARS' && entry.currency === 'USD')
      amount = entry.amount_ars || 0;
    add(investment, entry.partner_id, amount);
  }
  for (const order of collectedOrders(orders)) {
    if (!order.cost_partner_id) continue;
    add(recovered, order.cost_partner_id, orderCostRecovered(order));
  }
  const assigned = allocateShares(profit, partners);
  return partners
    .filter((partner) => !partner.archived)
    .map((partner) => {
      const invested = investment.get(partner.id) || 0;
      const gotBack = recovered.get(partner.id) || 0;
      const share = assigned.get(partner.id) || 0;
      const taken = partnerTaken(partner.id, cashouts);
      return {
        partner,
        investment: invested,
        recovered: gotBack,
        pending: invested - gotBack,
        profit: share,
        cashouts: taken,
        available: share - taken,
        settlement: gotBack + share,
      };
    });
}

