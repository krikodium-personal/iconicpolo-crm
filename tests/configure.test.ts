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
  selectedReferenceIds,
  reservedHolds,
  stockAvailability,
  stockByConfig,
  stockKey,
  summarizeConfig,
} from '../lib/configure.ts';

test('montura defaults are valid and porta estribera starts off', () => {
  const config = parseMontura(defaultMontura());
  assert.equal(config.portaEstriberaIngles, false);
  assert.equal(config.iniciales, false);
  assert.match(stockKey('montura', config), /americana/);
});

test('montura gamuza is the same as descarne gamusado', () => {
  const fromGamuza = parseMontura({
    ...defaultMontura(),
    material: 'gamuza',
    materialAsiento: 'gamuza',
  });
  const fromDescarne = parseMontura({
    ...defaultMontura(),
    material: 'descarne',
    materialAsiento: 'descarne',
  });
  assert.equal(fromGamuza.material, 'descarne');
  assert.equal(fromGamuza.materialAsiento, 'descarne');
  assert.equal(
    stockKey('montura', fromGamuza),
    stockKey('montura', fromDescarne),
  );
  const labels = configLabels('montura', fromDescarne);
  assert.equal(labels.Material, 'Descarne gamusado');
  assert.equal(labels['Material asiento'], 'Descarne gamusado');
  const pricing = parsePricing({
    extras: {
      material_gamuza: { cost: 10, price: 20 },
      asiento_gamuza: { cost: 3, price: 4 },
    },
  });
  assert.deepEqual(pricing.extras.material_descarne, { cost: 10, price: 20 });
  assert.deepEqual(pricing.extras.asiento_descarne, { cost: 3, price: 4 });
  assert.equal(pricing.extras.material_gamuza, undefined);
  assert.equal(pricing.extras.asiento_gamuza, undefined);
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
  const withPhoto = parsePricing({
    extras: pricing.extras,
    photos: {
      tipo_bauti: '/api/images/abc123',
      ignored: 'https://example.com/x.png',
    },
  });
  assert.equal(withPhoto.photos.tipo_bauti, '/api/images/abc123');
  assert.equal(withPhoto.photos.ignored, undefined);
  assert.deepEqual(selectedReferenceIds('montura', config), ['tipo_bauti']);
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

test('reserved stock stays listed and only leftover units can be picked', () => {
  const key = stockKey('montura', defaultMontura());
  const rows = stockAvailability(
    [
      {
        product_id: 'm1',
        config_key: key,
        location: 'kriko',
        quantity: 2,
        config: defaultMontura(),
      },
    ],
    [
      {
        orderId: 'o1',
        orderNumber: 'IC-1',
        productId: 'm1',
        configKey: key,
        location: 'kriko',
        quantity: 1,
      },
    ],
    'm1',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].quantity, 2);
  assert.equal(rows[0].reserved, 1);
  assert.equal(rows[0].available, 1);
  assert.equal(rows[0].reservations[0]?.orderNumber, 'IC-1');
});

test('a single reserved unit cannot be assigned to another order', () => {
  const key = stockKey('montura', defaultMontura());
  const rows = stockAvailability(
    [
      {
        product_id: 'm1',
        config_key: key,
        location: 'ivan',
        quantity: 1,
        config: defaultMontura(),
      },
    ],
    [
      {
        orderId: 'o1',
        orderNumber: 'IC-1',
        productId: 'm1',
        configKey: key,
        location: 'ivan',
        quantity: 1,
      },
    ],
    'm1',
  );
  assert.equal(rows[0].available, 0);
  assert.equal(rows[0].reserved, 1);
  assert.equal(rows[0].quantity, 1);
});

test('a reservation without location still locks that combination', () => {
  const key = stockKey('montura', defaultMontura());
  const rows = stockAvailability(
    [
      {
        product_id: 'm1',
        config_key: key,
        location: 'kriko',
        quantity: 1,
        config: defaultMontura(),
      },
    ],
    [
      {
        orderId: 'o1',
        orderNumber: 'IC-1',
        productId: 'm1',
        configKey: key,
        location: '',
        quantity: 1,
      },
    ],
    'm1',
  );
  assert.equal(rows[0].available, 0);
  assert.equal(rows[0].reservations[0]?.orderId, 'o1');
});

test('delivered orders release the reservation and closed ones keep it', () => {
  const config = defaultMontura();
  const key = stockKey('montura', config);
  const item = {
    product_id: 'cfg-montura',
    quantity: 1,
    selections: {
      from_stock: true,
      config,
      location: 'kriko',
    },
  };
  const products = [
    { id: 'cfg-montura', category: 'monturas', kind: 'configured' },
  ];
  const open = reservedHolds(
    [
      {
        id: 'o1',
        number: 'IC-1',
        archived: 0,
        status: 'abierto',
        items: [item],
      },
    ],
    products,
  );
  const closed = reservedHolds(
    [
      {
        id: 'o1',
        number: 'IC-1',
        archived: 0,
        status: 'cerrado',
        items: [item],
      },
    ],
    products,
  );
  const delivered = reservedHolds(
    [
      {
        id: 'o1',
        number: 'IC-1',
        archived: 0,
        status: 'entregado',
        items: [item],
      },
    ],
    products,
  );
  assert.equal(open[0]?.configKey, key);
  assert.equal(open[0]?.quantity, 1);
  assert.equal(closed[0]?.quantity, 1);
  assert.equal(delivered.length, 0);
  assert.equal(
    reservedHolds(
      [
        {
          id: 'o1',
          number: 'IC-1',
          archived: 0,
          deleted: 1,
          status: 'abierto',
          items: [item],
        },
      ],
      products,
    ).length,
    0,
  );
});

test('montura labels list every selected option', () => {
  const labels = configLabels('montura', defaultMontura());
  assert.equal(labels.Material, 'Cuero forrado');
  assert.equal(labels.Color, 'Negro');
  assert.ok(labels.Tamaño);
  assert.equal(labels['Acabado asiento'], 'Liso');
  assert.equal(labels.Corte, 'Tapita');
});

test('montura stock summary hides default faldin and porta estribera', () => {
  const text = summarizeConfig('montura', {
    ...defaultMontura(),
    tipo: 'bauti',
    material: 'cuero_forrado',
    color: 'negro',
    tamano: '19',
    acabadoAsiento: 'liso',
    materialAsiento: 'descarne',
    corte: 'tapita',
  });
  assert.equal(
    text,
    'Montura Bauti cuero forrado negro 19\nAsiento: liso, descarne gamusado\nCorte: tapita',
  );
});

test('montura stock summary shows non-default faldin and porta estribera', () => {
  const text = summarizeConfig('montura', {
    ...defaultMontura(),
    faldin: false,
    portaEstriberaIngles: true,
  });
  assert.match(text, /Sin faldín/);
  assert.match(text, /Porta estribera inglés/);
  assert.doesNotMatch(text, /Faldín: /);
});

test('rodillera stock summary hides matching protector color', () => {
  const text = summarizeConfig('rodillera', {
    ...defaultRodillera(),
    modelo: 'premium',
    tipo: 'doble_velcro',
    color: 'chocolate',
    protectorCentroColor: 'chocolate',
    tamano: 'mediano',
  });
  assert.equal(
    text,
    'Rodillera premium doble velcro chocolate.\nTamaño: mediano',
  );
});

test('rodillera stock summary shows a different protector color', () => {
  const text = summarizeConfig('rodillera', {
    ...defaultRodillera(),
    modelo: 'premium',
    tipo: 'doble_velcro',
    color: 'chocolate',
    protectorCentroColor: 'negro',
    tamano: 'mediano',
  });
  assert.equal(
    text,
    'Rodillera premium doble velcro chocolate.\nTamaño: mediano\nProtector centro: negro',
  );
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
