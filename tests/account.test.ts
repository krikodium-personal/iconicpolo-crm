import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accountLedger,
  allocateShares,
  assertCashoutFits,
  assertSharesComplete,
  cashoutLimit,
  cashoutsByMonth,
  monthlyResults,
  partnerBalances,
  partnerRemaining,
  remainingProfit,
  shareLabel,
  totalsOf,
  yearSheet,
} from '../lib/account.ts';
import type {
  AccountExpense,
  Order,
  Partner,
  PartnerCashout,
} from '../lib/types.ts';

const partners: Partner[] = [
  { id: 'ivan', name: 'Ivan', share: 5000, archived: 0, version: 1 },
  { id: 'pablo', name: 'Pablo', share: 5000, archived: 0, version: 1 },
];

function order(
  id: string,
  date: string,
  total: number,
  cost: number,
  status = 'cerrado',
): Order {
  return {
    id,
    number: id,
    customer_id: 'c1',
    date,
    delivery: '',
    status,
    paid: total,
    invoice: 1,
    notes: '',
    currency: 'USD',
    total,
    cost,
    archived: 0,
    deleted: 0,
    version: 1,
    items: [],
  };
}

test('monthly result subtracts product cost, marketing and commissions', () => {
  const expenses: AccountExpense[] = [
    {
      id: 'e1',
      kind: 'mkt',
      amount: 82_000,
      date: '2026-01-12',
      notes: '',
      created_at: '',
    },
    {
      id: 'e2',
      kind: 'comisiones',
      amount: 9_500,
      date: '2026-01-20',
      notes: '',
      created_at: '',
    },
  ];
  const rows = monthlyResults(
    [
      order('o1', '2026-01-05', 828_185, 453_900),
      order('o2', '2026-01-18', 0, 0, 'abierto'),
    ],
    expenses,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.label, 'Enero');
  assert.equal(rows[0]?.billed, 828_185);
  assert.equal(rows[0]?.cost, 453_900);
  assert.equal(rows[0]?.mkt, 82_000);
  assert.equal(rows[0]?.commissions, 9_500);
  assert.equal(rows[0]?.profit, 282_785);
  assert.equal(rows[0]?.margin, 34.15);
});

test('ledger credits monthly profit and debits partner cashouts', () => {
  const results = monthlyResults(
    [order('o1', '2026-01-05', 100_000, 40_000)],
    [],
  );
  const cashouts: PartnerCashout[] = [
    {
      id: 'c1',
      partner_id: 'ivan',
      amount: 20_000,
      date: '2026-01-18',
      notes: 'Retiro',
      created_at: '',
    },
  ];
  const ledger = accountLedger(results, cashouts, partners);
  assert.equal(ledger[0]?.kind, 'ganancia');
  assert.equal(ledger[0]?.amount, 60_000);
  assert.equal(ledger[1]?.kind, 'cashout');
  assert.equal(ledger[1]?.amount, -20_000);
  assert.equal(ledger[1]?.partner, 'Ivan');
  assert.equal(ledger.at(-1)?.balance, 40_000);
  const caja = cashoutsByMonth(cashouts, partners, 2026);
  assert.equal(caja[0]?.label, 'Enero');
  assert.equal(caja[0]?.byPartner.ivan, 20_000);
  assert.equal(caja[0]?.byPartner.pablo, 0);
});

test('collected orders count even if they are still open', () => {
  const paidOpen = order('o1', '2026-03-12', 40_000, 15_000, 'nuevo');
  const unpaidClosed = order('o2', '2026-03-12', 80_000, 20_000, 'cerrado');
  unpaidClosed.paid = 0;
  const rows = monthlyResults([paidOpen, unpaidClosed], []);
  assert.equal(rows[0]?.billed, 40_000);
  assert.equal(rows[0]?.cost, 15_000);
  assert.equal(rows[0]?.profit, 25_000);
  assert.equal(rows[0]?.orders, 1);
});

test('deleted orders are excluded from monthly results', () => {
  const live = order('o1', '2026-04-02', 50_000, 20_000);
  const gone = order('o2', '2026-04-02', 90_000, 30_000);
  gone.deleted = 1;
  const archived = order('o3', '2026-04-02', 70_000, 10_000);
  archived.archived = 1;
  const rows = monthlyResults([live, gone, archived], []);
  assert.equal(rows[0]?.billed, 50_000);
  assert.equal(rows[0]?.cost, 20_000);
  assert.equal(rows[0]?.orders, 1);
});

test('ledger includes partner-paid account movements', () => {
  const results = monthlyResults(
    [order('o1', '2026-01-05', 100_000, 40_000)],
    [],
  );
  const ledger = accountLedger(
    results,
    [],
    partners,
    [
      {
        id: 'm1',
        concept: 'pago_proveedor',
        detail: 'Cuero crupon',
        partner_id: 'ivan',
        supplier_id: 'sup1',
        amount: 10_000,
        currency: 'USD',
        date: '2026-01-10',
        created_at: '',
      },
    ],
    'USD',
    new Map([['sup1', 'Talabarteria']]),
  );
  assert.equal(ledger[1]?.kind, 'movimiento');
  assert.equal(ledger[1]?.label, 'Pago proveedor · Talabarteria · Cuero crupon');
  assert.equal(ledger[1]?.amount, -10_000);
  assert.equal(ledger[1]?.partner, 'Ivan');
  assert.equal(ledger.at(-1)?.balance, 50_000);
});

test('year sheet fills every month and remaining profit subtracts cashouts', () => {
  const rows = monthlyResults(
    [order('o1', '2026-01-05', 100_000, 40_000)],
    [],
  );
  const sheet = yearSheet(2026, rows);
  assert.equal(sheet.length, 12);
  assert.equal(sheet[0]?.profit, 60_000);
  assert.equal(sheet[1]?.label, 'Febrero');
  assert.equal(sheet[1]?.profit, 0);
  const leftover = remainingProfit(totalsOf(rows).profit, [
    {
      id: 'c1',
      partner_id: 'ivan',
      amount: 25_000,
      date: '2026-01-20',
      notes: '',
      created_at: '',
    },
  ]);
  assert.equal(leftover, 35_000);
  assert.throws(
    () => assertCashoutFits(leftover, 40_000),
    /queda en cuenta/,
  );
  assert.doesNotThrow(() => assertCashoutFits(leftover, 35_000));
});

test('partner shares must add up to 100 percent', () => {
  assert.equal(shareLabel(5000), '50%');
  assert.doesNotThrow(() => assertSharesComplete(partners));
  assert.throws(
    () =>
      assertSharesComplete([
        { ...partners[0]!, share: 4000 },
        partners[1]!,
      ]),
    /sumar 100/,
  );
  const leftover = 280_00;
  const profit = 280_00;
  assert.equal(partnerRemaining(profit, partners[0]!, [], partners), 140_00);
  assert.equal(cashoutLimit(partners[0], profit, [], partners), 140_00);
  assert.equal(
    cashoutLimit(
      partners[0],
      profit,
      [
        {
          id: 'c1',
          partner_id: 'ivan',
          amount: 40_00,
          date: '2026-01-20',
          notes: '',
          created_at: '',
        },
      ],
      partners,
    ),
    100_00,
  );
  const odd = allocateShares(101, partners);
  assert.equal(odd.get('ivan'), 51);
  assert.equal(odd.get('pablo'), 50);
  assert.equal(
    cashoutLimit(
      { ...partners[0]!, share: 0 },
      profit,
      [],
      [{ ...partners[0]!, share: 0 }, { ...partners[1]!, share: 0 }],
    ),
    0,
  );
  const [ivan] = partnerBalances(profit, partners, []);
  assert.equal(ivan?.assigned, 140_00);
  assert.equal(ivan?.available, 140_00);
  assert.equal(leftover, 280_00);
});

test('year totals keep the same profit formula', () => {
  const rows = monthlyResults(
    [
      order('o1', '2026-01-05', 50_000, 20_000),
      order('o2', '2026-02-05', 80_000, 30_000),
    ],
    [
      {
        id: 'e1',
        kind: 'mkt',
        amount: 5_000,
        date: '2026-02-10',
        notes: '',
        created_at: '',
      },
    ],
  );
  const year = totalsOf(rows);
  assert.equal(year.billed, 130_000);
  assert.equal(year.cost, 50_000);
  assert.equal(year.mkt, 5_000);
  assert.equal(year.profit, 75_000);
});
