import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accountLedger,
  cashoutsByMonth,
  monthlyResults,
  totalsOf,
} from '../lib/account.ts';
import type {
  AccountExpense,
  Order,
  Partner,
  PartnerCashout,
} from '../lib/types.ts';

const partners: Partner[] = [
  { id: 'ivan', name: 'Ivan', archived: 0, version: 1 },
  { id: 'pablo', name: 'Pablo', archived: 0, version: 1 },
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
