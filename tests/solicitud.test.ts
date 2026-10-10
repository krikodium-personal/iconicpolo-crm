import assert from 'node:assert/strict';
import test from 'node:test';

import { cascoPalette, CASCO_PALETTE_IDS } from '../lib/casco-catalog.ts';
import { FONT_DEFAULT, parseCasco } from '../lib/configure.ts';
import {
  mapearCasco,
  notasDeCliente,
  notasDeSolicitud,
  printDelCatalogo,
  type DisenoSitio,
  type SolicitudSitio,
} from '../lib/solicitud.ts';

const softshell = cascoPalette('softshell');
const barbijo = cascoPalette(CASCO_PALETTE_IDS.barbijo);
const ojales = cascoPalette(CASCO_PALETTE_IDS.ojales);
const hilo = cascoPalette(CASCO_PALETTE_IDS.logoHilo);

/** Un color del sitio: sólo hexadecimal y nombre, sin paleta ni posición. */
function colorSitio(hex: string, es = 'Color') {
  return { hex, es, en: es };
}

function diseno(cambios: Partial<DisenoSitio> = {}): DisenoSitio {
  return {
    tipo: 'H1 Homologado',
    estilo: 'Argentino',
    material: 'Softshell',
    talle: { cm: 57, pulgadas: '22 1/2', talleUS: '7' },
    colores: {
      casquete: colorSitio(softshell[0].hex, softshell[0].nombre),
      visera: colorSitio(softshell[1].hex, softshell[1].nombre),
      bandaVisera: colorSitio(softshell[2].hex, softshell[2].nombre),
      bajoVisera: colorSitio(softshell[3].hex, softshell[3].nombre),
      tiraVisera: colorSitio(softshell[4].hex, softshell[4].nombre),
      correaje: colorSitio(barbijo[1].hex, barbijo[1].nombre),
      airholes: colorSitio(ojales[1].hex, ojales[1].nombre),
    },
    bordado: {
      conIniciales: true,
      iniciales: 'CK',
      tamanoIniciales: 'Mediano',
      tipografia: 'playfair',
      posicionIniciales: 'izquierda',
      hilo: colorSitio(hilo[1].hex, hilo[1].nombre),
      conLogo: false,
      posicionLogo: 'atras',
      tamanoLogo: 'Grande',
      hiloLogo: colorSitio(hilo[2].hex, hilo[2].nombre),
    },
    isologo: colorSitio(hilo[0].hex, hilo[0].nombre),
    ...cambios,
  };
}

test('traduce el casco del sitio al modelo del CRM', () => {
  const { config } = mapearCasco(diseno());
  assert.equal(config.version, 2);
  assert.equal(config.modelo, 'h1');
  assert.equal(config.visera, 'argentine');
  assert.equal(config.material, 'softshell');
  assert.equal(config.colores.top?.position, softshell[0].position);
  assert.equal(config.colores.peak?.position, softshell[1].position);
  assert.equal(config.colores.peakBand?.position, softshell[2].position);
  assert.equal(config.colores.underPeak?.position, softshell[3].position);
  assert.equal(config.colores.peakStrip?.position, softshell[4].position);
  assert.equal(config.colores.strap?.palette, CASCO_PALETTE_IDS.barbijo);
  assert.equal(config.colores.airholes.palette, CASCO_PALETTE_IDS.ojales);
  assert.equal(config.logoIconic.palette, CASCO_PALETTE_IDS.logoHilo);
});

test('el estilo Lock english no lleva banda de visera', () => {
  const { config } = mapearCasco(diseno({ estilo: 'Lock english' }));
  assert.equal(config.visera, 'english');
  assert.equal(config.colores.peakBand, undefined);
});

test('el casco sin homologar es el modelo standard', () => {
  const { config } = mapearCasco(diseno({ tipo: 'Standard sin homologar' }));
  assert.equal(config.modelo, 'standard');
});

test('las iniciales viajan con su posición y tamaño', () => {
  const { config, avisos } = mapearCasco(diseno());
  assert.equal(config.iniciales?.texto, 'CK');
  assert.equal(config.iniciales?.posicion, 'left_side');
  assert.equal(config.iniciales?.tamano, 'M');
  // El CRM usa el catálogo de tipografías del sitio: entra tal cual, sin aviso.
  assert.equal(config.iniciales?.tipografia, 'playfair');
  assert.ok(!avisos.some((a) => a.includes('Tipografía')));
});

test('una tipografía que el CRM todavía no tiene cae en la de por defecto', () => {
  const d = diseno();
  d.bordado.tipografia = 'inventada';
  const { config, avisos } = mapearCasco(d);
  assert.equal(config.iniciales?.tipografia, FONT_DEFAULT);
  assert.ok(avisos.some((a) => a.includes('inventada')));
});

test('el talle elegido en el sitio entra tal cual', () => {
  const { config, avisos } = mapearCasco(diseno());
  assert.deepEqual(config.talle, { cm: 57, pulgadas: '22 1/2', talleUS: '7' });
  assert.ok(!avisos.some((a) => a.includes('talle')));
});

test('sin talle queda vacío y se avisa', () => {
  const { config, avisos } = mapearCasco(diseno({ talle: undefined }));
  assert.equal(config.talle, '');
  assert.ok(avisos.some((a) => a.includes('talle')));
});

test('la configuración traducida pasa el parser del CRM', () => {
  const { config } = mapearCasco(diseno());
  // Con el talle del sitio ya no hace falta completar nada para que valide.
  assert.doesNotThrow(() => parseCasco(config));
});

test('un color que no está en la paleta del CRM no se reemplaza por uno parecido', () => {
  const { config, avisos } = mapearCasco(
    diseno({
      colores: { ...diseno().colores, casquete: colorSitio('#abcdef', 'Inventado') },
    }),
  );
  assert.equal(config.colores.top?.position, softshell[0].position);
  assert.ok(avisos.some((a) => a.includes('Inventado') && a.includes('#abcdef')));
});

test('el logo del club se carga con su imagen ya subida', () => {
  const d = diseno();
  d.bordado.conLogo = true;
  d.bordado.posicionLogo = 'atras';
  const { config } = mapearCasco(d, [], '/api/images/11111111-1111-1111-1111-111111111111');
  assert.equal(config.logoPropio?.posicion, 'back');
  assert.equal(config.logoPropio?.tamano, 'L');
  assert.equal(config.logoPropio?.imagen, '/api/images/11111111-1111-1111-1111-111111111111');
});

test('sin la imagen del logo no se arma el logo propio y se avisa', () => {
  const d = diseno();
  d.bordado.conLogo = true;
  const { config, avisos } = mapearCasco(d, [], '');
  assert.equal(config.logoPropio, undefined);
  assert.ok(avisos.some((a) => a.includes('logo del club')));
});

test('iniciales y logo en el mismo lugar: quedan las iniciales y se avisa', () => {
  const d = diseno();
  d.bordado.conLogo = true;
  d.bordado.posicionLogo = 'izquierda';
  d.bordado.posicionIniciales = 'izquierda';
  const { config, avisos } = mapearCasco(d, [], '/api/images/22222222-2222-2222-2222-222222222222');
  assert.ok(config.iniciales);
  assert.equal(config.logoPropio, undefined);
  assert.ok(avisos.some((a) => a.includes('mismo lugar')));
});

test('Print: lleva la imagen y sólo correaje y tapones con color', () => {
  const print = '/api/images/33333333-3333-3333-3333-333333333333';
  const { config, avisos } = mapearCasco(diseno({ material: 'Print' }), [], '', print);
  assert.equal(config.material, 'prints');
  assert.equal(config.printImagen, print);
  // El sitio igual manda esos colores: con Print no significan nada.
  assert.equal(config.colores.top, undefined);
  assert.equal(config.colores.peak, undefined);
  assert.equal(config.colores.peakBand, undefined);
  assert.equal(config.colores.underPeak, undefined);
  assert.equal(config.colores.peakStrip, undefined);
  assert.equal(config.colores.strap?.palette, CASCO_PALETTE_IDS.barbijo);
  assert.equal(config.colores.airholes.palette, CASCO_PALETTE_IDS.ojales);
  assert.deepEqual(avisos, []);
  assert.doesNotThrow(() => parseCasco(config));
});

test('Print sin la imagen cargada: se avisa y el pedido no valida hasta subirla', () => {
  const { config, avisos } = mapearCasco(diseno({ material: 'Print' }));
  assert.equal(config.printImagen, '');
  assert.ok(avisos.some((a) => a.includes('Imagen del Print')));
  assert.throws(() => parseCasco(config), /Elegí un print o subí una imagen/);
});

test('Print del catálogo: queda el id, sin imagen subida ni aviso', () => {
  const d = diseno({ material: 'Print', printId: 'camo-azul', printNombre: 'Camuflaje azul' });
  const { config, avisos } = mapearCasco(d);
  assert.equal(config.printCatalogoId, 'camo-azul');
  assert.equal(config.printImagen, undefined);
  assert.deepEqual(avisos, []);
  assert.equal(printDelCatalogo(d), 'camo-azul');
  assert.doesNotThrow(() => parseCasco(config));
});

test('Print con un id que el CRM no tiene: queda como imagen propia y se avisa', () => {
  const print = '/api/images/44444444-4444-4444-4444-444444444444';
  const d = diseno({ material: 'Print', printId: 'nuevo-del-sitio', printNombre: 'Nuevo' });
  assert.equal(printDelCatalogo(d), '');
  const { config, avisos } = mapearCasco(d, [], '', print);
  assert.equal(config.printCatalogoId, undefined);
  assert.equal(config.printImagen, print);
  assert.ok(avisos.some((a) => a.includes('Nuevo')));
});

test('las capturas del diseño quedan en la configuración', () => {
  const fotos = ['/api/images/aaaa', '/api/images/bbbb'];
  const { config } = mapearCasco(diseno(), fotos);
  assert.equal(config.disenoImagen, fotos[0]);
  assert.deepEqual(config.disenoImagenes, fotos);
});

test('las notas llevan la solicitud, lo que no es casco y los avisos', () => {
  const solicitud: SolicitudSitio = {
    v: 1,
    creada: '2026-10-06T12:00:00.000Z',
    cliente: {
      name: 'Tony Heguy',
      email: 'tony@example.com',
      phone: '+54 11',
      country: 'Argentina',
      club: 'El Picaflor',
      notes: 'Para la temporada.',
      language: 'es',
    },
    items: [
      { name: 'Casco', subtitle: 'H1', details: ['Casquete: Negro'], diseno: diseno(), imagenes: [] },
      { name: 'Botas', subtitle: 'Triple cuero', details: ['Alto de caña: 44 cm'], imagenes: [] },
    ],
  };
  const notas = notasDeSolicitud(solicitud, 'A'.repeat(32), ['Falta el talle.']);
  assert.ok(notas.includes('A'.repeat(32)));
  assert.ok(notas.includes('2026-10-06'));
  assert.ok(notas.includes('El Picaflor'));
  assert.ok(notas.includes('Para la temporada.'));
  // Las botas no se traducen, así que su detalle tiene que quedar escrito.
  assert.ok(notas.includes('Alto de caña: 44 cm'));
  assert.ok(notas.includes('Falta el talle.'));
  // El casco ya viaja en la configuración: no se repite en las notas.
  assert.ok(!notas.includes('Casquete: Negro'));
});

test('el club y el país del cliente quedan para su ficha de contacto', () => {
  const cliente = {
    name: 'Tony Heguy',
    email: 'tony@example.com',
    phone: '+54 11',
    country: 'Argentina',
    club: 'El Picaflor',
    notes: '',
    language: 'es' as const,
  };
  assert.equal(notasDeCliente(cliente), 'Club: El Picaflor · País: Argentina');
  // Sin esos datos no deja una ficha con separadores sueltos.
  assert.equal(notasDeCliente({ ...cliente, club: '', country: '' }), '');
  assert.equal(notasDeCliente({ ...cliente, country: '' }), 'Club: El Picaflor');
});
