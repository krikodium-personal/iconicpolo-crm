import rawCatalog from './casco-catalogo.json' with { type: 'json' };

export type CatalogColor = {
  position: number;
  hex: string;
  nombre: string;
  nombreEn?: string;
};

export type ColorElegido = {
  palette: string;
  position: number;
  nombre: string;
  hex: string;
};

export type CascoVisera = 'argentine' | 'english';
export type CascoMaterialTipo = 'cloth' | 'leather' | 'softshell' | 'prints';
export type CascoEstampado = 'topographic' | 'halftone' | 'lightning';
export type CascoPosicion = 'left_side' | 'back';
export type CascoTamano = 'S' | 'M' | 'L';
export type CascoTalle = { cm: number; pulgadas: string; talleUS: string };

type RawColor = {
  position?: number | null;
  hex?: string | null;
  nombre: string;
  nombreEn?: string;
};

type CatalogFile = {
  estilosVisera: { id: CascoVisera; nombre: string; default?: boolean }[];
  tiposMaterial: {
    id: CascoMaterialTipo;
    nombre: string;
    default?: boolean;
    sinColor?: boolean;
  }[];
  paletasTela: Record<'cloth' | 'leather' | 'softshell', RawColor[]>;
  paletaBarbijo: RawColor[];
  paletaOjales: RawColor[];
  paletaLogoHilo: RawColor[];
  estampados: { id: CascoEstampado; nombre: string }[];
  partesTela: { id: string; nombre: string }[];
  partesFijas: { id: string; nombre: string; paleta: string }[];
  posiciones: { id: CascoPosicion; nombre: string }[];
  tamanosIniciales: Record<
    CascoPosicion,
    { id: CascoTamano; nombre: string; mm: number }[]
  >;
  tamanosLogo: { id: CascoTamano; nombre: string }[];
  talles: CascoTalle[];
};

const catalog = rawCatalog as CatalogFile;

/** Amarillo Girasol has no hex in the source catalog; nearby sunflower yellow. */
const SUNFLOWER_YELLOW = '#e8c547';

function normalizePalette(colors: RawColor[]): CatalogColor[] {
  const used = new Set<number>();
  const next: CatalogColor[] = [];
  for (const color of colors) {
    let position = Number(color.position);
    if (!Number.isInteger(position) || position < 1) {
      position = 1;
      while (used.has(position)) position += 1;
    }
    used.add(position);
    const hex =
      typeof color.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(color.hex)
        ? color.hex
        : color.nombre === 'Amarillo Girasol'
          ? SUNFLOWER_YELLOW
          : '#cccccc';
    next.push({
      position,
      hex,
      nombre: color.nombre,
      nombreEn: color.nombreEn,
    });
  }
  return next.sort((a, b) => a.position - b.position);
}

export const CASCO_VISERAS = catalog.estilosVisera;
export const CASCO_MATERIALES = catalog.tiposMaterial;
export const CASCO_ESTAMPADOS = catalog.estampados;
export const CASCO_POSICIONES = catalog.posiciones;
export const CASCO_TAMANOS_INICIALES = catalog.tamanosIniciales;
export const CASCO_TAMANOS_LOGO = catalog.tamanosLogo;
export const CASCO_TALLES = catalog.talles;

export const CASCO_PALETAS_TELA = {
  cloth: normalizePalette(catalog.paletasTela.cloth),
  leather: normalizePalette(catalog.paletasTela.leather),
  softshell: normalizePalette(catalog.paletasTela.softshell),
} as const;

export const CASCO_PALETA_BARBIJO = normalizePalette(catalog.paletaBarbijo);
export const CASCO_PALETA_OJALES = normalizePalette(catalog.paletaOjales);
export const CASCO_PALETA_LOGO_HILO = normalizePalette(catalog.paletaLogoHilo);

export const CASCO_PALETTE_IDS = {
  cloth: 'cloth',
  leather: 'leather',
  softshell: 'softshell',
  barbijo: 'paletaBarbijo',
  ojales: 'paletaOjales',
  logoHilo: 'paletaLogoHilo',
} as const;

export function cascoPalette(id: string): CatalogColor[] {
  if (id === 'cloth' || id === 'leather' || id === 'softshell')
    return CASCO_PALETAS_TELA[id];
  if (id === 'paletaBarbijo') return CASCO_PALETA_BARBIJO;
  if (id === 'paletaOjales') return CASCO_PALETA_OJALES;
  if (id === 'paletaLogoHilo') return CASCO_PALETA_LOGO_HILO;
  return [];
}

export function cascoColor(
  palette: string,
  position: number,
): CatalogColor | undefined {
  return cascoPalette(palette).find((color) => color.position === position);
}

export function firstCascoColor(palette: string): ColorElegido {
  const color = cascoPalette(palette)[0];
  if (!color) {
    throw new Error(`Paleta ${palette} vacía.`);
  }
  return {
    palette,
    position: color.position,
    nombre: color.nombre,
    hex: color.hex,
  };
}

export function chosenCascoColor(
  palette: string,
  position: number,
): ColorElegido | undefined {
  const color = cascoColor(palette, position);
  if (!color) return undefined;
  return {
    palette,
    position: color.position,
    nombre: color.nombre,
    hex: color.hex,
  };
}

export function viseraLabel(id: string, lang: 'es' | 'en' = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      argentine: 'Argentine',
      english: 'English',
    };
    return en[id] || id;
  }
  return CASCO_VISERAS.find((item) => item.id === id)?.nombre || id;
}

export function materialLabel(id: string, lang: 'es' | 'en' = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      cloth: 'Cloth',
      leather: 'Leather',
      softshell: 'Softshell',
      prints: 'Print',
    };
    return en[id] || id;
  }
  return CASCO_MATERIALES.find((item) => item.id === id)?.nombre || id;
}

export function estampadoLabel(id: string, lang: 'es' | 'en' = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      topographic: 'Topographic',
      halftone: 'Halftone',
      lightning: 'Lightning',
    };
    return en[id] || id;
  }
  return CASCO_ESTAMPADOS.find((item) => item.id === id)?.nombre || id;
}

export function posicionLabel(id: string, lang: 'es' | 'en' = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      left_side: 'Left side',
      back: 'Back',
    };
    return en[id] || id;
  }
  return CASCO_POSICIONES.find((item) => item.id === id)?.nombre || id;
}

export function talleLabel(talle: CascoTalle) {
  return `${talle.cm} cm · ${talle.pulgadas} in · Size ${talle.talleUS}`;
}

export function findCascoTalle(cm: number) {
  return CASCO_TALLES.find((talle) => talle.cm === cm);
}

export function inicialesTamanoLabel(
  posicion: CascoPosicion,
  id: CascoTamano,
  lang: 'es' | 'en' = 'es',
) {
  const size = CASCO_TAMANOS_INICIALES[posicion].find((item) => item.id === id);
  if (!size) return id;
  if (lang === 'en') {
    const en: Record<string, string> = {
      S: 'Small',
      M: 'Medium',
      L: 'Large',
    };
    return `${en[id] || id} · ${size.mm} mm`;
  }
  return `${size.nombre} · ${size.mm} mm`;
}

export function inicialesMm(posicion: CascoPosicion, id: CascoTamano) {
  return (
    CASCO_TAMANOS_INICIALES[posicion].find((item) => item.id === id)?.mm || id
  );
}

export function logoTamanoLabel(id: string, lang: 'es' | 'en' = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      S: 'Small',
      M: 'Medium',
      L: 'Large',
    };
    return en[id] || id;
  }
  return CASCO_TAMANOS_LOGO.find((item) => item.id === id)?.nombre || id;
}

export function cascoChosenColorName(
  color: ColorElegido | null | undefined,
  lang: 'es' | 'en' = 'es',
) {
  if (!color) return '';
  if (lang === 'en') {
    const found = cascoColor(color.palette, color.position);
    return found?.nombreEn || color.nombre;
  }
  return color.nombre;
}

export const CASCO_MATERIAL_PRICE_KEY: Record<CascoMaterialTipo, string> = {
  cloth: 'material_tela',
  leather: 'material_cuero',
  softshell: 'material_softshell',
  prints: 'material_prints',
};

export const CASCO_FABRIC_PARTS = [
  { id: 'top', field: 'top', label: 'Casquete' },
  { id: 'peak', field: 'peak', label: 'Visera' },
  { id: 'peak_band', field: 'peakBand', label: 'Banda de visera' },
  { id: 'under_peak', field: 'underPeak', label: 'Bajo visera' },
] as const;
