/**
 * Puente con el sitio iconicpolo.com.
 *
 * El sitio guarda cada solicitud de consulta y el mail al taller trae un botón
 * que abre el CRM con `?solicitud=<id>`. Acá se traduce lo que armó el cliente
 * en el personalizador del sitio al modelo del CRM, para precargar el
 * formulario de pedido nuevo.
 *
 * Nada de esto guarda un pedido: la traducción es siempre un borrador que
 * Christian revisa, completa con precios y confirma. Lo que no se puede
 * traducir no se inventa: va a `avisos` y a las notas del pedido.
 *
 * Hoy sólo se traducen los cascos, que son lo único que el sitio manda
 * estructurado. Las monturas, botas y rodilleras llegan como texto y se
 * vuelcan en las notas.
 */

import {
  cascoPalette,
  firstCascoColor,
  CASCO_PALETTE_IDS,
  CASCO_TALLES,
  type CascoMaterialTipo,
  type ColorElegido,
} from './casco-catalog.ts';
import {
  defaultCasco,
  FONT_DEFAULT,
  FONTS,
  type CascoConfigV2,
  type CascoPosicion,
} from './configure.ts';
import { PRINTS_CATALOGO } from './print-catalogo.ts';

/** Una solicitud tal como la entrega `GET /api/solicitud/<id>` del sitio. */
export type SolicitudSitio = {
  v: 1;
  creada: string;
  cliente: {
    name: string;
    email: string;
    phone: string;
    country: string;
    club: string;
    notes: string;
    language: 'es' | 'en';
  };
  items: Array<{
    name: string;
    subtitle: string;
    details: string[];
    diseno?: DisenoSitio;
    imagenes: Array<{ label: string; mimeType: string; dataUrl: string }>;
  }>;
};

type ColorSitio = { hex: string; es: string; en: string };

/** El casco del personalizador del sitio. Las zonas tienen otros nombres. */
export type DisenoSitio = {
  tipo: string;
  estilo: 'Argentino' | 'Lock english';
  material: 'Tela' | 'Cuero' | 'Softshell' | 'Print';
  /** Sin talle = el cliente lo define con el taller. */
  talle?: { cm: number; pulgadas: string; talleUS: string };
  /**
   * Con Print los colores de casquete, visera, banda, bajo visera y tira
   * siguen viniendo, pero no significan nada: el color lo pone la imagen.
   */
  colores: Record<
    | 'casquete'
    | 'visera'
    | 'bandaVisera'
    | 'bajoVisera'
    | 'tiraVisera'
    | 'correaje'
    | 'airholes',
    ColorSitio
  >;
  bordado: {
    conIniciales: boolean;
    iniciales: string;
    tamanoIniciales: 'Chico' | 'Mediano' | 'Grande';
    tipografia: string;
    posicionIniciales: 'izquierda' | 'atras';
    hilo: ColorSitio;
    conLogo: boolean;
    posicionLogo: 'izquierda' | 'atras';
    tamanoLogo: 'Chico' | 'Mediano' | 'Grande';
    hiloLogo: ColorSitio;
  };
  isologo: ColorSitio;
  logoDataUrl?: string;
  /** La imagen del Print, sólo si `material` es 'Print'. */
  printDataUrl?: string;
  /** Id del catálogo de Print; vacío o ausente = imagen propia del cliente. */
  printId?: string;
  /** Nombre del print a mostrar, como lo vio el cliente. */
  printNombre?: string;
};

/** El print del catálogo que eligió el cliente, si el CRM lo tiene. */
export function printDelCatalogo(diseno: DisenoSitio): string {
  const id = (diseno.printId || '').trim();
  return id && PRINTS_CATALOGO.some((print) => print.id === id) ? id : '';
}

export type PrefillItem = {
  /** Plantilla configurable del CRM: `cfg-casco`. */
  product_id: string;
  config: CascoConfigV2;
};

export type OrderPrefill = {
  solicitud_id: string;
  /** Cliente ya existente que coincide por email, si hay uno. */
  customer_id: string;
  /** Datos para crear el cliente, si no coincide ninguno. */
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    /** Club y país: son del cliente, no del pedido, así que van a su ficha. */
    notes: string;
  };
  notes: string;
  items: PrefillItem[];
  /** Lo que no se pudo traducir y hay que revisar a mano. */
  avisos: string[];
};

const MATERIALES: Record<DisenoSitio['material'], CascoMaterialTipo> = {
  Tela: 'cloth',
  Cuero: 'leather',
  Softshell: 'softshell',
  Print: 'prints',
};

const POSICIONES: Record<'izquierda' | 'atras', CascoPosicion> = {
  izquierda: 'left_side',
  atras: 'back',
};

const TAMANOS: Record<'Chico' | 'Mediano' | 'Grande', 'S' | 'M' | 'L'> = {
  Chico: 'S',
  Mediano: 'M',
  Grande: 'L',
};

/**
 * Busca el color en la paleta del CRM por su hexadecimal.
 *
 * Las dos paletas salieron del mismo relevamiento, así que los hexadecimales
 * coinciden; igual se chequea, porque los dos proyectos son repos distintos y
 * pueden separarse. Si no coincide no se elige un color parecido: queda el
 * primero de la paleta y se avisa, para que no pase un color inventado por uno
 * elegido por el cliente.
 */
function colorPorHex(
  palette: string,
  color: ColorSitio,
  etiqueta: string,
  avisos: string[],
): ColorElegido {
  const hex = (color?.hex || '').toLowerCase();
  const encontrado = cascoPalette(palette).find(
    (item) => item.hex.toLowerCase() === hex,
  );
  if (!encontrado) {
    avisos.push(
      `${etiqueta}: el cliente eligió «${color?.es || hex}» (${hex}), que no está en la paleta del CRM. Quedó el primer color de la paleta: revisalo.`,
    );
    return firstCascoColor(palette);
  }
  return {
    palette,
    position: encontrado.position,
    nombre: encontrado.nombre,
    hex: encontrado.hex,
  };
}

/**
 * La tipografía elegida en el sitio. El CRM usa el mismo catálogo, así que
 * entra tal cual; el chequeo está por si el sitio agrega una y el CRM todavía
 * no la tiene.
 */
function tipografiaDelSitio(id: string, avisos: string[]): string {
  if (FONTS.some((font) => font.id === id)) return id;
  avisos.push(
    `Tipografía de las iniciales: el cliente eligió «${id}» en el sitio y el CRM todavía no la tiene. Quedó la de por defecto: elegila a mano.`,
  );
  return FONT_DEFAULT;
}

/**
 * El talle elegido en el sitio. Es la misma tabla en los dos lados, así que se
 * busca por centímetros; vacío significa que el cliente eligió definirlo con el
 * taller, y entonces el formulario lo pide antes de guardar.
 */
function talleDelSitio(
  talle: DisenoSitio['talle'],
  avisos: string[],
): CascoConfigV2['talle'] {
  if (!talle) {
    avisos.push('Falta el talle: el cliente eligió definirlo con el taller.');
    return '';
  }
  const conocido = CASCO_TALLES.find((t) => t.cm === Number(talle.cm));
  if (!conocido) {
    avisos.push(
      `Talle: el cliente eligió ${talle.cm} cm y el CRM no tiene ese talle. Elegilo a mano.`,
    );
    return '';
  }
  return { cm: conocido.cm, pulgadas: conocido.pulgadas, talleUS: conocido.talleUS };
}

/**
 * Traduce el casco del sitio a la configuración del CRM.
 *
 * `imagenes` son las capturas del diseño ya subidas al CRM (rutas
 * `/api/images/<id>`), `logoImagen` el logo del club del cliente y
 * `printImagen` la imagen del Print, también ya subidos. Las imágenes se suben
 * antes porque la configuración del CRM guarda rutas, no archivos.
 */
export function mapearCasco(
  diseno: DisenoSitio,
  imagenes: string[] = [],
  logoImagen = '',
  printImagen = '',
): { config: CascoConfigV2; avisos: string[] } {
  const avisos: string[] = [];
  const material = MATERIALES[diseno.material];
  if (!material)
    avisos.push(
      `Material: el cliente eligió «${diseno.material}» en el sitio y el CRM todavía no lo tiene. Quedó Tela: elegilo a mano.`,
    );
  const visera = diseno.estilo === 'Argentino' ? 'argentine' : 'english';
  const config: CascoConfigV2 = {
    ...defaultCasco(),
    modelo: diseno.tipo.includes('Homologado') ? 'h1' : 'standard',
    visera,
    material: material || 'cloth',
    colores: {
      strap: colorPorHex(
        CASCO_PALETTE_IDS.barbijo,
        diseno.colores.correaje,
        'Correaje',
        avisos,
      ),
      airholes: colorPorHex(
        CASCO_PALETTE_IDS.ojales,
        diseno.colores.airholes,
        'Tapones',
        avisos,
      ),
    },
    logoIconic: colorPorHex(
      CASCO_PALETTE_IDS.logoHilo,
      diseno.isologo,
      'Logo Iconic',
      avisos,
    ),
    talle: talleDelSitio(diseno.talle, avisos),
    disenoImagen: imagenes[0] || '',
    disenoImagenes: imagenes,
  };
  if (config.material === 'prints') {
    // Con Print la tela no lleva color: lo pone la imagen. Los colores de esas
    // zonas que igual manda el sitio se ignoran.
    const catalogoId = printDelCatalogo(diseno);
    if (catalogoId) {
      config.printCatalogoId = catalogoId;
    } else {
      if (diseno.printId)
        avisos.push(
          `Print: el cliente eligió «${diseno.printNombre || diseno.printId}» del catálogo del sitio y el CRM todavía no lo tiene. Quedó como imagen propia.`,
        );
      config.printImagen = printImagen;
      if (!printImagen)
        avisos.push(
          'El cliente eligió Print, pero no se pudo cargar su imagen: está adjunta en el mail como «Imagen del Print». Subila a mano.',
        );
    }
  } else {
    const palette = config.material;
    const c = diseno.colores;
    config.colores.top = colorPorHex(palette, c.casquete, 'Casquete', avisos);
    config.colores.peak = colorPorHex(palette, c.visera, 'Visera', avisos);
    config.colores.underPeak = colorPorHex(palette, c.bajoVisera, 'Bajo visera', avisos);
    config.colores.peakStrip = colorPorHex(palette, c.tiraVisera, 'Tira de visera', avisos);
    // La banda de visera sólo existe en el estilo argentino, igual que en el sitio.
    if (visera === 'argentine')
      config.colores.peakBand = colorPorHex(palette, c.bandaVisera, 'Banda de visera', avisos);
  }
  const b = diseno.bordado;
  const posIniciales = POSICIONES[b.posicionIniciales];
  const posLogo = POSICIONES[b.posicionLogo];
  if (b.conIniciales && b.iniciales.trim()) {
    config.iniciales = {
      posicion: posIniciales,
      texto: b.iniciales.trim().slice(0, 24),
      tamano: TAMANOS[b.tamanoIniciales],
      colorHilo: colorPorHex(
        CASCO_PALETTE_IDS.logoHilo,
        b.hilo,
        'Hilo de las iniciales',
        avisos,
      ),
      tipografia: tipografiaDelSitio(b.tipografia, avisos),
    };
  }
  if (b.conLogo) {
    // El sitio ya no deja poner las dos cosas en el mismo lugar: al mover una,
    // la otra se va a la ubicación libre. Esto queda como red por si llega una
    // solicitud vieja o un payload armado a mano, que el CRM rechazaría.
    if (config.iniciales && posLogo === posIniciales) {
      avisos.push(
        `La solicitud trae las iniciales y el logo del club en el mismo lugar (${posLogo === 'back' ? 'atrás' : 'lateral izquierdo'}), que el CRM no permite. Quedaron las iniciales: el logo hay que ubicarlo a mano.`,
      );
    } else if (!logoImagen) {
      avisos.push(
        'El cliente pidió el logo del club bordado, pero no se pudo cargar la imagen. Agregala a mano.',
      );
    } else {
      config.logoPropio = {
        posicion: posLogo,
        imagen: logoImagen,
        tamano: TAMANOS[b.tamanoLogo],
        colorHilo: colorPorHex(
          CASCO_PALETTE_IDS.logoHilo,
          b.hiloLogo,
          'Hilo del logo',
          avisos,
        ),
      };
    }
  }
  return { config, avisos };
}

/** Club y país del cliente, para la ficha del contacto nuevo. */
export function notasDeCliente(cliente: SolicitudSitio['cliente']): string {
  return [
    cliente.club ? `Club: ${cliente.club}` : '',
    cliente.country ? `País: ${cliente.country}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** El texto que queda en las notas del pedido: la solicitud tal cual llegó. */
export function notasDeSolicitud(
  solicitud: SolicitudSitio,
  solicitudId: string,
  avisos: string[],
): string {
  const partes: string[] = [`Solicitud del sitio ${solicitudId} (${solicitud.creada.slice(0, 10)}).`];
  const cliente = solicitud.cliente;
  const datos = [
    cliente.club ? `Club: ${cliente.club}` : '',
    cliente.country ? `País: ${cliente.country}` : '',
    cliente.language === 'en' ? 'Usó el sitio en inglés.' : '',
  ].filter(Boolean);
  if (datos.length) partes.push(datos.join(' · '));
  if (cliente.notes) partes.push(`Notas del cliente: ${cliente.notes}`);
  for (const item of solicitud.items) {
    // Los cascos ya viajan en la configuración; el resto sólo existe como texto.
    if (item.diseno) continue;
    partes.push(
      [`${item.name} (${item.subtitle})`, ...item.details.map((d) => `  - ${d}`)].join('\n'),
    );
  }
  if (avisos.length) partes.push(['A revisar:', ...avisos.map((a) => `  - ${a}`)].join('\n'));
  return partes.join('\n\n');
}
