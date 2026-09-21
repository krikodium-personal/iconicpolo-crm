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
  adjustedConfiguredPrices,
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
  configDesignPhoto,
  configDesignPhotos,
  changeCascoMaterial,
  cascoCanEnableKind,
  cascoFreeSlots,
  cascoKindAtSlot,
  firstCascoColor,
  isNewCascoConfig,
  CASCO_DISENO_MAX,
  CASCO_PALETTE_IDS,
  CASCO_SLOT_FULL_MESSAGE,
} from '../lib/configure.ts';

const LEGACY_CASCO = {
  modelo: 'h1' as const,
  vicera: 'lock' as const,
  tamano: '57',
  materialExterno: 'softshell' as const,
  colorCasco: 'negro',
  colorViceraArriba: 'negro',
  colorViceraAbajo: 'negro',
  colorBandaVicera: 'negro',
  colorTapones: 'negro',
  correaje: false,
  correajeColor: 'negro',
  iniciales: false,
  inicialesTexto: '',
  inicialesColor: 'negro',
  inicialesTipografia: 'trajan',
  inicialesUbicacion: 'derecha' as const,
  inicialesTamano: '16' as const,
  bandera: false,
  banderaUbicacion: 'derecha' as const,
  banderaPais: 'Argentina',
  logoIcUbicacion: 'derecha' as const,
  logoIcColorPersonalizado: false,
  logoIcColor: 'negro',
  logoPersonalizado: false,
  logoPersonalizadoPosicion: 'izquierda' as const,
  logoPersonalizadoTamano: 'mediano' as const,
  logoPersonalizadoImagen: '',
  disenoImagen: '',
  disenoImagenes: [] as string[],
};

function talle57() {
  return { cm: 57, pulgadas: '22 1/2', talleUS: '7' };
}

function validCasco(patch: Record<string, unknown> = {}) {
  return parseCasco({
    ...defaultCasco(),
    talle: talle57(),
    ...patch,
  });
}

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
  const lock = parseCasco(LEGACY_CASCO);
  assert.equal(lock.vicera, 'lock');
  const argentina = parseCasco({
    ...LEGACY_CASCO,
    vicera: 'argentina',
    colorBandaVicera: 'rojo',
  });
  assert.equal(argentina.colorBandaVicera, 'rojo');
  const lockKey = stockKey('casco', lock);
  const argKey = stockKey('casco', argentina);
  assert.notEqual(lockKey, argKey);
  assert.equal(lockKey.includes('colorBandaVicera'), true);
});

test('new casco defaults to Argentina visera, Softshell, correaje and empty talle', () => {
  const draft = defaultCasco();
  assert.equal(isNewCascoConfig(draft), true);
  assert.equal(draft.version, 2);
  assert.equal(draft.visera, 'argentine');
  assert.equal(draft.material, 'softshell');
  assert.equal(draft.talle, '');
  assert.equal(draft.colores.top?.palette, 'softshell');
  assert.equal(draft.colores.peakBand?.nombre, draft.colores.top?.nombre);
  assert.ok(draft.colores.strap);
  assert.equal(draft.colores.strap?.palette, CASCO_PALETTE_IDS.barbijo);
  assert.throws(() => parseCasco(draft), /talle/i);
  const parsed = validCasco();
  assert.equal(isNewCascoConfig(parsed), true);
  assert.equal(parsed.talle.cm, 57);
  const labels = configLabels('casco', parsed);
  assert.equal(labels.Estilo, 'Argentina');
  assert.equal(labels.Material, 'Softshell');
  assert.equal(labels['Logo Iconic'], parsed.logoIconic.nombre);
  assert.equal(labels.Correaje, parsed.colores.strap?.nombre);
});

test('new casco english visera drops the peak band', () => {
  const argentina = validCasco();
  assert.ok(argentina.colores.peakBand);
  const english = validCasco({ visera: 'english', colores: {
    ...argentina.colores,
    peakBand: undefined,
  } });
  assert.equal(english.visera, 'english');
  assert.equal(english.colores.peakBand, undefined);
  assert.notEqual(stockKey('casco', argentina), stockKey('casco', english));
});

test('casco design reference images are optional, multiple, and ignored by stock', () => {
  const base = validCasco();
  assert.deepEqual(base.disenoImagenes, []);
  assert.equal(base.disenoImagen, '');
  assert.equal(configDesignPhoto('casco', base), undefined);
  assert.deepEqual(configDesignPhotos('casco', base), []);
  const legacy = validCasco({
    disenoImagen: '/api/images/abc123',
  });
  assert.deepEqual(legacy.disenoImagenes, ['/api/images/abc123']);
  assert.equal(legacy.disenoImagen, '/api/images/abc123');
  assert.equal(configDesignPhoto('casco', legacy), '/api/images/abc123');
  const many = validCasco({
    disenoImagenes: ['/api/images/abc123', '/api/images/def456'],
  });
  assert.deepEqual(many.disenoImagenes, [
    '/api/images/abc123',
    '/api/images/def456',
  ]);
  assert.equal(many.disenoImagen, '/api/images/abc123');
  assert.deepEqual(configDesignPhotos('casco', many), many.disenoImagenes);
  assert.equal(stockKey('casco', base), stockKey('casco', legacy));
  assert.equal(stockKey('casco', base), stockKey('casco', many));
  assert.equal(configLabels('casco', legacy).Diseño, 'Imagen adjunta');
  assert.equal(configLabels('casco', many).Diseño, '2 imágenes adjuntas');
  assert.equal(configLabels('casco', base).Diseño, undefined);
  assert.throws(
    () =>
      parseCasco({
        ...defaultCasco(),
        talle: talle57(),
        disenoImagen: 'https://example.com/x.png',
      }),
    /imagen/i,
  );
  assert.throws(
    () =>
      parseCasco({
        ...defaultCasco(),
        talle: talle57(),
        disenoImagenes: ['/api/images/abc123', 'https://example.com/x.png'],
      }),
    /imagen/i,
  );
  assert.throws(
    () =>
      parseCasco({
        ...defaultCasco(),
        talle: talle57(),
        disenoImagenes: Array.from(
          { length: CASCO_DISENO_MAX + 1 },
          (_, i) => `/api/images/${i.toString().padStart(8, '0')}`,
        ),
      }),
    /máximo/i,
  );
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
          status: 'cotización',
          items: [item],
        },
      ],
      products,
    ).length,
    0,
  );
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

test('configured line prices keep the saved amount and apply extras delta', () => {
  const previous = validCasco();
  const withInitials = validCasco({
    iniciales: {
      posicion: 'left_side',
      texto: 'MP',
      tamano: 'M',
      colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
      tipografia: 'didot',
    },
  });
  const withPhoto = validCasco({
    disenoImagen: '/api/images/abc123',
  });
  const visera = validCasco({ visera: 'english' });
  const pricing = parsePricing({
    extras: {
      modelo_h1: { cost: 3000, price: 5000 },
      iniciales: { cost: 800, price: 2000 },
    },
  });
  const savedPrice = 10000;
  const savedCost = 4000;
  const same = adjustedConfiguredPrices(
    'casco',
    previous,
    previous,
    pricing,
    savedPrice,
    savedCost,
  );
  assert.equal(same.unit_price, savedPrice);
  assert.equal(same.unit_cost, savedCost);
  const added = adjustedConfiguredPrices(
    'casco',
    previous,
    withInitials,
    pricing,
    savedPrice,
    savedCost,
  );
  assert.equal(added.unit_price, 12000);
  assert.equal(added.unit_cost, 4800);
  const photo = adjustedConfiguredPrices(
    'casco',
    previous,
    withPhoto,
    pricing,
    savedPrice,
    savedCost,
  );
  assert.equal(photo.unit_price, savedPrice);
  assert.equal(photo.unit_cost, savedCost);
  const vis = adjustedConfiguredPrices(
    'casco',
    previous,
    visera,
    pricing,
    savedPrice,
    savedCost,
  );
  assert.equal(vis.unit_price, savedPrice);
  assert.equal(vis.unit_cost, savedCost);
  const removed = adjustedConfiguredPrices(
    'casco',
    withInitials,
    previous,
    pricing,
    12000,
    4800,
  );
  assert.equal(removed.unit_price, savedPrice);
  assert.equal(removed.unit_cost, savedCost);
  const broken = adjustedConfiguredPrices(
    'casco',
    { garbage: true },
    withInitials,
    pricing,
    savedPrice,
    savedCost,
  );
  assert.equal(broken.unit_price, savedPrice);
  assert.equal(broken.unit_cost, savedCost);
});

test('casco h1 adds its price over standard', () => {
  const standard = validCasco({
    modelo: 'standard',
  });
  const h1 = validCasco();
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

test('changing casco material resets fabric colors to the new palette', () => {
  const softshell = validCasco();
  assert.equal(softshell.colores.top?.palette, 'softshell');
  const leather = changeCascoMaterial(softshell, 'leather');
  assert.equal(leather.colores.top?.palette, 'leather');
  assert.equal(leather.colores.peak?.palette, 'leather');
  assert.equal(leather.colores.underPeak?.palette, 'leather');
  assert.equal(leather.colores.peakBand?.palette, 'leather');
  assert.equal(leather.colores.airholes.palette, CASCO_PALETTE_IDS.ojales);
  assert.deepEqual(leather.colores.strap, softshell.colores.strap);
  assert.notEqual(leather.colores.top?.hex, softshell.colores.top?.hex);
  parseCasco({ ...leather, talle: talle57() });
  assert.throws(
    () =>
      parseCasco({ ...softshell, material: 'leather', talle: talle57() }),
    /paleta/i,
  );
});

test('prints mode hides fabric colors and keeps strap and airholes', () => {
  const softshell = validCasco();
  const printed = changeCascoMaterial(softshell, 'prints');
  assert.equal(printed.material, 'prints');
  assert.equal(printed.estampado, 'topographic');
  assert.equal(printed.colores.top, undefined);
  assert.equal(printed.colores.peak, undefined);
  assert.equal(printed.colores.peakBand, undefined);
  assert.equal(printed.colores.underPeak, undefined);
  assert.deepEqual(printed.colores.strap, softshell.colores.strap);
  assert.equal(printed.colores.airholes.palette, CASCO_PALETTE_IDS.ojales);
  const parsed = parseCasco({ ...printed, talle: talle57() });
  assert.equal(isNewCascoConfig(parsed) && parsed.estampado, 'topographic');
  const labels = configLabels('casco', parsed);
  assert.equal(labels.Estampado, 'Topográfico');
  assert.equal(labels.Casquete, undefined);
});

test('legacy casco configs still parse and keep their labels', () => {
  const config = parseCasco(LEGACY_CASCO);
  assert.equal(isNewCascoConfig(config), false);
  assert.equal(config.vicera, 'lock');
  assert.equal(config.materialExterno, 'softshell');
  const labels = configLabels('casco', config);
  assert.equal(labels['Tipo de vicera'], 'Lock / English');
  assert.equal(labels['Material externo'], 'Softshell');
  assert.equal(labels['Color casco'], 'Negro');
});

function inicialesAt(posicion: 'left_side' | 'back', patch = {}) {
  return {
    posicion,
    texto: 'IC',
    tamano: 'M' as const,
    colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
    tipografia: 'trajan',
    ...patch,
  };
}

test('new casco stock key ignores photos and personalization', () => {
  const base = validCasco();
  const personalized = validCasco({
    iniciales: inicialesAt('left_side'),
    bandera: { posicion: 'back', pais: 'Argentina' },
    disenoImagenes: ['/api/images/abc123'],
    logoIconic: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
  });
  assert.equal(stockKey('casco', base), stockKey('casco', personalized));
  const charges = extraCharges('casco', personalized);
  assert.equal(charges.some((c) => c.id === 'iniciales'), true);
  assert.equal(charges.some((c) => c.id === 'bandera'), true);
  assert.equal(charges.some((c) => c.id === 'logoIcColor'), false);
  const withLogo = validCasco({
    logoPropio: {
      posicion: 'left_side',
      imagen: '/api/images/logo123',
      tamano: 'M',
      colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
    },
  });
  assert.equal(stockKey('casco', base), stockKey('casco', withLogo));
  assert.equal(
    extraCharges('casco', withLogo).some((c) => c.id === 'logoPersonalizado'),
    true,
  );
});

test('initials millimetres depend on the slot and keep the typography', () => {
  const left = validCasco({ iniciales: inicialesAt('left_side', { tamano: 'S' }) });
  const leftLabels = configLabels('casco', left);
  assert.match(leftLabels.Iniciales, /IC/);
  assert.match(leftLabels.Iniciales, /12 mm/);
  assert.equal(leftLabels['Ubicación iniciales'], 'Lateral izquierdo');
  const back = validCasco({
    iniciales: inicialesAt('back', { texto: 'MP', tamano: 'L', tipografia: 'didot' }),
  });
  const backLabels = configLabels('casco', back);
  assert.match(backLabels.Iniciales, /MP/);
  assert.match(backLabels.Iniciales, /18 mm/);
  assert.equal(backLabels['Ubicación iniciales'], 'Atrás');
  assert.equal(backLabels.Tipografía, 'Didot');
});

test('each personalization needs a single valid slot', () => {
  assert.throws(
    () => validCasco({ iniciales: inicialesAt('right_side' as 'back') }),
    /posición de iniciales/i,
  );
  assert.throws(
    () => validCasco({ bandera: { pais: 'Argentina' } }),
    /posición de bandera/i,
  );
  assert.throws(
    () => validCasco({ bandera: { posicion: ['back'], pais: 'Argentina' } }),
    /posición de bandera/i,
  );
  assert.throws(
    () =>
      validCasco({
        logoPropio: {
          posicion: ['left_side', 'back'],
          imagen: '/api/images/logo123',
          tamano: 'S',
        },
      }),
    /posición de logo propio/i,
  );
});

test('two personalizations cannot share a slot', () => {
  assert.throws(
    () =>
      validCasco({
        iniciales: inicialesAt('back'),
        bandera: { posicion: 'back', pais: 'Argentina' },
      }),
    new RegExp(CASCO_SLOT_FULL_MESSAGE),
  );
  const ok = validCasco({
    iniciales: inicialesAt('left_side'),
    bandera: { posicion: 'back', pais: 'Argentina' },
  });
  assert.equal(isNewCascoConfig(ok) && ok.iniciales?.posicion, 'left_side');
  assert.equal(isNewCascoConfig(ok) && ok.bandera?.posicion, 'back');
});

test('free slots shrink as personalizations take them and block the fourth', () => {
  const empty = defaultCasco();
  assert.deepEqual(cascoFreeSlots(empty), ['left_side', 'back']);
  assert.equal(cascoKindAtSlot(empty, 'left_side'), null);

  const one = { ...empty, iniciales: inicialesAt('left_side') };
  assert.equal(cascoKindAtSlot(one, 'left_side'), 'iniciales');
  assert.deepEqual(cascoFreeSlots(one), ['back']);
  // The kind already holding a slot still sees it, so it can stay put.
  assert.deepEqual(cascoFreeSlots(one, 'iniciales'), ['left_side', 'back']);
  assert.equal(cascoCanEnableKind(one, 'bandera'), true);

  const two = { ...one, bandera: { posicion: 'back' as const, pais: 'Argentina' } };
  assert.equal(cascoKindAtSlot(two, 'back'), 'bandera');
  assert.deepEqual(cascoFreeSlots(two), []);
  // Logo Iconic is always on the right, so it never competes for a slot.
  assert.equal(cascoCanEnableKind(two, 'logoPropio'), false);
  assert.equal(cascoCanEnableKind(two, 'iniciales'), true);
  assert.equal(cascoCanEnableKind(two, 'bandera'), true);

  const freed = { ...two, bandera: undefined };
  assert.equal(cascoCanEnableKind(freed, 'logoPropio'), true);
  assert.deepEqual(cascoFreeSlots(freed, 'logoPropio'), ['back']);
});

test('logo Iconic stays on the right and adds no extra of its own', () => {
  const config = validCasco({
    iniciales: inicialesAt('left_side'),
    bandera: { posicion: 'back', pais: 'Argentina' },
  });
  const labels = configLabels('casco', config);
  assert.equal(labels['Ubicación logo Iconic'], 'Lado derecho');
  assert.equal(labels['Logo Iconic'], firstCascoColor(CASCO_PALETTE_IDS.logoHilo).nombre);
  assert.equal(
    extraCharges('casco', config).some((c) => c.id === 'logoIcColor'),
    false,
  );
});

