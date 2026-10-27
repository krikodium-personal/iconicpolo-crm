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
 * Se traducen los cascos y los tacos, que son lo que el sitio manda
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
  defaultTaco,
  FONT_DEFAULT,
  FONTS,
  type CascoConfigV2,
  type CascoPosicion,
  type ProductConfig,
} from './configure.ts';
import { PRINTS_CATALOGO } from './print-catalogo.ts';
import {
  TACO_FLEX,
  TACO_INICIALES_MAX,
  TACO_LACAS,
  TACO_MANIJAS,
  TACO_NATURAL,
  TACO_PESOS,
  TACO_PUNTERAS,
  TACO_TAMANOS,
  TACO_ZONAS,
  tacoColorPorNombre,
  type TacoColor,
  type TacoConfig,
} from './taco-catalog.ts';

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
    disenoTaco?: DisenoTacoSitio;
    imagenes: Array<{ label: string; mimeType: string; dataUrl: string }>;
  }>;
};

/**
 * El taco del personalizador del sitio. Las opciones viajan con el texto que
 * ve el cliente; los colores, con su nombre, porque en las lacas hay dos que
 * comparten hexadecimal.
 */
export type DisenoTacoSitio = {
  tamano: number;
  /** '' = estándar: el cliente no eligió el flex. */
  flex: string;
  /** 0 = estándar. */
  peso: number;
  /** '' = estándar. */
  manija: string;
  colores: Record<'cigarro' | 'bandas' | 'extremos' | 'puntas' | 'puntera', ColorSitio>;
  colorNumero: 'Negro' | 'Blanco';
  /** Una letra por casilla, '' si está vacía. Vacío del todo = sin iniciales. */
  iniciales: string[];
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
  /** Plantilla configurable del CRM: `cfg-casco` o `cfg-taco`. */
  product_id: string;
  config: ProductConfig;
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

/**
 * Una opción del taco por el texto del sitio. Si no la encuentra no inventa
 * una parecida: deja la de fábrica y avisa.
 */
function opcionTaco<T extends string>(
  lista: readonly { id: T; label: string }[],
  texto: string,
  porDefecto: T,
  etiqueta: string,
  avisos: string[],
): T {
  const encontrada = lista.find(
    (o) => o.label.toLowerCase() === (texto || '').trim().toLowerCase(),
  );
  if (encontrada) return encontrada.id;
  avisos.push(
    `${etiqueta}: el cliente eligió «${texto}» y el CRM no tiene esa opción. Quedó la de fábrica: revisala.`,
  );
  return porDefecto;
}

function numeroTaco<T extends number>(
  lista: readonly T[],
  valor: number,
  porDefecto: T,
  etiqueta: string,
  unidad: string,
  avisos: string[],
): T {
  if (lista.includes(Number(valor) as T)) return Number(valor) as T;
  avisos.push(
    `${etiqueta}: el cliente eligió ${valor}${unidad} y el CRM no tiene esa medida. Quedó ${porDefecto}${unidad}: revisala.`,
  );
  return porDefecto;
}

function colorTaco(
  paleta: TacoColor[],
  color: ColorSitio | undefined,
  etiqueta: string,
  avisos: string[],
): string {
  const encontrado = color ? tacoColorPorNombre(paleta, color.es) : undefined;
  if (encontrado) return encontrado.id;
  avisos.push(
    `${etiqueta}: el cliente eligió «${color?.es || color?.hex || 'sin color'}», que no está en la paleta del CRM. Quedó Natural: revisalo.`,
  );
  return TACO_NATURAL;
}

/**
 * Traduce el taco del sitio a la configuración del CRM. `imagenes` son los
 * renders ya subidos al CRM.
 */
export function mapearTaco(
  diseno: DisenoTacoSitio,
  imagenes: string[] = [],
): { config: TacoConfig; avisos: string[] } {
  const avisos: string[] = [];
  const base = defaultTaco();
  const letras = Array.from(
    { length: TACO_INICIALES_MAX },
    (_, i) => (diseno.iniciales?.[i] || '').trim().toUpperCase().slice(0, 1),
  );
  const conIniciales = letras.some(Boolean);
  const config: TacoConfig = {
    tamano: numeroTaco(TACO_TAMANOS, diseno.tamano, base.tamano, 'Tamaño', '"', avisos),
    conFlex: !!diseno.flex,
    flex: diseno.flex
      ? opcionTaco(TACO_FLEX, diseno.flex, base.flex, 'Flex de la caña', avisos)
      : base.flex,
    conPeso: !!diseno.peso,
    peso: diseno.peso
      ? numeroTaco(TACO_PESOS, diseno.peso, base.peso, 'Peso del cigarro', ' g', avisos)
      : base.peso,
    conManija: !!diseno.manija,
    manija: diseno.manija
      ? opcionTaco(TACO_MANIJAS, diseno.manija, base.manija, 'Medida del grip', avisos)
      : base.manija,
    colores: Object.fromEntries(
      TACO_ZONAS.map((zona) => [
        zona.id,
        colorTaco(TACO_LACAS, diseno.colores?.[zona.id], zona.label, avisos),
      ]),
    ) as TacoConfig['colores'],
    puntera: colorTaco(TACO_PUNTERAS, diseno.colores?.puntera, 'Puntera', avisos),
    colorNumero: diseno.colorNumero === 'Blanco' ? 'blanco' : 'negro',
    iniciales: conIniciales,
    inicialesTexto: conIniciales ? letras.map((l) => l || ' ').join('').trimEnd() : '',
    disenoImagenes: imagenes,
  };
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
    // Cascos y tacos ya viajan en la configuración; el resto sólo existe como texto.
    if (item.diseno || item.disenoTaco) continue;
    partes.push(
      [`${item.name} (${item.subtitle})`, ...item.details.map((d) => `  - ${d}`)].join('\n'),
    );
  }
  if (avisos.length) partes.push(['A revisar:', ...avisos.map((a) => `  - ${a}`)].join('\n'));
  return partes.join('\n\n');
}
