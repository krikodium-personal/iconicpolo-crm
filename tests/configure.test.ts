import assert from 'node:assert/strict';
import test from 'node:test';

import {
  configLabels,
  defaultBota,
  defaultCasco,
  defaultMontura,
  defaultRodillera,
  extraCharges,
  extraTotals,
  parseBota,
  parseCasco,
  parseMontura,
  parsePricing,
  parseRodillera,
  stockByConfig,
  stockKey,
} from '../lib/configure.ts';

test('montura defaults are valid and porta estribera starts off', () => {
  const config = parseMontura(defaultMontura());
  assert.equal(config.portaEstriberaIngles, false);
  assert.equal(config.iniciales, false);
  assert.match(stockKey('montura', config), /americana/);
});

test('montura initials require text', () => {
  assert.throws(
    () =>
      parseMontura({
        ...defaultMontura(),
        iniciales: true,
        inicialesTexto: '',
      }),
    /iniciales/i,
  );
});

test('casco argentina visor requires band color and lock does not', () => {
  const lock = parseCasco(defaultCasco());
  assert.equal(lock.vicera, 'lock');
  const argentina = parseCasco({
    ...defaultCasco(),
    vicera: 'argentina',
    colorBandaVicera: 'rojo',
  });
  assert.equal(argentina.colorBandaVicera, 'rojo');
  const lockKey = stockKey('casco', lock);
  const argKey = stockKey('casco', argentina);
  assert.notEqual(lockKey, argKey);
  assert.equal(lockKey.includes('colorBandaVicera'), true);
});

test('personalization extras do not change the stock key', () => {
  const base = parseMontura(defaultMontura());
  const withInitials = parseMontura({
    ...defaultMontura(),
    iniciales: true,
    inicialesTexto: 'IC',
    inicialesColor: 'dorado',
    inicialesTipografia: 'didot',
    inicialesUbicacion: 'faldon',
  });
  assert.equal(stockKey('montura', base), stockKey('montura', withInitials));
  assert.equal(
    extraCharges('montura', withInitials).some((c) => c.id === 'iniciales'),
    true,
  );
});

test('order prices use configured extras and stay pending until saved', () => {
  const config = parseMontura({
    ...defaultMontura(),
    tipo: 'bauti',
    portaEstriberaIngles: true,
  });
  const unset = extraTotals('montura', config);
  assert.equal(unset.pending, true);
  const pricing = parsePricing({
    extras: {
      tipo_americana: { cost: 0, price: 0 },
      tipo_bauti: { cost: 1000, price: 2000 },
      material_cuero_forrado: { cost: 0, price: 0 },
      asiento_cuero_forrado: { cost: 0, price: 0 },
      faldin: { cost: 0, price: 0 },
      portaEstribera: { cost: 500, price: 800 },
    },
  });
  const totals = extraTotals('montura', config, pricing);
  assert.equal(totals.pending, false);
  assert.equal(totals.price, 2800);
  assert.equal(totals.cost, 1500);
});

test('stock by config keeps only combinations with units', () => {
  const americana = stockKey('montura', defaultMontura());
  const bauti = stockKey(
    'montura',
    parseMontura({ ...defaultMontura(), tipo: 'bauti' }),
  );
  const rows = stockByConfig(
    [
      {
        product_id: 'm1',
        config_key: americana,
        quantity: 3,
        config: defaultMontura(),
      },
      {
        product_id: 'm1',
        config_key: americana,
        quantity: -1,
        config: defaultMontura(),
      },
      {
        product_id: 'm1',
        config_key: bauti,
        quantity: 1,
        config: { ...defaultMontura(), tipo: 'bauti' },
      },
      {
        product_id: 'other',
        config_key: americana,
        quantity: 8,
        config: defaultMontura(),
      },
    ],
    'm1',
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].quantity, 2);
  assert.equal(rows[0].key.startsWith(americana), true);
  assert.equal(rows[1].quantity, 1);
});

test('stock splits units between Ivan and Kriko', () => {
  const key = stockKey('montura', defaultMontura());
  const rows = stockByConfig(
    [
      {
        product_id: 'm1',
        config_key: key,
        location: 'ivan',
        quantity: 2,
        config: defaultMontura(),
      },
      {
        product_id: 'm1',
        config_key: key,
        location: 'kriko',
        quantity: 1,
        config: defaultMontura(),
      },
    ],
    'm1',
  );
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.location === 'ivan')?.quantity, 2);
  assert.equal(rows.find((row) => row.location === 'kriko')?.quantity, 1);
});

test('montura labels list every selected option', () => {
  const labels = configLabels('montura', defaultMontura());
  assert.equal(labels.Material, 'Cuero forrado');
  assert.equal(labels.Color, 'Negro');
  assert.ok(labels.Tamaño);
  assert.equal(labels['Acabado asiento'], 'Liso');
  assert.equal(labels.Corte, 'Tapita');
});

test('rodillera defaults are valid and extras start off', () => {
  const config = parseRodillera(defaultRodillera());
  assert.equal(config.tipo, 'velcro');
  assert.equal(config.modelo, 'standard');
  assert.equal(config.color, 'negro');
  assert.equal(config.tamano, 'mediano');
  assert.equal(config.iniciales, false);
  assert.equal(config.bordado, false);
});

test('rodillera initials and embroidery require their details', () => {
  assert.throws(
    () =>
      parseRodillera({
        ...defaultRodillera(),
        iniciales: true,
        inicialesTexto: '',
      }),
    /iniciales/i,
  );
  assert.throws(
    () =>
      parseRodillera({
        ...defaultRodillera(),
        bordado: true,
        bordadoImagen: '',
      }),
    /imagen/i,
  );
});

test('rodillera personalization does not change the stock key', () => {
  const base = parseRodillera(defaultRodillera());
  const personalized = parseRodillera({
    ...defaultRodillera(),
    iniciales: true,
    inicialesTexto: 'IC',
    inicialesColor: 'dorado',
    inicialesTipografia: 'didot',
    inicialesUbicacion: 'izquierda',
    inicialesTamano: 'chica',
    bordado: true,
    bordadoImagen: '/api/images/abc123',
    bordadoTamano: 'grande',
    bordadoUbicacion: 'derecha',
  });
  assert.equal(stockKey('rodillera', base), stockKey('rodillera', personalized));
  assert.equal(
    extraCharges('rodillera', personalized).some((c) => c.id === 'iniciales'),
    true,
  );
  assert.equal(
    extraCharges('rodillera', personalized).some((c) => c.id === 'bordado'),
    true,
  );
});

test('casco h1 adds its price over standard', () => {
  const standard = parseCasco({
    ...defaultCasco(),
    modelo: 'standard',
  });
  const h1 = parseCasco(defaultCasco());
  const pricing = parsePricing({
    extras: {
      modelo_h1: { cost: 3000, price: 5000 },
    },
  });
  assert.equal(extraTotals('casco', standard, pricing).price, 0);
  assert.equal(extraTotals('casco', h1, pricing).price, 5000);
  assert.equal(extraTotals('casco', h1, pricing).cost, 3000);
});

test('rodillera premium adds its price over standard', () => {
  const standard = parseRodillera(defaultRodillera());
  const premium = parseRodillera({
    ...defaultRodillera(),
    modelo: 'premium',
  });
  const pricing = parsePricing({
    extras: {
      modelo_premium: { cost: 2000, price: 4000 },
    },
  });
  assert.equal(extraTotals('rodillera', standard, pricing).price, 0);
  assert.equal(extraTotals('rodillera', premium, pricing).price, 4000);
  assert.equal(extraTotals('rodillera', premium, pricing).cost, 2000);
});

test('rodillera labels list the selected options', () => {
  const labels = configLabels('rodillera', defaultRodillera());
  assert.equal(labels.Tipo, 'Velcro');
  assert.equal(labels.Modelo, 'Standard');
  assert.equal(labels.Color, 'Negro');
  assert.equal(labels.Tamaño, 'Mediano');
  assert.equal(labels['Protector centro'], 'Negro');
  const tabaco = configLabels(
    'rodillera',
    parseRodillera({
      ...defaultRodillera(),
      protectorCentroColor: 'tabaco',
    }),
  );
  assert.equal(tabaco['Protector centro'], 'Tabaco');
});

const botaMeasures = {
  altoCana: '42',
  largoPie: '27',
  contornoSuperior: '38',
  contornoMedio: '36',
  contornoTobillo: '24',
  contornoTalon: '32',
  contornoEmpeine: '26.5',
};

test('bota defaults reject empty measures and extras start off', () => {
  assert.throws(() => parseBota(defaultBota()), /número/i);
  const config = parseBota({
    ...defaultBota(),
    medidas: botaMeasures,
  });
  assert.equal(config.modelo, 'standard_doble_cuero');
  assert.equal(config.material, 'cuero_vaca');
  assert.equal(config.color, 'negro');
  assert.equal(config.acabado, 'brillante');
  assert.equal(config.parche, false);
  assert.equal(config.iniciales, false);
});

test('bota measures must be numbers and initials require text', () => {
  assert.throws(
    () =>
      parseBota({
        ...defaultBota(),
        medidas: { ...botaMeasures, altoCana: 'alto' },
      }),
    /solo números/i,
  );
  assert.throws(
    () =>
      parseBota({
        ...defaultBota(),
        medidas: botaMeasures,
        iniciales: true,
        inicialesTexto: '',
      }),
    /iniciales/i,
  );
});

test('bota initials do not change the stock key and flags do', () => {
  const base = parseBota({
    ...defaultBota(),
    medidas: botaMeasures,
  });
  const withInitials = parseBota({
    ...defaultBota(),
    medidas: botaMeasures,
    iniciales: true,
    inicialesTexto: 'IC',
    inicialesColor: 'dorado',
    inicialesTipografia: 'didot',
    inicialesUbicacion: 'derecha',
  });
  const withPatch = parseBota({
    ...defaultBota(),
    medidas: botaMeasures,
    parche: true,
  });
  assert.equal(stockKey('bota', base), stockKey('bota', withInitials));
  assert.notEqual(stockKey('bota', base), stockKey('bota', withPatch));
  assert.match(stockKey('bota', base), /26\.5/);
  assert.equal(
    extraCharges('bota', withInitials).some((c) => c.id === 'iniciales'),
    true,
  );
});

test('bota modelo extras add their price over standard doble cuero', () => {
  const standard = parseBota({
    ...defaultBota(),
    medidas: botaMeasures,
  });
  const polo = parseBota({
    ...defaultBota(),
    modelo: 'polo_argentino_doble_cuero',
    medidas: botaMeasures,
  });
  const texanas = parseBota({
    ...defaultBota(),
    modelo: 'texanas',
    medidas: botaMeasures,
  });
  const pricing = parsePricing({
    extras: {
      modelo_polo_argentino_doble_cuero: { cost: 2000, price: 4000 },
      modelo_texanas: { cost: 1500, price: 3000 },
    },
  });
  assert.equal(extraTotals('bota', standard, pricing).price, 0);
  assert.equal(extraTotals('bota', polo, pricing).price, 4000);
  assert.equal(extraTotals('bota', texanas, pricing).price, 3000);
});

test('bota labels list the selected options and measures', () => {
  const labels = configLabels(
    'bota',
    parseBota({
      ...defaultBota(),
      medidas: botaMeasures,
      parche: true,
      engrasado: true,
    }),
  );
  assert.equal(labels.Modelo, 'Standard doble cuero');
  assert.equal(labels.Material, 'Cuero vaca');
  assert.equal(labels.Color, 'Negro');
  assert.equal(labels.Acabado, 'Brillante');
  assert.equal(labels['2. Largo de pie'], '27');
  assert.equal(labels.Parche, 'Con');
  assert.equal(labels.Engrasado, 'Sí');
});
