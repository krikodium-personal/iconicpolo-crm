import assert from 'node:assert/strict';
import test from 'node:test';
import { priceFromList, percent, discounted } from '../lib/money.ts';
import { expandConfiguredPublicItems } from '../lib/public-price-catalog.ts';
import { botaModeloPriceId, BOTA_MODELOS } from '../lib/configure.ts';

test('public list prices apply percent discount or exact override', () => {
  const list = { id: 'orgs', discount: 1500 };
  assert.equal(priceFromList(100_000, list), 85_000);
  assert.equal(priceFromList(100_000, list, { orgs: 70_000 }), 70_000);
  assert.equal(percent(1500), '15');
});

test('expands botas into model prices and priced extras', () => {
  const list = { id: 'orgs', discount: 1500 };
  const base = 50_000;
  const extras: Record<string, { price: number; cost: number }> = {
    [botaModeloPriceId('standard_triple_cuero')]: { price: 5_000, cost: 0 },
    [botaModeloPriceId('polo_argentino_doble_cuero')]: {
      price: 10_000,
      cost: 0,
    },
    [botaModeloPriceId('polo_argentino_triple_cuero')]: {
      price: 15_000,
      cost: 0,
    },
    [botaModeloPriceId('texanas')]: { price: 8_000, cost: 0 },
    a_medida: { price: 12_000, cost: 0 },
    parche: { price: 2_000, cost: 0 },
  };
  const rows = expandConfiguredPublicItems(
    {
      id: 'cfg-bota',
      name: 'Bota',
      sku: 'BOTA',
      category: 'botas',
      price: base,
      kind: 'configured',
      pricing: JSON.stringify({ extras, photos: {} }),
    },
    'Botas',
    list,
  );

  const models = rows.filter((row) => !row.addon);
  const addons = rows.filter((row) => row.addon);

  assert.equal(models.length, BOTA_MODELOS.length);
  assert.deepEqual(
    models.map((row) => row.name),
    BOTA_MODELOS.map((modelo) => modelo.label),
  );

  const clasica = models.find((row) => row.name === 'Clásica doble cuero');
  assert.equal(clasica?.listPrice, base);
  assert.equal(clasica?.price, discounted(base, 1500));

  const premium = models.find((row) => row.name === 'Premium doble cuero');
  assert.equal(premium?.listPrice, base + 10_000);
  assert.equal(
    premium?.price,
    discounted(base, 1500) + discounted(10_000, 1500),
  );

  assert.ok(addons.some((row) => row.name === 'A medida'));
  assert.ok(addons.some((row) => row.name === 'Parche'));
  const medida = addons.find((row) => row.name === 'A medida');
  assert.equal(medida?.listPrice, 12_000);
  assert.equal(medida?.price, discounted(12_000, 1500));
  assert.equal(medida?.addon, true);
});
