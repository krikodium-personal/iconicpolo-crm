import assert from 'node:assert/strict';
import test from 'node:test';

import {
  discounted,
  fixedLineTotals,
  increaseByPercent,
  lineTotals,
  margin,
  markup,
  orderDiscountPercent,
  parseDecimal,
  promoPrice,
  parsePercent,
  percent,
  ratio,
  arsFromUsd,
} from '../lib/money.ts';

test('parses money and percentages into safe integer units', () => {
  assert.equal(parseDecimal('680000,50'), 68_000_050);
  assert.equal(parseDecimal('15'), 1_500);
  assert.throws(() => parseDecimal('1.234,50'));
  assert.equal(percent(1_500), '15');
  assert.equal(parsePercent('15'), 1_500);
  assert.throws(() => parsePercent('15.00'));
});

test('converts dollars to pesos with the taken exchange rate', () => {
  assert.equal(arsFromUsd(10_000, 148_050), 14_805_000);
  assert.equal(arsFromUsd(5_000, 100_000), 5_000_000);
  assert.throws(() => arsFromUsd(10_000, 0));
});

test('uses half-up rounding for basis-point calculations', () => {
  assert.equal(ratio(101, 5_000), 51);
  assert.equal(discounted(68_000_000, 1_500), 57_800_000);
});

test('increases amounts by a percentage with half-up rounding', () => {
  assert.equal(increaseByPercent(10_000, 1_000), 11_000);
  assert.equal(increaseByPercent(101, 5_000), 152);
  assert.throws(() => increaseByPercent(10_000, 0));
});

test('calculates line sale, cost and profit after discount', () => {
  assert.deepEqual(lineTotals(10_000, 6_000, 3, 1_000), {
    total: 27_000,
    cost: 18_000,
    profit: 9_000,
  });
});

test('calculates line sale from a fixed unit price', () => {
  assert.deepEqual(fixedLineTotals(8_500, 6_000, 3), {
    total: 25_500,
    cost: 18_000,
    profit: 7_500,
  });
});

test('reports margin over sale and profitability over cost separately', () => {
  assert.equal(margin(10_000, 6_000), 40);
  assert.equal(markup(10_000, 6_000), 66.67);
  assert.equal(margin(0, 0), null);
  assert.equal(markup(1_000, 0), null);
});

test('reports the effective discount of an order from its lines', () => {
  assert.equal(
    orderDiscountPercent({
      total: 27_000,
      items: [{ unit_price: 10_000, quantity: 3 }],
    }),
    10,
  );
  assert.equal(
    orderDiscountPercent({
      total: 10_000,
      items: [{ unit_price: 10_000, quantity: 1 }],
    }),
    0,
  );
  assert.equal(
    orderDiscountPercent({
      total: 178_400,
      items: [
        { unit_price: 32_000, quantity: 4, list_unit_price: 40_000 },
        { unit_price: 10_000, quantity: 4, list_unit_price: 10_000 },
        { unit_price: 4_000, quantity: 4, list_unit_price: 4_000 },
      ],
    }),
    17.41,
  );
});

test('supports percentage and manual promotional prices', () => {
  assert.equal(
    promoPrice({ price: 10_000, promo_kind: 'percent', promo_value: 2_500 }),
    7_500,
  );
  assert.equal(
    promoPrice({ price: 10_000, promo_kind: 'manual', promo_value: 7_990 }),
    7_990,
  );
});
