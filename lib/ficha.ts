import {
  BOTA_PLACES,
  FONTS,
  INITIAL_COLORS,
  KIND_TITLES,
  LEATHER_HEX,
  LEATHER_PHOTOS,
  RODILLERA_COLORS,
  RODILLERA_PLACES,
  RODILLERA_SIZES,
  configLabels,
  configuredKindOf,
  configDesignPhoto,
  configDesignPhotos,
  describeConfigured,
  fontStack,
  isNewCascoConfig,
  parseConfig,
  posicionLabel,
  inicialesMm,
  logoTamanoLabel,
  type CascoConfig,
  type ConfiguredKind,
  type MonturaConfig,
  type ProductConfig,
  type RodilleraConfig,
  type BotaConfig,
  type ColorElegido,
} from './configure.ts';
import type { Contact, Item, Product } from './types';
import { whatsapp, whatsappGroup } from './whatsapp.ts';

const KIND_NAME: Record<ConfiguredKind, string> = {
  montura: 'Montura',
  casco: 'Casco',
  rodillera: 'Rodillera',
  bota: 'Bota',
};

export type FichaSwatch = {
  label: string;
  name: string;
  hex: string;
};

export type FichaInitials = {
  text: string;
  fontId: string;
  fontName: string;
  fontFamily: string;
  colorName: string;
  hex: string;
  surfaceId?: string;
  surfaceHex?: string;
  surfacePhoto?: string;
  place?: string;
  size?: string;
};

export type FichaArtwork = {
  kind: 'logo' | 'bordado' | 'diseno';
  url: string;
  caption: string;
};

export function fichaArtworkTitle(kind: FichaArtwork['kind']) {
  if (kind === 'logo') return 'Logo personalizado';
  if (kind === 'bordado') return 'Bordado';
  return 'Diseño adicional';
}

export type FichaData = {
  orderNumber: string;
  date: string;
  productTitle: string;
  quantity: number;
  sku: string;
  supplierName: string;
  supplierPhone: string;
  supplierWhatsapp: string | null;
  supplierGroup: string | null;
  customerName: string;
  notes: string;
  description: string;
  photo?: string;
  photoLabel: string;
  labels: { label: string; value: string }[];
  swatches: FichaSwatch[];
  initials?: FichaInitials;
  artwork: FichaArtwork[];
};

function formatDate(value: string) {
  if (!value) return 'Sin definir';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function initialColor(id: string) {
  return INITIAL_COLORS.find((color) => color.id === id);
}

function fontLabel(id: string) {
  return FONTS.find((font) => font.id === id)?.label || id;
}

function leatherName(id: string) {
  if (id === 'marron') return 'Marrón';
  return RODILLERA_COLORS.find((color) => color.id === id)?.label || id;
}

function leatherSwatch(label: string, id: string): FichaSwatch {
  return {
    label,
    name: leatherName(id),
    hex: LEATHER_HEX[id] || initialColor(id)?.hex || '#1c1612',
  };
}

function chartSwatch(label: string, id: string): FichaSwatch | null {
  const color = initialColor(id);
  if (!color) return null;
  return { label, name: color.name, hex: color.hex };
}

function initialsBase(
  text: string,
  fontId: string,
  colorId: string,
  surfaceId?: string,
): FichaInitials {
  const color = initialColor(colorId);
  const surfaceHex = surfaceId
    ? LEATHER_HEX[surfaceId] || initialColor(surfaceId)?.hex
    : undefined;
  return {
    text: text.trim(),
    fontId,
    fontName: fontLabel(fontId),
    fontFamily: fontStack(fontId),
    colorName: color?.name || colorId,
    hex: color?.hex || '#111111',
    surfaceId,
    surfaceHex,
    surfacePhoto: surfaceId ? LEATHER_PHOTOS[surfaceId] : undefined,
  };
}

function skuDescription(item: Item) {
  const extras = item.selections.options.map((option) => option.name);
  return extras.length ? [item.name, ...extras].join('\n') : item.name;
}

function configuredVisuals(kind: ConfiguredKind, raw: ProductConfig) {
  const swatches: FichaSwatch[] = [];
  const artwork: FichaArtwork[] = [];
  let initials: FichaInitials | undefined;

  if (kind === 'montura') {
    const c = raw as MonturaConfig;
    swatches.push(leatherSwatch('Color', c.color));
    if (c.iniciales) {
      const color = chartSwatch('Color iniciales', c.inicialesColor);
      if (color) swatches.push(color);
      initials = {
        ...initialsBase(
          c.inicialesTexto,
          c.inicialesTipografia,
          c.inicialesColor,
          c.color,
        ),
        place: { atras: 'Atrás', faldon: 'Faldón', faldin: 'Faldín' }[
          c.inicialesUbicacion
        ],
      };
    }
    return { swatches, initials, artwork };
  }

  if (kind === 'rodillera') {
    const c = raw as RodilleraConfig;
    swatches.push(leatherSwatch('Color', c.color));
    if (c.protectorCentroColor !== c.color) {
      swatches.push(leatherSwatch('Protector centro', c.protectorCentroColor));
    }
    if (c.iniciales) {
      const color = chartSwatch('Color iniciales', c.inicialesColor);
      if (color) swatches.push(color);
      initials = {
        ...initialsBase(
          c.inicialesTexto,
          c.inicialesTipografia,
          c.inicialesColor,
          c.color,
        ),
        place:
          RODILLERA_PLACES.find((place) => place.id === c.inicialesUbicacion)
            ?.label || c.inicialesUbicacion,
        size:
          RODILLERA_SIZES.find((size) => size.id === c.inicialesTamano)?.label ||
          c.inicialesTamano,
      };
    }
    if (c.bordado && c.bordadoImagen) {
      const size =
        RODILLERA_SIZES.find((item) => item.id === c.bordadoTamano)?.label ||
        c.bordadoTamano;
      const place =
        RODILLERA_PLACES.find((item) => item.id === c.bordadoUbicacion)?.label ||
        c.bordadoUbicacion;
      artwork.push({
        kind: 'bordado',
        url: c.bordadoImagen,
        caption: `Bordado · ${size} · ${place}`,
      });
    }
    return { swatches, initials, artwork };
  }

  if (kind === 'bota') {
    const c = raw as BotaConfig;
    swatches.push(leatherSwatch('Color', c.color));
    if (c.iniciales) {
      const color = chartSwatch('Color iniciales', c.inicialesColor);
      if (color) swatches.push(color);
      initials = {
        ...initialsBase(
          c.inicialesTexto,
          c.inicialesTipografia,
          c.inicialesColor,
          c.color,
        ),
        place:
          BOTA_PLACES.find((place) => place.id === c.inicialesUbicacion)
            ?.label || c.inicialesUbicacion,
      };
    }
    return { swatches, initials, artwork };
  }

  const c = raw as CascoConfig;
  if (isNewCascoConfig(c)) {
    const pushChosen = (label: string, color?: ColorElegido) => {
      if (!color) return;
      swatches.push({ label, name: color.nombre, hex: color.hex });
    };
    pushChosen('Casquete', c.colores.top);
    pushChosen('Visera', c.colores.peak);
    if (c.visera === 'argentine')
      pushChosen('Banda de visera', c.colores.peakBand);
    pushChosen('Bajo visera', c.colores.underPeak);
    pushChosen('Barbijo', c.colores.strap);
    pushChosen('Ojales', c.colores.airholes);
    pushChosen('Logo Iconic', c.logoIconic);
    if (c.iniciales) {
      pushChosen('Color de hilo', c.iniciales.colorHilo);
      initials = {
        text: c.iniciales.texto.trim(),
        fontId: c.iniciales.tipografia,
        fontName: fontLabel(c.iniciales.tipografia),
        fontFamily: fontStack(c.iniciales.tipografia),
        colorName: c.iniciales.colorHilo.nombre,
        hex: c.iniciales.colorHilo.hex,
        surfaceHex: c.colores.top?.hex || c.colores.airholes.hex,
        place: posicionLabel(c.iniciales.posicion),
        size: `${inicialesMm(c.iniciales.posicion, c.iniciales.tamano)} mm`,
      };
    }
    if (c.logoPropio?.imagen) {
      artwork.push({
        kind: 'logo',
        url: c.logoPropio.imagen,
        caption: `Logo propio · ${logoTamanoLabel(c.logoPropio.tamano)} · ${posicionLabel(c.logoPropio.posicion)}`,
      });
    }
    const designPhotos = configDesignPhotos('casco', c);
    designPhotos.slice(1).forEach((url, index) => {
      artwork.push({
        kind: 'diseno',
        url,
        caption: `Diseño · ${index + 2} de ${designPhotos.length}`,
      });
    });
    return { swatches, initials, artwork };
  }
  const parts: [string, string][] = [
    ['Color casco', c.colorCasco],
    ['Vicera arriba', c.colorViceraArriba],
    ['Vicera abajo', c.colorViceraAbajo],
  ];
  if (c.vicera === 'argentina') parts.push(['Banda vicera', c.colorBandaVicera]);
  parts.push(['Tapones', c.colorTapones]);
  if (c.correaje) parts.push(['Correaje', c.correajeColor]);
  if (c.logoIcColorPersonalizado) parts.push(['Color logo IC', c.logoIcColor]);
  if (c.iniciales) parts.push(['Color iniciales', c.inicialesColor]);
  for (const [label, id] of parts) {
    const swatch = chartSwatch(label, id);
    if (swatch) swatches.push(swatch);
  }
  if (c.iniciales) {
    initials = {
      ...initialsBase(
        c.inicialesTexto,
        c.inicialesTipografia,
        c.inicialesColor,
        c.colorCasco,
      ),
      place: c.inicialesUbicacion === 'derecha' ? 'Derecha' : 'Izquierda',
      size: `${c.inicialesTamano} mm`,
    };
  }
  if (c.logoPersonalizado && c.logoPersonalizadoImagen) {
    const place = {
      derecha: 'Derecha',
      izquierda: 'Izquierda',
      frente: 'Frente',
      atras: 'Atrás',
    }[c.logoPersonalizadoPosicion];
    artwork.push({
      kind: 'logo',
      url: c.logoPersonalizadoImagen,
      caption: `Logo personalizado · ${c.logoPersonalizadoTamano} · ${place}`,
    });
  }
  const designPhotos = configDesignPhotos('casco', c);
  designPhotos.slice(1).forEach((url, index) => {
    artwork.push({
      kind: 'diseno',
      url,
      caption: `Diseño · ${index + 2} de ${designPhotos.length}`,
    });
  });
  return { swatches, initials, artwork };
}

export function buildFicha({
  order,
  item,
  product,
  supplier,
  customer,
  photo,
}: {
  order: { number: string; date: string; notes?: string };
  item: Item;
  product?: Product;
  supplier?: Contact;
  customer?: Contact;
  photo?: string;
}): FichaData {
  const kind = product ? configuredKindOf(product) : null;
  const description = product
    ? describeConfigured(product, item.selections.config) || skuDescription(item)
    : skuDescription(item);
  let labels: { label: string; value: string }[] = Object.entries(
    item.selections.attributes,
  ).map(([label, value]) => ({ label, value }));
  let swatches: FichaSwatch[] = [];
  let initials: FichaInitials | undefined;
  let artwork: FichaArtwork[] = [];
  let photoLabel = 'Referencia';
  if (kind && item.selections.config) {
    try {
      const config = parseConfig(kind, item.selections.config);
      labels = Object.entries(configLabels(kind, config)).map(
        ([label, value]) => ({ label, value }),
      );
      ({ swatches, initials, artwork } = configuredVisuals(kind, config));
      const design = configDesignPhoto(kind, config);
      if (design) {
        photo = design;
        photoLabel = 'Diseño';
      }
    } catch {
      /* keep stored attributes */
    }
  }
  const title = kind
    ? KIND_NAME[kind]
    : product?.name || item.name || KIND_TITLES.montura;
  return {
    orderNumber: order.number,
    date: formatDate(order.date),
    productTitle: title,
    quantity: item.quantity,
    sku: item.sku || product?.sku || '',
    supplierName: supplier?.name || '',
    supplierPhone: supplier?.phone || '',
    supplierWhatsapp: supplier?.phone ? whatsapp(supplier.phone) : null,
    supplierGroup: whatsappGroup(supplier?.whatsapp_group),
    customerName: customer?.name || '',
    notes: (order.notes || '').trim(),
    description,
    photo,
    photoLabel,
    labels,
    swatches,
    initials,
    artwork,
  };
}

export function fichaFileName(ficha: FichaData, ext: 'pdf' | 'jpg' | 'png') {
  const raw = `${ficha.productTitle}-${ficha.orderNumber}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .toLowerCase();
  return `ficha-${raw || 'pedido'}.${ext}`;
}

export function fichaShareText(ficha: FichaData) {
  const lines = [
    `Ficha técnica Iconic — Pedido Nro: ${ficha.orderNumber}`,
    ficha.productTitle,
    ficha.description.split('\n')[0],
    'Adjunto la ficha para producción.',
  ];
  return lines.filter(Boolean).join('\n');
}

const encoder = new TextEncoder();

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** One-page PDF wrapping a JPEG, scaled to A4 width. */
export function jpegToPdf(
  jpeg: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  if (!jpeg.length || width < 1 || height < 1) {
    throw new Error('No se pudo armar el PDF.');
  }
  const pageW = 595;
  const pageH = Math.max(1, Math.round((height * pageW) / width));
  const header = encoder.encode('%PDF-1.4\n');
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q\n`;
  const contentBytes = encoder.encode(content);
  const objects = [
    encoder.encode('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'),
    encoder.encode(
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    ),
    encoder.encode(
      `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >> endobj\n`,
    ),
    encoder.encode(
      `4 0 obj << /Length ${contentBytes.length} >> stream\n${content}endstream endobj\n`,
    ),
    concat([
      encoder.encode(
        `5 0 obj << /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >> stream\n`,
      ),
      jpeg,
      encoder.encode('\nendstream endobj\n'),
    ]),
  ];
  const chunks: Uint8Array[] = [header];
  const offsets = [0];
  let pos = header.length;
  for (const object of objects) {
    offsets.push(pos);
    chunks.push(object);
    pos += object.length;
  }
  const xref = [
    'xref\n',
    `0 ${offsets.length}\n`,
    '0000000000 65535 f \n',
    ...offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
    `trailer << /Size ${offsets.length} /Root 1 0 R >>\n`,
    'startxref\n',
    `${pos}\n`,
    '%%EOF\n',
  ].join('');
  chunks.push(encoder.encode(xref));
  return concat(chunks);
}
