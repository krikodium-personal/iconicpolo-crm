import type { AccountExpense, Order, Partner, PartnerCashout } from './types';

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
  kind: 'ganancia' | 'cashout';
  amount: number;
  partner?: string;
  notes: string;
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
  return orders.filter((order) => !order.archived && order.paid > 0);
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

export function cashoutTotal(cashouts: PartnerCashout[]) {
  return cashouts.reduce((sum, row) => sum + row.amount, 0);
}

export function remainingProfit(
  profit: number,
  cashouts: PartnerCashout[],
) {
  return profit - cashoutTotal(cashouts);
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
  results: MonthlyResult[],
  cashouts: PartnerCashout[],
  partners: Partner[],
): LedgerEntry[] {
  const names = new Map(partners.map((partner) => [partner.id, partner.name]));
  const raw: Omit<LedgerEntry, 'balance'>[] = [
    ...results
      .filter((row) => row.profit || row.billed || row.mkt || row.commissions)
      .map((row) => ({
        date: monthAnchorDate(row.month),
        label: `Ganancia ${row.label} ${row.year}`,
        kind: 'ganancia' as const,
        amount: row.profit,
        notes: row.orders
          ? `${row.orders} pedido${row.orders === 1 ? '' : 's'} cobrado${row.orders === 1 ? '' : 's'}`
          : '',
      })),
    ...cashouts.map((cashout) => ({
      date: cashout.date,
      label: 'Cashout',
      kind: 'cashout' as const,
      amount: -cashout.amount,
      partner: names.get(cashout.partner_id),
      notes: cashout.notes,
    })),
  ];
  raw.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate) return byDate;
    if (a.kind === b.kind) return 0;
    return a.kind === 'ganancia' ? -1 : 1;
  });
  let balance = 0;
  return raw.map((entry) => {
    balance += entry.amount;
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
