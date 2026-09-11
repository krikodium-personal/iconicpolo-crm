import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RODILLERA_FIELDS,
  RODILLERA_SKU_ATTRIBUTES,
  findVariantProduct,
  skuFields,
} from '../lib/variants.ts';

const products = Object.entries(RODILLERA_SKU_ATTRIBUTES).map(
  ([sku, attributes], index) => ({
    id: `id-${sku}`,
    sku,
    category: 'rodilleras',
    archived: 0,
    attributes,
    index,
  }),
);

test('rodillera combinations resolve to the catalog SKU', () => {
  const match = findVariantProduct(
    products,
    'rodilleras',
    {
      Modelo: 'Estandard',
      Tipo: 'Doble velcro',
      Color: 'Negro',
    },
    RODILLERA_FIELDS,
  );
  assert.equal(match?.sku, '1017REVVN');
  const premium = findVariantProduct(
    products,
    'rodilleras',
    {
      Modelo: 'Premium',
      Tipo: 'Velcro y hebilla',
      Color: 'Marron',
    },
    RODILLERA_FIELDS,
  );
  assert.equal(premium?.sku, '1017RPVHM');
});

test('incomplete or unknown combinations do not resolve a SKU', () => {
  assert.equal(
    findVariantProduct(
      products,
      'rodilleras',
      { Modelo: 'Premium', Tipo: 'Doble velcro' },
      RODILLERA_FIELDS,
    ),
    undefined,
  );
  assert.equal(
    skuFields(
      RODILLERA_FIELDS,
      [{ category: 'monturas', attributes: {} }],
      'monturas',
    ).length,
    0,
  );
});

test('rodillera variants do not apply to other categories', () => {
  const mixed = [
    ...products,
    {
      id: 'bota',
      sku: '1016B8',
      category: 'botas',
      archived: 0,
      attributes: {},
    },
  ];
  assert.equal(skuFields(RODILLERA_FIELDS, mixed, 'botas').length, 0);
  assert.equal(
    findVariantProduct(
      mixed,
      'botas',
      {
        Modelo: 'Premium',
        Tipo: 'Doble velcro',
        Color: 'Negro',
      },
      RODILLERA_FIELDS,
    ),
    undefined,
  );
});
