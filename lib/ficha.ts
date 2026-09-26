import {
  BOTA_PLACES,
  FONTS,
  colorSwatch,
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
  type ConfigLang,
  type ConfiguredKind,
  type MonturaConfig,
  type ProductConfig,
  type RodilleraConfig,
  type BotaConfig,
  type ColorElegido,
} from './configure.ts';
import { cascoChosenColorName } from './casco-catalog.ts';
import type { Contact, Item, Product } from './types';
import { whatsapp, whatsappGroup } from './whatsapp.ts';

const KIND_NAME: Record<ConfiguredKind, Record<ConfigLang, string>> = {
  montura: { es: 'Montura', en: 'Saddle' },
  casco: { es: 'Casco', en: 'Helmet' },
  rodillera: { es: 'Rodillera', en: 'Knee pad' },
  bota: { es: 'Bota', en: 'Boot' },
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

export function fichaArtworkTitle(
  kind: FichaArtwork['kind'],
  lang: ConfigLang = 'es',
) {
  if (kind === 'logo')
    return lang === 'en' ? 'Custom logo' : 'Logo personalizado';
  if (kind === 'bordado') return lang === 'en' ? 'Embroidery' : 'Bordado';
  return lang === 'en' ? 'Extra design' : 'Diseño adicional';
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

/** "Rodrigo Mendoza" → "Rodrigo M." (solo en ficha técnica). */
export function shortCustomerName(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = last.charAt(0).toLocaleUpperCase();
  return initial ? `${first} ${initial}.` : first;
}

function initialColor(id: string) {
  return colorSwatch(id);
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

function configuredVisuals(
  kind: ConfiguredKind,
  raw: ProductConfig,
  lang: ConfigLang = 'es',
) {
  const swatches: FichaSwatch[] = [];
  const artwork: FichaArtwork[] = [];
  let initials: FichaInitials | undefined;
  const L = (es: string, en: string) => (lang === 'en' ? en : es);

  if (kind === 'montura') {
    const c = raw as MonturaConfig;
    swatches.push(leatherSwatch(L('Color', 'Color'), c.color));
    const placeLabel = {
      tapita: L('Tapita', 'Flap tip'),
      faldon: L('Faldón', 'Skirt flap'),
    }[c.personalizacionUbicacion];
    if (c.iniciales) {
      const color = chartSwatch(L('Color iniciales', 'Initials color'), c.inicialesColor);
      if (color) swatches.push(color);
      initials = {
        ...initialsBase(
          c.inicialesTexto,
          c.inicialesTipografia,
          c.inicialesColor,
          c.color,
        ),
        place: placeLabel,
      };
    }
    if (c.logoPersonalizado && c.logoPersonalizadoImagen) {
      const thread = chartSwatch(
        L('Color de hilo logo', 'Logo thread color'),
        c.logoPersonalizadoColor,
      );
      if (thread) swatches.push(thread);
      artwork.push({
        kind: 'logo',
        url: c.logoPersonalizadoImagen,
        caption: `${L('Logo personalizado', 'Custom logo')} · ${placeLabel} · ${thread?.name || c.logoPersonalizadoColor}`,
      });
    }
    return { swatches, initials, artwork };
  }

  if (kind === 'rodillera') {
    const c = raw as RodilleraConfig;
    swatches.push(leatherSwatch(L('Color', 'Color'), c.color));
    if (c.protectorCentroColor !== c.color) {
      swatches.push(
        leatherSwatch(L('Protector centro', 'Center protector'), c.protectorCentroColor),
      );
    }
    if (c.iniciales) {
      const color = chartSwatch(L('Color iniciales', 'Initials color'), c.inicialesColor);
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
      const color = chartSwatch(L('Color bordado', 'Embroidery color'), c.bordadoColor);
      if (color) swatches.push(color);
      const size =
        RODILLERA_SIZES.find((item) => item.id === c.bordadoTamano)?.label ||
        c.bordadoTamano;
      const place =
        RODILLERA_PLACES.find((item) => item.id === c.bordadoUbicacion)?.label ||
        c.bordadoUbicacion;
      artwork.push({
        kind: 'bordado',
        url: c.bordadoImagen,
        caption: `${L('Bordado', 'Embroidery')} · ${size} · ${place} · ${colorSwatch(c.bordadoColor)?.name || c.bordadoColor}`,
      });
    }
    return { swatches, initials, artwork };
  }

  if (kind === 'bota') {
    const c = raw as BotaConfig;
    swatches.push(leatherSwatch(L('Color', 'Color'), c.color));
    if (c.iniciales) {
      const color = chartSwatch(L('Color iniciales', 'Initials color'), c.inicialesColor);
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
      swatches.push({
        label,
        name: cascoChosenColorName(color, lang),
        hex: color.hex,
      });
    };
    pushChosen(L('Casquete', 'Shell'), c.colores.top);
    pushChosen(L('Visera', 'Peak'), c.colores.peak);
    if (c.visera === 'argentine')
      pushChosen(L('Banda de visera', 'Peak band'), c.colores.peakBand);
    pushChosen(L('Bajo visera', 'Under peak'), c.colores.underPeak);
    pushChosen(L('Correaje', 'Harness'), c.colores.strap);
    pushChosen(L('Tapones', 'Airholes'), c.colores.airholes);
    pushChosen(L('Logo Iconic', 'Iconic logo'), c.logoIconic);
    if (c.iniciales) {
      pushChosen(L('Color de hilo', 'Thread color'), c.iniciales.colorHilo);
      initials = {
        text: c.iniciales.texto.trim(),
        fontId: c.iniciales.tipografia,
        fontName: fontLabel(c.iniciales.tipografia),
        fontFamily: fontStack(c.iniciales.tipografia),
        colorName: cascoChosenColorName(c.iniciales.colorHilo, lang),
        hex: c.iniciales.colorHilo.hex,
        surfaceHex: c.colores.top?.hex || c.colores.airholes.hex,
        place: posicionLabel(c.iniciales.posicion, lang),
        size: `${inicialesMm(c.iniciales.posicion, c.iniciales.tamano)} mm`,
      };
    }
    if (c.logoPropio?.imagen) {
      pushChosen(L('Color logo propio', 'Custom logo color'), c.logoPropio.colorHilo);
      artwork.push({
        kind: 'logo',
        url: c.logoPropio.imagen,
        caption: `${L('Logo propio', 'Custom logo')} · ${logoTamanoLabel(c.logoPropio.tamano, lang)} · ${posicionLabel(c.logoPropio.posicion, lang)} · ${cascoChosenColorName(c.logoPropio.colorHilo, lang)}`,
      });
    }
    const designPhotos = configDesignPhotos('casco', c);
    designPhotos.slice(1).forEach((url, index) => {
      artwork.push({
        kind: 'diseno',
        url,
        caption: `${L('Diseño', 'Design')} · ${index + 2} ${L('de', 'of')} ${designPhotos.length}`,
      });
    });
    return { swatches, initials, artwork };
  }
  const parts: [string, string][] = [
    [L('Color casco', 'Helmet color'), c.colorCasco],
    [L('Vicera arriba', 'Peak top'), c.colorViceraArriba],
    [L('Vicera abajo', 'Peak underside'), c.colorViceraAbajo],
  ];
  if (c.vicera === 'argentina')
    parts.push([L('Banda vicera', 'Peak band'), c.colorBandaVicera]);
  parts.push([L('Tapones', 'Airholes'), c.colorTapones]);
  if (c.correaje) parts.push([L('Correaje', 'Harness'), c.correajeColor]);
  if (c.logoIcColorPersonalizado)
    parts.push([L('Color logo IC', 'IC logo color'), c.logoIcColor]);
  if (c.iniciales)
    parts.push([L('Color iniciales', 'Initials color'), c.inicialesColor]);
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
      place:
        c.inicialesUbicacion === 'derecha'
          ? L('Derecha', 'Right')
          : L('Izquierda', 'Left'),
      size: `${c.inicialesTamano} mm`,
    };
  }
  if (c.logoPersonalizado && c.logoPersonalizadoImagen) {
    const place = {
      derecha: L('Derecha', 'Right'),
      izquierda: L('Izquierda', 'Left'),
      frente: L('Frente', 'Front'),
      atras: L('Atrás', 'Back'),
    }[c.logoPersonalizadoPosicion];
    artwork.push({
      kind: 'logo',
      url: c.logoPersonalizadoImagen,
      caption: `${L('Logo personalizado', 'Custom logo')} · ${c.logoPersonalizadoTamano} · ${place}`,
    });
  }
  const designPhotos = configDesignPhotos('casco', c);
  designPhotos.slice(1).forEach((url, index) => {
    artwork.push({
      kind: 'diseno',
      url,
      caption: `${L('Diseño', 'Design')} · ${index + 2} ${L('de', 'of')} ${designPhotos.length}`,
    });
  });
  return { swatches, initials, artwork };
}

export type FichaProductDetail = {
  productTitle: string;
  description: string;
  photo?: string;
  photoLabel: string;
  labels: { label: string; value: string }[];
  swatches: FichaSwatch[];
  initials?: FichaInitials;
  artwork: FichaArtwork[];
};

export function buildFichaProductDetail({
  item,
  product,
  photo,
  lang = 'es',
}: {
  item: Item;
  product?: Product;
  photo?: string;
  lang?: ConfigLang;
}): FichaProductDetail {
  const kind = product ? configuredKindOf(product) : null;
  const description = product
    ? describeConfigured(product, item.selections.config, lang) ||
      skuDescription(item)
    : skuDescription(item);
  let labels: { label: string; value: string }[] = Object.entries(
    item.selections.attributes,
  ).map(([label, value]) => ({ label, value }));
  let swatches: FichaSwatch[] = [];
  let initials: FichaInitials | undefined;
  let artwork: FichaArtwork[] = [];
  let photoLabel = lang === 'en' ? 'Reference' : 'Referencia';
  let nextPhoto = photo;
  if (kind && item.selections.config) {
    try {
      const config = parseConfig(kind, item.selections.config);
      labels = Object.entries(configLabels(kind, config, lang)).map(
        ([label, value]) => ({ label, value }),
      );
      ({ swatches, initials, artwork } = configuredVisuals(kind, config, lang));
      const design = configDesignPhoto(kind, config);
      if (design) {
        nextPhoto = design;
        photoLabel = lang === 'en' ? 'Design' : 'Diseño';
      }
    } catch {
      /* keep stored attributes */
    }
  }
  const title = kind
    ? KIND_NAME[kind][lang]
    : product?.name || item.name || KIND_TITLES.montura;
  return {
    productTitle: title,
    description,
    photo: nextPhoto,
    photoLabel,
    labels,
    swatches,
    initials,
    artwork,
  };
}

export function buildFicha({
  order,
  item,
  product,
  supplier,
  customer,
  photo,
  lang = 'es',
}: {
  order: { number: string; date: string; notes?: string };
  item: Item;
  product?: Product;
  supplier?: Contact;
  customer?: Contact;
  photo?: string;
  lang?: ConfigLang;
}): FichaData {
  const detail = buildFichaProductDetail({ item, product, photo, lang });
  return {
    orderNumber: order.number,
    date: formatDate(order.date),
    productTitle: detail.productTitle,
    quantity: item.quantity,
    sku: item.sku || product?.sku || '',
    supplierName: supplier?.name || '',
    supplierPhone: supplier?.phone || '',
    supplierWhatsapp: supplier?.phone ? whatsapp(supplier.phone) : null,
    supplierGroup: whatsappGroup(supplier?.whatsapp_group),
    customerName: shortCustomerName(customer?.name || ''),
    notes: (order.notes || '').trim(),
    description: detail.description,
    photo: detail.photo,
    photoLabel: detail.photoLabel,
    labels: detail.labels,
    swatches: detail.swatches,
    initials: detail.initials,
    artwork: detail.artwork,
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
