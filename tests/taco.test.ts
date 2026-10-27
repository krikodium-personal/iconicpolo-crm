import assert from 'node:assert/strict';
import test from 'node:test';

import {
  configLabels,
  defaultTaco,
  parseTaco,
  selectedPriceKeys,
  stockKey,
} from '../lib/configure.ts';
import { mapearTaco, notasDeSolicitud, type DisenoTacoSitio } from '../lib/solicitud.ts';
import { TACO_LACAS, tacoColorPorNombre } from '../lib/taco-catalog.ts';

function color(es: string, hex = '#000000') {
  return { hex, es, en: es };
}

/** Un taco como lo manda el sitio. */
function diseno(cambios: Partial<DisenoTacoSitio> = {}): DisenoTacoSitio {
  return {
    tamano: 52,
    flex: 'Media / Rígida',
    peso: 195,
    manija: 'Grande',
    colores: {
      cigarro: color('Natural', '#ffffff'),
      bandas: color('Rojo Neón', '#ff0000'),
      extremos: color('Negro'),
      puntas: color('Azul Francia', '#0032c8'),
      puntera: color('Azul Clásico', '#3564a9'),
    },
    colorNumero: 'Blanco',
    iniciales: ['C', '', 'K'],
    ...cambios,
  };
}

test('traduce el taco del sitio al modelo del CRM', () => {
  const { config, avisos } = mapearTaco(diseno(), ['/api/images/abc']);
  assert.deepEqual(avisos, []);
  assert.equal(config.tamano, 52);
  assert.equal(config.conFlex, true);
  assert.equal(config.flex, 'media_rigida');
  assert.equal(config.conPeso, true);
  assert.equal(config.peso, 195);
  assert.equal(config.conManija, true);
  assert.equal(config.manija, 'grande');
  assert.equal(config.colores.cigarro, 'natural');
  assert.equal(config.colores.puntas, 'azul_francia');
  assert.equal(config.puntera, 'azul_clasico');
  assert.equal(config.colorNumero, 'blanco');
  assert.deepEqual(config.disenoImagenes, ['/api/images/abc']);
});

test('el rojo y el rojo neón se distinguen por nombre aunque compartan hexadecimal', () => {
  const { config } = mapearTaco(diseno());
  assert.equal(config.colores.bandas, 'rojo_neon');
  assert.equal(tacoColorPorNombre(TACO_LACAS, 'Rojo')?.id, 'rojo');
});

test('una casilla vacía de las iniciales conserva su lugar', () => {
  const { config } = mapearTaco(diseno());
  assert.equal(config.iniciales, true);
  assert.equal(config.inicialesTexto, 'C K');
  assert.equal(parseTaco(config).inicialesTexto, 'C K');
});

test('flex, peso y manija sin elegir quedan en estándar', () => {
  const { config, avisos } = mapearTaco(diseno({ flex: '', peso: 0, manija: '' }));
  assert.deepEqual(avisos, []);
  assert.equal(config.conFlex, false);
  assert.equal(config.conPeso, false);
  assert.equal(config.conManija, false);
  const labels = configLabels('taco', config);
  assert.equal(labels['Flex de la caña'], 'Estándar');
  assert.equal(labels['Peso del cigarro'], 'Estándar');
  assert.equal(labels.Grip, 'Estándar');
});

test('sin letras no hay iniciales', () => {
  const { config } = mapearTaco(diseno({ iniciales: ['', '', ''] }));
  assert.equal(config.iniciales, false);
  assert.equal(config.inicialesTexto, '');
});

test('un color o una opción que el CRM no tiene no se reemplaza en silencio', () => {
  const { config, avisos } = mapearTaco(
    diseno({ flex: 'Extra blanda', colores: { ...diseno().colores, cigarro: color('Turquesa') } }),
  );
  assert.equal(config.flex, defaultTaco().flex);
  assert.equal(config.colores.cigarro, 'natural');
  assert.equal(avisos.length, 2);
});

test('la configuración traducida pasa el parser del CRM', () => {
  const { config } = mapearTaco(diseno());
  assert.deepEqual(parseTaco(JSON.parse(JSON.stringify(config))), config);
});

test('el parser rechaza iniciales activadas sin letras', () => {
  assert.throws(() => parseTaco({ ...defaultTaco(), iniciales: true, inicialesTexto: '  ' }));
});

test('la pintura se cobra una vez, pinte las zonas que pinte', () => {
  const { config } = mapearTaco(diseno());
  assert.deepEqual(selectedPriceKeys('taco', config), [
    'flex',
    'peso',
    'manija',
    'pintura',
    'iniciales',
  ]);
  // El estándar en madera natural no suma nada.
  assert.deepEqual(selectedPriceKeys('taco', defaultTaco()), []);
});

test('el valor guardado de una opción no elegida no cambia la clave de stock', () => {
  const base = defaultTaco();
  assert.equal(stockKey('taco', base), stockKey('taco', { ...base, flex: 'blanda', peso: 215 }));
});

test('las iniciales no cambian la clave de stock', () => {
  const { config } = mapearTaco(diseno());
  assert.equal(
    stockKey('taco', config),
    stockKey('taco', { ...config, iniciales: false, inicialesTexto: '' }),
  );
});

test('las etiquetas muestran las casillas vacías', () => {
  const { config } = mapearTaco(diseno());
  const labels = configLabels('taco', config);
  assert.equal(labels.Iniciales, 'C · K');
  assert.equal(labels.Puntas, 'Azul Francia');
  assert.equal(labels['Tamaño'], '52"');
});

test('el taco no se repite como texto en las notas del pedido', () => {
  const notas = notasDeSolicitud(
    {
      v: 1,
      creada: '2026-10-27T12:00:00.000Z',
      cliente: {
        name: 'Ana',
        email: 'ana@example.com',
        phone: '',
        country: '',
        club: '',
        notes: '',
        language: 'es',
      },
      items: [
        { name: 'Taco', subtitle: 'a medida', details: ['Tamaño: 52"'], disenoTaco: diseno(), imagenes: [] },
      ],
    },
    'x'.repeat(32),
    [],
  );
  assert.ok(!notas.includes('Tamaño: 52"'));
});
