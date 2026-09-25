import assert from 'node:assert/strict';
import test from 'node:test';

import {
  defaultCasco,
  defaultMontura,
  defaultRodillera,
  emptyPricing,
  firstCascoColor,
  CASCO_PALETTE_IDS,
} from '../lib/configure.ts';
import {
  buildFicha,
  fichaFileName,
  fichaShareText,
  jpegToPdf,
} from '../lib/ficha.ts';
import type { Item, Product } from '../lib/types.ts';

const JPEG_1X1 = Uint8Array.from(
  atob(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//Z',
  ),
  (char) => char.charCodeAt(0),
);

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

function product(partial: Partial<Product> & Pick<Product, 'category' | 'name'>): Product {
  return {
    id: 'p1',
    sku: 'cfg',
    supplier_id: 's1',
    cost: 0,
    price: 0,
    ff_discount: 0,
    ff_price: null,
    promo_kind: '',
    promo_value: 0,
    photos: [],
    options: [],
    attributes: {},
    pricing: emptyPricing(),
    kind: 'configured',
    stock: 0,
    archived: 0,
    version: 1,
    ...partial,
  };
}

function item(partial: Partial<Item> & Pick<Item, 'name' | 'selections'>): Item {
  return {
    id: 'i1',
    order_id: 'o1',
    product_id: 'p1',
    sku: 'cfg',
    unit_price: 0,
    unit_cost: 0,
    quantity: 1,
    discount: 0,
    total: 0,
    cost: 0,
    ...partial,
  };
}

test('casco ficha includes color swatches, initials preview and custom logo', () => {
  const ficha = buildFicha({
    order: { number: '142', date: '2026-09-15', notes: 'Urgente' },
    product: product({ name: 'Casco', category: 'cascos' }),
    item: item({
      name: 'Casco',
      selections: {
        options: [],
        attributes: {},
        supplier_id: 's1',
        config: {
          ...LEGACY_CASCO,
          colorCasco: 'azul-marino',
          colorViceraArriba: 'blanco',
          colorViceraAbajo: 'negro',
          colorTapones: 'dorado',
          iniciales: true,
          inicialesTexto: 'IC',
          inicialesColor: 'dorado',
          inicialesTipografia: 'trajan',
          inicialesUbicacion: 'izquierda',
          inicialesTamano: '16',
          logoPersonalizado: true,
          logoPersonalizadoImagen: '/api/images/logo123',
          logoPersonalizadoPosicion: 'frente',
          logoPersonalizadoTamano: 'grande',
          disenoImagen: '/api/images/diseno1',
        },
      },
    }),
    supplier: {
      id: 's1',
      kind: 'supplier',
      name: 'Talabarteria',
      contact: '',
      title: '',
      address: '',
      phone: '+54 9 11 5555-0000',
      email: '',
      website: '',
      whatsapp_group: '',
      notes: '',
      fiscal: {},
      archived: 0,
      version: 1,
    },
    customer: {
      id: 'c1',
      kind: 'customer',
      name: 'Juan Perez',
      contact: '',
      title: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      whatsapp_group: '',
      notes: '',
      fiscal: {},
      archived: 0,
      version: 1,
    },
    photo: '/api/images/ref1',
  });
  assert.equal(ficha.productTitle, 'Casco');
  assert.equal(ficha.orderNumber, '142');
  assert.equal(ficha.date, '15/09/2026');
  assert.equal(ficha.supplierName, 'Talabarteria');
  assert.equal(ficha.customerName, 'Juan Perez');
  assert.ok(ficha.supplierWhatsapp?.includes('5491155550000'));
  assert.equal(ficha.swatches[0]?.label, 'Color casco');
  assert.equal(ficha.swatches[0]?.name, 'Azul marino');
  assert.equal(ficha.swatches[0]?.hex, '#0b1d3a');
  assert.equal(ficha.initials?.text, 'IC');
  assert.equal(ficha.initials?.fontName, 'Trajan');
  assert.equal(ficha.initials?.colorName, 'Dorado');
  assert.equal(ficha.initials?.place, 'Izquierda');
  assert.equal(ficha.initials?.size, '16 mm');
  assert.equal(ficha.artwork[0]?.kind, 'logo');
  assert.equal(ficha.artwork[0]?.url, '/api/images/logo123');
  assert.match(ficha.artwork[0]?.caption || '', /frente/i);
  assert.equal(ficha.photo, '/api/images/diseno1');
  assert.equal(ficha.photoLabel, 'Diseño');
  assert.equal(ficha.labels.find((row) => row.label === 'Diseño')?.value, 'Imagen adjunta');
  assert.equal(fichaFileName(ficha, 'pdf'), 'ficha-casco-142.pdf');
  assert.match(fichaShareText(ficha), /Pedido Nro: 142/);
});

test('casco ficha lists extra design photos after the main one', () => {
  const ficha = buildFicha({
    order: { number: '143', date: '2026-09-15' },
    product: product({ name: 'Casco', category: 'cascos' }),
    item: item({
      name: 'Casco',
      selections: {
        options: [],
        attributes: {},
        config: {
          ...LEGACY_CASCO,
          disenoImagenes: ['/api/images/diseno1', '/api/images/diseno2'],
        },
      },
    }),
  });
  assert.equal(ficha.photo, '/api/images/diseno1');
  assert.equal(ficha.photoLabel, 'Diseño');
  assert.equal(
    ficha.labels.find((row) => row.label === 'Diseño')?.value,
    '2 imágenes adjuntas',
  );
  assert.equal(ficha.artwork[0]?.kind, 'diseno');
  assert.equal(ficha.artwork[0]?.url, '/api/images/diseno2');
  assert.match(ficha.artwork[0]?.caption || '', /2 de 2/);
});

test('new casco ficha uses catalog swatches and the slot of each personalization', () => {
  const hilo = firstCascoColor(CASCO_PALETTE_IDS.logoHilo);
  const ficha = buildFicha({
    order: { number: '144', date: '2026-09-15' },
    product: product({ name: 'Casco', category: 'cascos' }),
    item: item({
      name: 'Casco',
      selections: {
        options: [],
        attributes: {},
        config: {
          ...defaultCasco(),
          talle: { cm: 57, pulgadas: '22 1/2', talleUS: '7' },
          iniciales: {
            posicion: 'back',
            texto: 'MP',
            tamano: 'L',
            colorHilo: hilo,
            tipografia: 'didot',
          },
          logoPropio: {
      posicion: 'left_side',
      imagen: '/api/images/logo123',
      tamano: 'M',
      colorHilo: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
    },
        },
      },
    }),
  });
  const labelOf = (label: string) =>
    ficha.swatches.find((swatch) => swatch.label === label);
  assert.equal(labelOf('Casquete')?.name, firstCascoColor('softshell').nombre);
  assert.equal(labelOf('Casquete')?.hex, firstCascoColor('softshell').hex);
  assert.ok(labelOf('Banda de visera'), 'la visera Argentina lleva banda');
  assert.equal(
    labelOf('Correaje')?.name,
    firstCascoColor(CASCO_PALETTE_IDS.barbijo).nombre,
  );
  assert.equal(labelOf('Logo Iconic')?.name, hilo.nombre);
  assert.equal(ficha.initials?.text, 'MP');
  assert.equal(ficha.initials?.fontName, 'Didot');
  assert.equal(ficha.initials?.place, 'Atrás');
  assert.equal(ficha.initials?.size, '18 mm');
  assert.equal(ficha.artwork[0]?.kind, 'logo');
  assert.match(ficha.artwork[0]?.caption || '', /Lateral izquierdo/);
  assert.equal(
    ficha.labels.find((row) => row.label === 'Ubicación logo Iconic')?.value,
    'Lado derecho',
  );
});

test('montura ficha uses leather color and initials', () => {
  const ficha = buildFicha({
    order: { number: '8', date: '2026-01-02' },
    product: product({ name: 'Montura', category: 'monturas' }),
    item: item({
      name: 'Montura',
      selections: {
        options: [],
        attributes: {},
        config: {
          ...defaultMontura(),
          color: 'marron',
          iniciales: true,
          inicialesTexto: 'AB',
          inicialesColor: 'dorado',
          inicialesTipografia: 'didot',
          personalizacionUbicacion: 'faldon',
        },
      },
    }),
  });
  assert.equal(ficha.productTitle, 'Montura');
  assert.equal(ficha.swatches[0]?.name, 'Marrón');
  assert.equal(ficha.swatches[0]?.hex, '#5c3317');
  assert.equal(ficha.initials?.text, 'AB');
  assert.equal(ficha.initials?.place, 'Faldón');
  assert.equal(ficha.initials?.surfacePhoto, '/leather-tabaco.png');
});

test('montura ficha includes logo artwork', () => {
  const ficha = buildFicha({
    order: { number: '8b', date: '2026-01-02' },
    product: product({ name: 'Montura', category: 'monturas' }),
    item: item({
      name: 'Montura',
      selections: {
        options: [],
        attributes: {},
        config: {
          ...defaultMontura(),
          logoPersonalizado: true,
          logoPersonalizadoImagen: '/api/images/logo-montura',
          personalizacionUbicacion: 'tapita',
        },
      },
    }),
  });
  assert.equal(ficha.artwork[0]?.kind, 'logo');
  assert.equal(ficha.artwork[0]?.url, '/api/images/logo-montura');
  assert.match(ficha.artwork[0]?.caption || '', /Tapita/);
  assert.equal(ficha.initials, undefined);
});

test('rodillera ficha includes bordado artwork', () => {
  const ficha = buildFicha({
    order: { number: '9', date: '2026-03-04' },
    product: product({ name: 'Rodillera', category: 'rodilleras' }),
    item: item({
      name: 'Rodillera',
      quantity: 2,
      selections: {
        options: [],
        attributes: {},
        config: {
          ...defaultRodillera(),
          color: 'tabaco',
          protectorCentroColor: 'negro',
          bordado: true,
          bordadoImagen: '/api/images/bordado1',
          bordadoTamano: 'grande',
          bordadoUbicacion: 'derecha',
        },
      },
    }),
  });
  assert.equal(ficha.quantity, 2);
  assert.equal(ficha.swatches[0]?.name, 'Tabaco');
  assert.equal(ficha.swatches[1]?.label, 'Protector centro');
  assert.equal(ficha.artwork[0]?.kind, 'bordado');
  assert.match(ficha.artwork[0]?.caption || '', /Derecha/);
});

test('sku ficha uses product name, extras and stored attributes', () => {
  const ficha = buildFicha({
    order: { number: '10', date: '2026-05-06' },
    product: product({
      name: 'Fusta',
      category: 'accesorios',
      kind: 'sku',
    }),
    item: item({
      name: 'Fusta',
      sku: 'FUS-1',
      selections: {
        options: [{ id: 'o1', name: 'Grapa plata', price: 0, cost: 0, photo: '' }],
        attributes: { Talle: 'M' },
      },
    }),
  });
  assert.equal(ficha.productTitle, 'Fusta');
  assert.equal(ficha.description, 'Fusta\nGrapa plata');
  assert.deepEqual(ficha.labels, [{ label: 'Talle', value: 'M' }]);
  assert.equal(ficha.swatches.length, 0);
  assert.equal(ficha.artwork.length, 0);
});

test('jpegToPdf wraps a jpeg into a one-page PDF', () => {
  const pdf = jpegToPdf(JPEG_1X1, 1, 1);
  const text = new TextDecoder().decode(pdf.slice(0, 8));
  assert.equal(text, '%PDF-1.4');
  assert.ok(Buffer.from(pdf).includes(Buffer.from('/DCTDecode')));
  assert.ok(Buffer.from(pdf).includes(Buffer.from(JPEG_1X1)));
});
