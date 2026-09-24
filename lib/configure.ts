import {
  CASCO_ESTAMPADOS,
  CASCO_MATERIAL_PRICE_KEY,
  CASCO_PALETA_LOGO_HILO,
  CASCO_PALETTE_IDS,
  CASCO_POSICIONES,
  CASCO_TAMANOS_INICIALES,
  CASCO_TAMANOS_LOGO,
  CASCO_TALLES,
  CASCO_VISERAS,
  chosenCascoColor,
  cascoChosenColorName,
  estampadoLabel,
  firstCascoColor,
  inicialesMm,
  logoTamanoLabel,
  materialLabel,
  posicionLabel,
  talleLabel,
  viseraLabel,
  type CascoEstampado,
  type CascoMaterialTipo,
  type CascoPosicion,
  type CascoTamano,
  type CascoTalle,
  type CascoVisera,
  type ColorElegido,
} from './casco-catalog.ts';
import {
  cabezadaStockKey,
  parseCabezadaConfig,
} from './cabezada.ts';

export {
  CASCO_ESTAMPADOS,
  CASCO_FABRIC_PARTS,
  CASCO_MATERIAL_PRICE_KEY,
  CASCO_MATERIALES,
  CASCO_PALETA_BARBIJO,
  CASCO_PALETA_LOGO_HILO,
  CASCO_PALETA_OJALES,
  CASCO_PALETAS_TELA,
  CASCO_PALETTE_IDS,
  CASCO_POSICIONES,
  CASCO_TAMANOS_INICIALES,
  CASCO_TAMANOS_LOGO,
  CASCO_TALLES,
  CASCO_VISERAS,
  cascoPalette,
  chosenCascoColor,
  cascoChosenColorName,
  estampadoLabel,
  findCascoTalle,
  firstCascoColor,
  inicialesMm,
  inicialesTamanoLabel,
  logoTamanoLabel,
  materialLabel,
  posicionLabel,
  talleLabel,
  viseraLabel,
  type CascoEstampado,
  type CascoMaterialTipo,
  type CascoPosicion,
  type CascoTamano,
  type CascoTalle,
  type CascoVisera,
  type CatalogColor,
  type ColorElegido,
} from './casco-catalog.ts';

export const COUNTRIES = [
  'Afganistán',
  'Albania',
  'Alemania',
  'Andorra',
  'Angola',
  'Antigua y Barbuda',
  'Arabia Saudita',
  'Argelia',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaiyán',
  'Bahamas',
  'Bangladés',
  'Barbados',
  'Baréin',
  'Bélgica',
  'Belice',
  'Benín',
  'Bielorrusia',
  'Birmania',
  'Bolivia',
  'Bosnia y Herzegovina',
  'Botsuana',
  'Brasil',
  'Brunéi',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Bután',
  'Cabo Verde',
  'Camboya',
  'Camerún',
  'Canadá',
  'Catar',
  'Chad',
  'Chile',
  'China',
  'Chipre',
  'Colombia',
  'Comoras',
  'Congo',
  'Corea del Norte',
  'Corea del Sur',
  'Costa de Marfil',
  'Costa Rica',
  'Croacia',
  'Cuba',
  'Dinamarca',
  'Dominica',
  'Ecuador',
  'Egipto',
  'El Salvador',
  'Emiratos Árabes Unidos',
  'Eritrea',
  'Eslovaquia',
  'Eslovenia',
  'España',
  'Estados Unidos',
  'Estonia',
  'Etiopía',
  'Filipinas',
  'Finlandia',
  'Fiyi',
  'Francia',
  'Gabón',
  'Gambia',
  'Georgia',
  'Ghana',
  'Granada',
  'Grecia',
  'Guatemala',
  'Guinea',
  'Guinea-Bisáu',
  'Guinea Ecuatorial',
  'Guyana',
  'Haití',
  'Honduras',
  'Hungría',
  'India',
  'Indonesia',
  'Irak',
  'Irán',
  'Irlanda',
  'Islandia',
  'Islas Marshall',
  'Islas Salomón',
  'Israel',
  'Italia',
  'Jamaica',
  'Japón',
  'Jordania',
  'Kazajistán',
  'Kenia',
  'Kirguistán',
  'Kiribati',
  'Kuwait',
  'Laos',
  'Lesoto',
  'Letonia',
  'Líbano',
  'Liberia',
  'Libia',
  'Liechtenstein',
  'Lituania',
  'Luxemburgo',
  'Macedonia del Norte',
  'Madagascar',
  'Malasia',
  'Malaui',
  'Maldivas',
  'Malí',
  'Malta',
  'Marruecos',
  'Mauricio',
  'Mauritania',
  'México',
  'Micronesia',
  'Moldavia',
  'Mónaco',
  'Mongolia',
  'Montenegro',
  'Mozambique',
  'Namibia',
  'Nauru',
  'Nepal',
  'Nicaragua',
  'Níger',
  'Nigeria',
  'Noruega',
  'Nueva Zelanda',
  'Omán',
  'Países Bajos',
  'Pakistán',
  'Palaos',
  'Panamá',
  'Papúa Nueva Guinea',
  'Paraguay',
  'Perú',
  'Polonia',
  'Portugal',
  'Reino Unido',
  'República Centroafricana',
  'República Checa',
  'República Democrática del Congo',
  'República Dominicana',
  'Ruanda',
  'Rumania',
  'Rusia',
  'Samoa',
  'San Cristóbal y Nieves',
  'San Marino',
  'San Vicente y las Granadinas',
  'Santa Lucía',
  'Santo Tomé y Príncipe',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leona',
  'Singapur',
  'Siria',
  'Somalia',
  'Sri Lanka',
  'Suazilandia',
  'Sudáfrica',
  'Sudán',
  'Sudán del Sur',
  'Suecia',
  'Suiza',
  'Surinam',
  'Tailandia',
  'Tanzania',
  'Tayikistán',
  'Timor Oriental',
  'Togo',
  'Tonga',
  'Trinidad y Tobago',
  'Túnez',
  'Turkmenistán',
  'Turquía',
  'Tuvalu',
  'Ucrania',
  'Uganda',
  'Uruguay',
  'Uzbekistán',
  'Vanuatu',
  'Vaticano',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Yibuti',
  'Zambia',
  'Zimbabue',
] as const;

export const CONFIGURED_CATEGORIES = [
  'monturas',
  'cascos',
  'rodilleras',
  'botas',
] as const;
export const TEMPLATE_IDS = {
  monturas: 'cfg-montura',
  cascos: 'cfg-casco',
  rodilleras: 'cfg-rodillera',
  botas: 'cfg-bota',
} as const;

export type ConfiguredKind = 'montura' | 'casco' | 'rodillera' | 'bota';
export type ConfigLang = 'es' | 'en';

export const KIND_BY_CATEGORY: Record<
  (typeof CONFIGURED_CATEGORIES)[number],
  ConfiguredKind
> = {
  monturas: 'montura',
  cascos: 'casco',
  rodilleras: 'rodillera',
  botas: 'bota',
};

export const CATEGORY_BY_KIND: Record<ConfiguredKind, string> = {
  montura: 'monturas',
  casco: 'cascos',
  rodillera: 'rodilleras',
  bota: 'botas',
};

export const KIND_TITLES: Record<ConfiguredKind, string> = {
  montura: 'Monturas',
  casco: 'Cascos',
  rodillera: 'Rodilleras',
  bota: 'Botas',
};

export function isConfiguredCategory(id: string) {
  return (CONFIGURED_CATEGORIES as readonly string[]).includes(id);
}

export type ColorSwatch = {
  id: string;
  name: string;
  nameEn?: string;
  hex: string;
};

/** Colores de iniciales / hilo: misma paleta del logo Iconic de cascos. */
export const INITIAL_COLORS: ColorSwatch[] = CASCO_PALETA_LOGO_HILO.map(
  (color) => ({
    id: `hilo-${color.position}`,
    name: color.nombre,
    nameEn: color.nombreEn,
    hex: color.hex,
  }),
);

export const DEFAULT_INITIAL_COLOR_ID =
  INITIAL_COLORS.find((color) => color.name === 'Negro')?.id ||
  INITIAL_COLORS[0]?.id ||
  'hilo-3';

/** Paleta anterior, solo para cascos legacy (casquete, vicera, etc.). */
export const LEGACY_BODY_COLORS: ColorSwatch[] = [
  { id: 'blanco', name: 'Blanco', nameEn: 'White', hex: '#ffffff' },
  { id: 'plata', name: 'Plata', nameEn: 'Silver', hex: '#b8b8b8' },
  { id: 'grafito', name: 'Grafito', nameEn: 'Graphite', hex: '#5a5a5a' },
  { id: 'negro', name: 'Negro', nameEn: 'Black', hex: '#111111' },
  { id: 'azul-marino', name: 'Azul marino', nameEn: 'Navy blue', hex: '#0b1d3a' },
  { id: 'azul-oscuro', name: 'Azul oscuro', nameEn: 'Dark blue', hex: '#12326b' },
  { id: 'azul', name: 'Azul', nameEn: 'Blue', hex: '#2f6bdb' },
  {
    id: 'azul-petroleo',
    name: 'Azul petróleo',
    nameEn: 'Petrol blue',
    hex: '#1d5f8a',
  },
  {
    id: 'celeste-gris',
    name: 'Celeste gris',
    nameEn: 'Grey sky blue',
    hex: '#c5d5e8',
  },
  { id: 'celeste', name: 'Celeste', nameEn: 'Sky blue', hex: '#8ed0ef' },
  { id: 'cian', name: 'Cian', nameEn: 'Cyan', hex: '#12b0d0' },
  { id: 'violeta', name: 'Violeta', nameEn: 'Violet', hex: '#7b68a6' },
  { id: 'uva', name: 'Uva', nameEn: 'Grape', hex: '#6b3d7a' },
  { id: 'lavanda', name: 'Lavanda', nameEn: 'Lavender', hex: '#c8b8e0' },
  { id: 'rosa-palo', name: 'Rosa palo', nameEn: 'Dusty rose', hex: '#f5d0d0' },
  { id: 'rosa', name: 'Rosa', nameEn: 'Pink', hex: '#e8a0b0' },
  { id: 'fucsia', name: 'Fucsia', nameEn: 'Fuchsia', hex: '#e04080' },
  { id: 'bordo', name: 'Bordo', nameEn: 'Burgundy', hex: '#5c1a1a' },
  {
    id: 'rojo-oscuro',
    name: 'Rojo oscuro',
    nameEn: 'Dark red',
    hex: '#9b1c1c',
  },
  { id: 'rojo', name: 'Rojo', nameEn: 'Red', hex: '#c62828' },
  {
    id: 'naranja-intenso',
    name: 'Naranja intenso',
    nameEn: 'Bright orange',
    hex: '#ff4500',
  },
  { id: 'naranja', name: 'Naranja', nameEn: 'Orange', hex: '#ff7a1a' },
  { id: 'durazno', name: 'Durazno', nameEn: 'Peach', hex: '#ffb347' },
  { id: 'amarillo', name: 'Amarillo', nameEn: 'Yellow', hex: '#ffdd00' },
  { id: 'lima', name: 'Lima', nameEn: 'Lime', hex: '#d4ff00' },
  {
    id: 'verde-manzana',
    name: 'Verde manzana',
    nameEn: 'Apple green',
    hex: '#8fbf40',
  },
  { id: 'verde', name: 'Verde', nameEn: 'Green', hex: '#3d9b3d' },
  {
    id: 'verde-bosque',
    name: 'Verde bosque',
    nameEn: 'Forest green',
    hex: '#1f5a28',
  },
  {
    id: 'verde-botella',
    name: 'Verde botella',
    nameEn: 'Bottle green',
    hex: '#14351c',
  },
  { id: 'oliva', name: 'Oliva', nameEn: 'Olive', hex: '#5a6230' },
  { id: 'hueso', name: 'Hueso', nameEn: 'Bone', hex: '#f4efe4' },
  { id: 'beige', name: 'Beige', nameEn: 'Beige', hex: '#e2c8b0' },
  { id: 'tan', name: 'Tan', nameEn: 'Tan', hex: '#c4a06a' },
  { id: 'suela', name: 'Suela', nameEn: 'Sole brown', hex: '#8b5a2b' },
  { id: 'marron', name: 'Marrón', nameEn: 'Brown', hex: '#5c3317' },
  { id: 'crema', name: 'Crema', nameEn: 'Cream', hex: '#fff3c4' },
  { id: 'dorado', name: 'Dorado', nameEn: 'Gold', hex: '#d4a017' },
];

export function colorSwatch(id: string) {
  return (
    INITIAL_COLORS.find((color) => color.id === id) ||
    LEGACY_BODY_COLORS.find((color) => color.id === id)
  );
}

export const FONTS = [
  { id: 'trajan', label: 'Trajan' },
  { id: 'didot', label: 'Didot' },
  { id: 'bodoni', label: 'Bodoni' },
  { id: 'optima', label: 'Optima' },
  { id: 'garamond', label: 'Garamond' },
  { id: 'helvetica', label: 'Helvetica' },
  { id: 'futura', label: 'Futura' },
  { id: 'copperplate', label: 'Copperplate' },
  { id: 'palatino', label: 'Palatino' },
  { id: 'baskerville', label: 'Baskerville' },
] as const;

export const FONT_STACKS: Record<string, string> = {
  trajan: '"Trajan Pro", "Trajan Pro 3", Cinzel, "Times New Roman", serif',
  didot: 'Didot, "Didot LT STD", "Hoefler Text", "Playfair Display", serif',
  bodoni: '"Bodoni 72", "Bodoni 72 Book", "Bodoni MT", "Bodoni Moda", Didot, serif',
  optima: 'Optima, "Optima Regular", Candara, "Segoe UI", sans-serif',
  garamond: 'Garamond, "Apple Garamond", "EB Garamond", "Palatino Linotype", serif',
  helvetica: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  futura: 'Futura, "Futura Medium", "Avenir Next", "Century Gothic", sans-serif',
  copperplate:
    'Copperplate, "Copperplate Gothic Light", "Copperplate Gothic Bold", fantasy',
  palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
  baskerville:
    'Baskerville, "Baskerville Old Face", "Libre Baskerville", "Times New Roman", serif',
};

export function fontStack(id: string) {
  return FONT_STACKS[id] || 'serif';
}

export const HELMET_SIZES = [
  { id: '52', label: '52 cm · 20 1/2 in · Size 6 3/8' },
  { id: '53', label: '53 cm · 20 7/8 in · Size 6 1/2' },
  { id: '54', label: '54 cm · 21 1/4 in · Size 6 5/8' },
  { id: '55', label: '55 cm · 21 5/8 in · Size 6 3/4' },
  { id: '56', label: '56 cm · 22 in · Size 6 7/8' },
  { id: '57', label: '57 cm · 22 1/2 in · Size 7' },
  { id: '58', label: '58 cm · 22 7/8 in · Size 7 1/8' },
  { id: '59', label: '59 cm · 23 1/8 in · Size 7 1/4' },
  { id: '60', label: '60 cm · 23 5/8 in · Size 7 3/8' },
  { id: '61', label: '61 cm · 24 in · Size 7 1/2' },
  { id: '62', label: '62 cm · 24 1/2 in · Size 7 5/8' },
  { id: '63', label: '63 cm · 24 3/4 in · Size 7 3/4' },
] as const;

export const HELMET_MATERIALS = [
  { id: 'tela', label: 'Tela' },
  { id: 'cuero', label: 'Cuero' },
  { id: 'softshell', label: 'Softshell' },
  { id: 'prints', label: 'Prints' },
] as const;

export const MONTURA_MATERIALS = [
  { id: 'descarne', label: 'Descarne gamusado' },
  { id: 'cuero_forrado', label: 'Cuero forrado' },
  { id: 'suela', label: 'Suela' },
] as const;
export type MonturaMaterial = (typeof MONTURA_MATERIALS)[number]['id'];

export function aliasMonturaMaterial(value: unknown) {
  return value === 'gamuza' ? 'descarne' : value;
}

export function rewriteMonturaGamuzaText(value: string) {
  if (!value.includes('gamuza')) return value;
  return value
    .replaceAll('"material":"gamuza"', '"material":"descarne"')
    .replaceAll('"materialAsiento":"gamuza"', '"materialAsiento":"descarne"')
    .replaceAll('"material_gamuza"', '"material_descarne"')
    .replaceAll('"asiento_gamuza"', '"asiento_descarne"');
}

function monturaMaterialLabel(id: string, lang: ConfigLang = 'es') {
  if (lang === 'en') {
    const en: Record<string, string> = {
      descarne: 'Sueded reverse leather',
      cuero_forrado: 'Lined leather',
      suela: 'Sole leather',
    };
    return en[id] || id;
  }
  return (
    MONTURA_MATERIALS.find((material) => material.id === id)?.label || id
  );
}

export const RODILLERA_TIPOS = [
  { id: 'velcro', label: 'Velcro' },
  { id: 'doble_velcro', label: 'Doble velcro' },
  { id: 'hebilla', label: 'Hebilla' },
] as const;

export const RODILLERA_MODELOS = [
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
] as const;

export const RODILLERA_COLORS = [
  { id: 'negro', label: 'Negro' },
  { id: 'tabaco', label: 'Tabaco' },
  { id: 'chocolate', label: 'Chocolate' },
] as const;

export const LEATHER_HEX: Record<string, string> = {
  negro: '#1c1612',
  tabaco: '#8b5a2b',
  chocolate: '#4a2a18',
  marron: '#5c3317',
};

export const LEATHER_PHOTOS: Record<string, string> = {
  negro: '/leather-negro.png',
  tabaco: '/leather-tabaco.png',
  chocolate: '/leather-chocolate.png',
  marron: '/leather-tabaco.png',
};

export const RODILLERA_SIZES = [
  { id: 'chica', label: 'Chica' },
  { id: 'mediano', label: 'Mediano' },
  { id: 'grande', label: 'Grande' },
] as const;

export const RODILLERA_PLACES = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
  { id: 'centro', label: 'Centro' },
] as const;

export const BOTA_MODELOS = [
  { id: 'standard_doble_cuero', label: 'Standard doble cuero' },
  { id: 'standard_triple_cuero', label: 'Standard triple cuero' },
  {
    id: 'polo_argentino_doble_cuero',
    label: 'Polo argentino doble cuero premium',
  },
  {
    id: 'polo_argentino_triple_cuero',
    label: 'Polo argentino triple cuero premium',
  },
  { id: 'texanas', label: 'Texanas' },
] as const;

export const BOTA_BASE_MODELO = BOTA_MODELOS[0].id;

export function botaModeloPriceId(
  modelo: (typeof BOTA_MODELOS)[number]['id'],
) {
  return `modelo_${modelo}`;
}

export const BOTA_MATERIALS = [
  { id: 'cuero_vaca', label: 'Cuero vaca' },
  { id: 'cuero_bufalo', label: 'Cuero búfalo' },
] as const;

export const BOTA_COLORS = RODILLERA_COLORS;

export const BOTA_ACABADOS = [
  { id: 'brillante', label: 'Brillante' },
  { id: 'matte', label: 'Matte' },
] as const;

export const BOTA_PLACES = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
] as const;

export const BOTA_MEASURES = [
  { id: 'altoCana', n: 1, label: 'Alto de caña' },
  { id: 'largoPie', n: 2, label: 'Largo de pie' },
  { id: 'contornoSuperior', n: 3, label: 'Contorno superior' },
  { id: 'contornoMedio', n: 4, label: 'Contorno medio' },
  { id: 'contornoTobillo', n: 5, label: 'Contorno de tobillo' },
  { id: 'contornoTalon', n: 6, label: 'Contorno de talón' },
  { id: 'contornoEmpeine', n: 7, label: 'Contorno de empeine' },
] as const;

export type BotaMeasureId = (typeof BOTA_MEASURES)[number]['id'];

export type PricePoint = { price: number; cost: number };
export type ExtraCharge = PricePoint & { pending: boolean };
export type ConfiguredPricing = {
  extras: Record<string, PricePoint>;
  photos: Record<string, string>;
};

export type PricedOption = { id: string; label: string };
export type PricedGroup = { id: string; label: string; options: PricedOption[] };

export const emptyPricing = (): ConfiguredPricing => ({
  extras: {},
  photos: {},
});

export const REFERENCE_PHOTO_GROUPS: Record<ConfiguredKind, PricedGroup[]> = {
  montura: [
    {
      id: 'tipo',
      label: 'Tipo',
      options: [
        { id: 'tipo_americana', label: 'Americana' },
        { id: 'tipo_bauti', label: 'Bauti' },
      ],
    },
  ],
  casco: [
    {
      id: 'modelo',
      label: 'Opción base',
      options: [
        { id: 'modelo_h1', label: 'H1 homologado' },
        { id: 'modelo_standard', label: 'Standard sin homologar' },
      ],
    },
  ],
  rodillera: [
    {
      id: 'tipo',
      label: 'Tipo',
      options: RODILLERA_TIPOS.map((tipo) => ({
        id: `tipo_${tipo.id}`,
        label: tipo.label,
      })),
    },
    {
      id: 'modelo',
      label: 'Modelo',
      options: [
        { id: 'modelo_standard', label: 'Standard' },
        { id: 'modelo_premium', label: 'Premium' },
      ],
    },
  ],
  bota: [
    {
      id: 'modelo',
      label: 'Opción base',
      options: BOTA_MODELOS.map((modelo) => ({
        id: botaModeloPriceId(modelo.id),
        label: modelo.label,
      })),
    },
  ],
};

export function referencePhotoIds(kind: ConfiguredKind) {
  return new Set(
    REFERENCE_PHOTO_GROUPS[kind].flatMap((group) =>
      group.options.map((option) => option.id),
    ),
  );
}

export function selectedReferenceIds(
  kind: ConfiguredKind,
  raw: ProductConfig,
) {
  if (kind === 'montura') return [`tipo_${(raw as MonturaConfig).tipo}`];
  if (kind === 'casco') return [`modelo_${(raw as CascoConfig).modelo}`];
  if (kind === 'rodillera') {
    const config = raw as RodilleraConfig;
    return [`tipo_${config.tipo}`, `modelo_${config.modelo}`];
  }
  return [botaModeloPriceId((raw as BotaConfig).modelo)];
}

export const PRICED_GROUPS: Record<ConfiguredKind, PricedGroup[]> = {
  montura: [
    {
      id: 'tipo',
      label: 'Tipo',
      options: [
        { id: 'tipo_americana', label: 'Americana' },
        { id: 'tipo_bauti', label: 'Bauti' },
      ],
    },
    {
      id: 'material',
      label: 'Material',
      options: MONTURA_MATERIALS.map((material) => ({
        id: `material_${material.id}`,
        label: material.label,
      })),
    },
    {
      id: 'asiento',
      label: 'Material asiento',
      options: MONTURA_MATERIALS.map((material) => ({
        id: `asiento_${material.id}`,
        label: material.label,
      })),
    },
    {
      id: 'faldin',
      label: 'Faldín',
      options: [{ id: 'faldin', label: 'Con faldín' }],
    },
    {
      id: 'extras',
      label: 'Adicionales',
      options: [
        { id: 'portaEstribera', label: 'Porta estribera inglés' },
        { id: 'iniciales', label: 'Iniciales' },
      ],
    },
  ],
  casco: [
    {
      id: 'modelo',
      label: 'Modelo',
      options: [
        { id: 'modelo_h1', label: 'H1 homologado' },
        { id: 'modelo_standard', label: 'Standard sin homologar' },
      ],
    },
    {
      id: 'material',
      label: 'Material externo',
      options: HELMET_MATERIALS.map((material) => ({
        id: `material_${material.id}`,
        label: material.label,
      })),
    },
    {
      id: 'correaje',
      label: 'Correaje',
      options: [{ id: 'correaje', label: 'Con correaje' }],
    },
    {
      id: 'extras',
      label: 'Adicionales',
      options: [
        { id: 'iniciales', label: 'Iniciales' },
        { id: 'bandera', label: 'Bandera bordada' },
        { id: 'logoIcColor', label: 'Color personalizado logo IC' },
        { id: 'logoPersonalizado', label: 'Logo personalizado' },
      ],
    },
  ],
  rodillera: [
    {
      id: 'modelo',
      label: 'Modelo',
      options: [
        { id: 'modelo_standard', label: 'Standard' },
        { id: 'modelo_premium', label: 'Premium' },
      ],
    },
    {
      id: 'extras',
      label: 'Adicionales',
      options: [
        { id: 'iniciales', label: 'Iniciales' },
        { id: 'bordado', label: 'Bordado' },
      ],
    },
  ],
  bota: [
    {
      id: 'modelo',
      label: 'Modelo',
      options: BOTA_MODELOS.map((modelo) => ({
        id: botaModeloPriceId(modelo.id),
        label: modelo.label,
      })),
    },
    {
      id: 'material',
      label: 'Material',
      options: BOTA_MATERIALS.map((material) => ({
        id: `material_${material.id}`,
        label: material.label,
      })),
    },
    {
      id: 'extras',
      label: 'Adicionales',
      options: [
        { id: 'parche', label: 'Parche' },
        { id: 'pasadorRodillera', label: 'Pasador rodillera' },
        { id: 'topeEspuelas', label: 'Tope espuelas' },
        { id: 'engrasado', label: 'Engrasado' },
        { id: 'iniciales', label: 'Iniciales' },
      ],
    },
  ],
};

function moneyAmount(value: unknown, label: string) {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 1_000_000_000_000
  )
    throw new Error(`${label}: valor inválido.`);
  return value;
}

export function parsePricing(raw: unknown): ConfiguredPricing {
  const extras: Record<string, PricePoint> = {};
  const photos: Record<string, string> = {};
  const source =
    raw && typeof raw === 'object'
      ? ((raw as { extras?: unknown }).extras ?? raw)
      : null;
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    for (const [id, value] of Object.entries(source)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const point = value as Record<string, unknown>;
      extras[id] = {
        cost: moneyAmount(point.cost, `Costo de ${id}`),
        price: moneyAmount(point.price, `Precio de ${id}`),
      };
    }
    for (const [from, to] of [
      ['material_gamuza', 'material_descarne'],
      ['asiento_gamuza', 'asiento_descarne'],
    ] as const) {
      if (!(from in extras)) continue;
      if (!(to in extras)) extras[to] = extras[from];
      delete extras[from];
    }
  }
  const bag =
    raw && typeof raw === 'object'
      ? (raw as { photos?: unknown }).photos
      : null;
  if (bag && typeof bag === 'object' && !Array.isArray(bag)) {
    for (const [id, value] of Object.entries(bag)) {
      if (typeof value === 'string' && /^\/api\/images\/[a-z0-9-]+$/.test(value))
        photos[id] = value;
    }
  }
  return { extras, photos };
}

export function pricePoint(
  pricing: ConfiguredPricing,
  id: string,
): ExtraCharge {
  const extra = pricing.extras[id];
  return extra
    ? { ...extra, pending: false }
    : { cost: 0, price: 0, pending: true };
}

export function pricedLabel(kind: ConfiguredKind, id: string) {
  for (const group of PRICED_GROUPS[kind]) {
    const option = group.options.find((item) => item.id === id);
    if (option) return option.label;
  }
  return id;
}

export function selectedPriceKeys(
  kind: ConfiguredKind,
  raw: ProductConfig,
): string[] {
  if (kind === 'montura') {
    const config = raw as MonturaConfig;
    return [
      `tipo_${config.tipo}`,
      `material_${config.material}`,
      `asiento_${config.materialAsiento}`,
      ...(config.faldin ? ['faldin'] : []),
      ...(config.portaEstriberaIngles ? ['portaEstribera'] : []),
      ...(config.iniciales ? ['iniciales'] : []),
    ];
  }
  if (kind === 'rodillera') {
    const config = raw as RodilleraConfig;
    return [
      ...(config.modelo === 'premium' ? ['modelo_premium'] : []),
      ...(config.iniciales ? ['iniciales'] : []),
      ...(config.bordado ? ['bordado'] : []),
    ];
  }
  if (kind === 'bota') {
    const config = raw as BotaConfig;
    return [
      ...(config.modelo !== BOTA_BASE_MODELO
        ? [botaModeloPriceId(config.modelo)]
        : []),
      `material_${config.material}`,
      ...(config.parche ? ['parche'] : []),
      ...(config.pasadorRodillera ? ['pasadorRodillera'] : []),
      ...(config.topeEspuelas ? ['topeEspuelas'] : []),
      ...(config.engrasado ? ['engrasado'] : []),
      ...(config.iniciales ? ['iniciales'] : []),
    ];
  }
  const config = raw as CascoConfig;
  if (isNewCascoConfig(config)) {
    return [
      ...(config.modelo === 'h1' ? ['modelo_h1'] : []),
      CASCO_MATERIAL_PRICE_KEY[config.material],
      ...(config.colores.strap ? ['correaje'] : []),
      ...(config.iniciales ? ['iniciales'] : []),
      ...(config.bandera ? ['bandera'] : []),
      ...(config.logoPropio ? ['logoPersonalizado'] : []),
    ];
  }
  return [
    ...(config.modelo === 'h1' ? ['modelo_h1'] : []),
    `material_${config.materialExterno}`,
    ...(config.correaje ? ['correaje'] : []),
    ...(config.iniciales ? ['iniciales'] : []),
    ...(config.bandera ? ['bandera'] : []),
    ...(config.logoIcColorPersonalizado ? ['logoIcColor'] : []),
    ...(config.logoPersonalizado ? ['logoPersonalizado'] : []),
  ];
}

export function configuredProductOf<
  T extends { kind?: string; category: string; archived?: number },
>(products: T[], kind: ConfiguredKind) {
  const category = CATEGORY_BY_KIND[kind];
  return products.find(
    (product) =>
      product.kind === 'configured' &&
      product.category === category &&
      !product.archived,
  );
}

export type MonturaConfig = {
  tipo: 'americana' | 'bauti';
  material: MonturaMaterial;
  color: 'negro' | 'marron';
  tamano: '18' | '19' | '20';
  acabadoAsiento: 'perforado' | 'liso';
  materialAsiento: MonturaMaterial;
  faldin: boolean;
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
  inicialesUbicacion: 'atras' | 'faldon' | 'faldin';
  corte: 'tapita' | 'costura';
  portaEstriberaIngles: boolean;
};

export type CascoConfigLegacy = {
  modelo: 'h1' | 'standard';
  vicera: 'lock' | 'argentina';
  tamano: string;
  materialExterno: 'tela' | 'cuero' | 'softshell' | 'prints';
  colorCasco: string;
  colorViceraArriba: string;
  colorViceraAbajo: string;
  colorBandaVicera: string;
  colorTapones: string;
  correaje: boolean;
  correajeColor: string;
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
  inicialesUbicacion: 'derecha' | 'izquierda';
  inicialesTamano: '14' | '16' | '18';
  bandera: boolean;
  banderaUbicacion: 'derecha' | 'izquierda' | 'frente' | 'atras';
  banderaPais: string;
  logoIcUbicacion: 'derecha' | 'izquierda';
  logoIcColorPersonalizado: boolean;
  logoIcColor: string;
  logoPersonalizado: boolean;
  logoPersonalizadoPosicion: 'derecha' | 'izquierda' | 'frente' | 'atras';
  logoPersonalizadoTamano: 'chico' | 'mediano' | 'grande';
  logoPersonalizadoImagen: string;
  /** First reference photo; kept in sync with `disenoImagenes[0]` for legacy configs. */
  disenoImagen: string;
  disenoImagenes: string[];
};

export type CascoColores = {
  top?: ColorElegido;
  peak?: ColorElegido;
  peakBand?: ColorElegido;
  underPeak?: ColorElegido;
  strap?: ColorElegido;
  airholes: ColorElegido;
};

export type CascoSlotKind = 'iniciales' | 'bandera' | 'logoPropio';

export const CASCO_SLOT_FULL_MESSAGE =
  'Tenés que quitar una personalización para agregar esta';

export type CascoConfigV2 = {
  version: 2;
  modelo: 'h1' | 'standard';
  visera: CascoVisera;
  material: CascoMaterialTipo;
  estampado?: CascoEstampado;
  colores: CascoColores;
  logoIconic: ColorElegido;
  iniciales?: {
    posicion: CascoPosicion;
    texto: string;
    tamano: CascoTamano;
    colorHilo: ColorElegido;
    tipografia: string;
  };
  bandera?: {
    posicion: CascoPosicion;
    pais: string;
  };
  logoPropio?: {
    posicion: CascoPosicion;
    imagen: string;
    tamano: CascoTamano;
    colorHilo: ColorElegido;
  };
  talle: CascoTalle | '';
  disenoImagen: string;
  disenoImagenes: string[];
};

export type CascoConfig = CascoConfigLegacy | CascoConfigV2;

export function isNewCascoConfig(raw: unknown): raw is CascoConfigV2 {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const value = raw as Record<string, unknown>;
  if (value.version === 2) return true;
  return typeof value.visera === 'string' && !('vicera' in value);
}

export function cascoKindAtSlot(
  config: CascoConfigV2,
  slot: CascoPosicion,
): CascoSlotKind | null {
  if (config.iniciales?.posicion === slot) return 'iniciales';
  if (config.bandera?.posicion === slot) return 'bandera';
  if (config.logoPropio?.posicion === slot) return 'logoPropio';
  return null;
}

export function cascoFreeSlots(
  config: CascoConfigV2,
  kind?: CascoSlotKind,
): CascoPosicion[] {
  return CASCO_POSICIONES.map((item) => item.id).filter((slot) => {
    const occupant = cascoKindAtSlot(config, slot);
    return occupant == null || occupant === kind;
  });
}

export function cascoCanEnableKind(
  config: CascoConfigV2,
  kind: CascoSlotKind,
): boolean {
  return cascoFreeSlots(config, kind).length > 0;
}

export type RodilleraConfig = {
  tipo: 'velcro' | 'doble_velcro' | 'hebilla';
  modelo: 'standard' | 'premium';
  color: 'negro' | 'tabaco' | 'chocolate';
  protectorCentroColor: 'negro' | 'tabaco' | 'chocolate';
  tamano: 'chica' | 'mediano' | 'grande';
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
  inicialesUbicacion: 'izquierda' | 'derecha' | 'centro';
  inicialesTamano: 'chica' | 'mediano' | 'grande';
  bordado: boolean;
  bordadoImagen: string;
  bordadoTamano: 'chica' | 'mediano' | 'grande';
  bordadoUbicacion: 'izquierda' | 'derecha' | 'centro';
  bordadoColor: string;
};

export type BotaConfig = {
  modelo: (typeof BOTA_MODELOS)[number]['id'];
  material: 'cuero_vaca' | 'cuero_bufalo';
  color: 'negro' | 'tabaco' | 'chocolate';
  acabado: 'brillante' | 'matte';
  medidas: Record<BotaMeasureId, string>;
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
  inicialesUbicacion: 'izquierda' | 'derecha';
  parche: boolean;
  pasadorRodillera: boolean;
  topeEspuelas: boolean;
  engrasado: boolean;
};

export type ProductConfig =
  | MonturaConfig
  | CascoConfig
  | RodilleraConfig
  | BotaConfig;

export function defaultMontura(): MonturaConfig {
  return {
    tipo: 'americana',
    material: 'cuero_forrado',
    color: 'negro',
    tamano: '18',
    acabadoAsiento: 'liso',
    materialAsiento: 'cuero_forrado',
    faldin: true,
    iniciales: false,
    inicialesTexto: '',
    inicialesColor: DEFAULT_INITIAL_COLOR_ID,
    inicialesTipografia: 'trajan',
    inicialesUbicacion: 'atras',
    corte: 'tapita',
    portaEstriberaIngles: false,
  };
}

function defaultCascoFabric(material: Exclude<CascoMaterialTipo, 'prints'>) {
  const color = firstCascoColor(material);
  return {
    top: color,
    peak: color,
    peakBand: color,
    underPeak: color,
  };
}

export function defaultCasco(): CascoConfigV2 {
  return {
    version: 2,
    modelo: 'h1',
    visera: 'argentine',
    material: 'softshell',
    colores: {
      ...defaultCascoFabric('softshell'),
      strap: firstCascoColor(CASCO_PALETTE_IDS.barbijo),
      airholes: firstCascoColor(CASCO_PALETTE_IDS.ojales),
    },
    logoIconic: firstCascoColor(CASCO_PALETTE_IDS.logoHilo),
    talle: '',
    disenoImagen: '',
    disenoImagenes: [],
  };
}

export function changeCascoMaterial(
  config: CascoConfigV2,
  material: CascoMaterialTipo,
): CascoConfigV2 {
  if (material === 'prints') {
    return {
      ...config,
      material,
      estampado: config.estampado || 'topographic',
      colores: {
        strap: config.colores.strap,
        airholes: config.colores.airholes,
      },
    };
  }
  const fabric = defaultCascoFabric(material);
  return {
    ...config,
    material,
    estampado: undefined,
    colores: {
      ...fabric,
      peakBand: config.visera === 'argentine' ? fabric.peakBand : undefined,
      strap: config.colores.strap,
      airholes: config.colores.airholes,
    },
  };
}

export function changeCascoVisera(
  config: CascoConfigV2,
  visera: CascoVisera,
): CascoConfigV2 {
  if (visera === 'english') {
    const { peakBand: _peakBand, ...colores } = config.colores;
    return { ...config, visera, colores };
  }
  if (config.material === 'prints') return { ...config, visera };
  const peakBand =
    config.colores.peakBand?.palette === config.material
      ? config.colores.peakBand
      : firstCascoColor(config.material);
  return {
    ...config,
    visera,
    colores: { ...config.colores, peakBand },
  };
}

export function defaultRodillera(): RodilleraConfig {
  return {
    tipo: 'velcro',
    modelo: 'standard',
    color: 'negro',
    protectorCentroColor: 'negro',
    tamano: 'mediano',
    iniciales: false,
    inicialesTexto: '',
    inicialesColor: DEFAULT_INITIAL_COLOR_ID,
    inicialesTipografia: 'trajan',
    inicialesUbicacion: 'centro',
    inicialesTamano: 'mediano',
    bordado: false,
    bordadoImagen: '',
    bordadoTamano: 'mediano',
    bordadoUbicacion: 'centro',
    bordadoColor: DEFAULT_INITIAL_COLOR_ID,
  };
}

export function emptyBotaMeasures(): Record<BotaMeasureId, string> {
  return Object.fromEntries(
    BOTA_MEASURES.map((measure) => [measure.id, '']),
  ) as Record<BotaMeasureId, string>;
}

export function defaultBota(): BotaConfig {
  return {
    modelo: BOTA_BASE_MODELO,
    material: 'cuero_vaca',
    color: 'negro',
    acabado: 'brillante',
    medidas: emptyBotaMeasures(),
    iniciales: false,
    inicialesTexto: '',
    inicialesColor: DEFAULT_INITIAL_COLOR_ID,
    inicialesTipografia: 'trajan',
    inicialesUbicacion: 'izquierda',
    parche: false,
    pasadorRodillera: false,
    topeEspuelas: false,
    engrasado: false,
  };
}

export function defaultConfig(kind: ConfiguredKind): ProductConfig {
  if (kind === 'montura') return defaultMontura();
  if (kind === 'casco') return defaultCasco();
  if (kind === 'rodillera') return defaultRodillera();
  return defaultBota();
}

export function configuredKindOf(product: {
  kind?: string;
  category: string;
}): ConfiguredKind | null {
  if (product.kind !== 'configured') return null;
  return KIND_BY_CATEGORY[product.category as keyof typeof KIND_BY_CATEGORY] || null;
}

export function isConfiguredProduct(product: { kind?: string }) {
  return product.kind === 'configured';
}

function must(v: unknown, label: string) {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Elegí ${label}.`);
  return v.trim();
}

function oneOf<T extends string>(
  v: unknown,
  values: readonly T[],
  label: string,
) {
  const s = must(v, label);
  if (!values.includes(s as T)) throw new Error(`${label}: opción inválida.`);
  return s as T;
}

function text(v: unknown, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

function flag(v: unknown) {
  return v === true || v === 'si' || v === 'true' || v === 1;
}

function colorId(v: unknown, label: string) {
  const id = must(v, label);
  if (!colorSwatch(id)) throw new Error(`${label}: color inválido.`);
  return id;
}

export function parseMontura(raw: unknown): MonturaConfig {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const config: MonturaConfig = {
    tipo: oneOf(b.tipo, ['americana', 'bauti'], 'Tipo'),
    material: oneOf(
      aliasMonturaMaterial(b.material || 'cuero_forrado'),
      MONTURA_MATERIALS.map((material) => material.id),
      'Material',
    ),
    color: oneOf(b.color, ['negro', 'marron'], 'Color'),
    tamano: oneOf(b.tamano, ['18', '19', '20'], 'Tamaño'),
    acabadoAsiento: oneOf(
      b.acabadoAsiento,
      ['perforado', 'liso'],
      'Acabado asiento',
    ),
    materialAsiento: oneOf(
      aliasMonturaMaterial(b.materialAsiento),
      MONTURA_MATERIALS.map((material) => material.id),
      'Material asiento',
    ),
    faldin: flag(b.faldin),
    iniciales: flag(b.iniciales),
    inicialesTexto: text(b.inicialesTexto).trim(),
    inicialesColor: text(b.inicialesColor, DEFAULT_INITIAL_COLOR_ID),
    inicialesTipografia: text(b.inicialesTipografia, 'trajan'),
    inicialesUbicacion: oneOf(
      b.inicialesUbicacion || 'atras',
      ['atras', 'faldon', 'faldin'],
      'Ubicación de iniciales',
    ),
    corte: oneOf(b.corte, ['tapita', 'costura'], 'Corte'),
    portaEstriberaIngles: flag(b.portaEstriberaIngles),
  };
  if (config.iniciales) {
    if (!config.inicialesTexto) throw new Error('Escribí las iniciales.');
    if (config.inicialesTexto.length > 24)
      throw new Error('Iniciales: máximo 24 caracteres.');
    colorId(config.inicialesColor, 'Color de iniciales');
    oneOf(
      config.inicialesTipografia,
      FONTS.map((font) => font.id),
      'Tipografía',
    );
  }
  return config;
}

export function parseCasco(raw: unknown): CascoConfig {
  if (isNewCascoConfig(raw)) return parseCascoV2(raw);
  return parseCascoLegacy(raw);
}

function parseChosenColor(
  raw: unknown,
  palette: string,
  label: string,
): ColorElegido {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`Elegí ${label}.`);
  const value = raw as Record<string, unknown>;
  const storedPalette = typeof value.palette === 'string' ? value.palette : '';
  if (storedPalette && storedPalette !== palette)
    throw new Error(`${label}: color de otra paleta.`);
  const position = Number(value.position);
  const color = chosenCascoColor(palette, position);
  if (!color) throw new Error(`${label}: color inválido.`);
  return color;
}

function parseCascoPosicion(raw: unknown, label: string): CascoPosicion {
  return oneOf(
    raw,
    CASCO_POSICIONES.map((item) => item.id),
    `Posición de ${label}`,
  );
}

function parseCascoTalle(raw: unknown): CascoTalle {
  if (raw === '' || raw == null) throw new Error('Elegí el talle.');
  const value =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const cm = Number(value.cm);
  const talle = CASCO_TALLES.find((item) => item.cm === cm);
  if (!talle) throw new Error('Elegí el talle.');
  return {
    cm: talle.cm,
    pulgadas: talle.pulgadas,
    talleUS: talle.talleUS,
  };
}

function occupyCascoSlot(
  slots: Partial<Record<CascoPosicion, CascoSlotKind>>,
  kind: CascoSlotKind,
  posicion: CascoPosicion,
) {
  if (slots[posicion]) throw new Error(CASCO_SLOT_FULL_MESSAGE);
  slots[posicion] = kind;
}

function parseCascoV2(raw: unknown): CascoConfigV2 {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const disenoImagenes = parseCascoDesignPhotos(b);
  const visera = oneOf(
    b.visera,
    CASCO_VISERAS.map((item) => item.id),
    'Estilo',
  );
  const material = oneOf(
    b.material,
    ['cloth', 'leather', 'softshell', 'prints'] as const,
    'Material',
  );
  const coloresRaw =
    b.colores && typeof b.colores === 'object' && !Array.isArray(b.colores)
      ? (b.colores as Record<string, unknown>)
      : {};
  const colores: CascoColores = {
    airholes: parseChosenColor(
      coloresRaw.airholes,
      CASCO_PALETTE_IDS.ojales,
      'Tapones',
    ),
  };
  if (coloresRaw.strap)
    colores.strap = parseChosenColor(
      coloresRaw.strap,
      CASCO_PALETTE_IDS.barbijo,
      'Correaje',
    );
  let estampado: CascoEstampado | undefined;
  if (material === 'prints') {
    estampado = oneOf(
      b.estampado,
      CASCO_ESTAMPADOS.map((item) => item.id),
      'Estampado',
    );
  } else {
    colores.top = parseChosenColor(coloresRaw.top, material, 'Casquete');
    colores.peak = parseChosenColor(coloresRaw.peak, material, 'Visera');
    colores.underPeak = parseChosenColor(
      coloresRaw.underPeak,
      material,
      'Bajo visera',
    );
    if (visera === 'argentine') {
      colores.peakBand = parseChosenColor(
        coloresRaw.peakBand,
        material,
        'Banda de visera',
      );
    }
  }
  const config: CascoConfigV2 = {
    version: 2,
    modelo: oneOf(b.modelo, ['h1', 'standard'], 'Modelo'),
    visera,
    material,
    estampado,
    colores,
    logoIconic: parseChosenColor(
      b.logoIconic,
      CASCO_PALETTE_IDS.logoHilo,
      'Logo Iconic',
    ),
    talle: parseCascoTalle(b.talle),
    disenoImagen: disenoImagenes[0] || '',
    disenoImagenes,
  };
  const slots: Partial<Record<CascoPosicion, CascoSlotKind>> = {};
  if (b.iniciales) {
    const rawIniciales = b.iniciales as Record<string, unknown>;
    const posicion = parseCascoPosicion(rawIniciales.posicion, 'iniciales');
    const texto = text(rawIniciales.texto).trim();
    if (!texto) throw new Error('Escribí las iniciales.');
    if (texto.length > 24)
      throw new Error('Iniciales: máximo 24 caracteres.');
    occupyCascoSlot(slots, 'iniciales', posicion);
    config.iniciales = {
      posicion,
      texto,
      tamano: oneOf(
        rawIniciales.tamano,
        CASCO_TAMANOS_INICIALES[posicion].map((item) => item.id),
        'Tamaño de iniciales',
      ),
      colorHilo: parseChosenColor(
        rawIniciales.colorHilo,
        CASCO_PALETTE_IDS.logoHilo,
        'Color de hilo',
      ),
      tipografia: oneOf(
        rawIniciales.tipografia || 'trajan',
        FONTS.map((font) => font.id),
        'Tipografía',
      ),
    };
  }
  if (b.bandera) {
    const rawBandera = b.bandera as Record<string, unknown>;
    const pais = text(rawBandera.pais).trim();
    if (!(COUNTRIES as readonly string[]).includes(pais))
      throw new Error('Seleccioná el país de la bandera.');
    const posicion = parseCascoPosicion(rawBandera.posicion, 'bandera');
    occupyCascoSlot(slots, 'bandera', posicion);
    config.bandera = { posicion, pais };
  }
  if (b.logoPropio) {
    const rawLogo = b.logoPropio as Record<string, unknown>;
    const posicion = parseCascoPosicion(rawLogo.posicion, 'logo propio');
    const imagen = text(rawLogo.imagen).trim();
    requireImage(imagen, 'logo propio');
    occupyCascoSlot(slots, 'logoPropio', posicion);
    config.logoPropio = {
      posicion,
      imagen,
      tamano: oneOf(
        rawLogo.tamano,
        CASCO_TAMANOS_LOGO.map((item) => item.id),
        'Tamaño del logo propio',
      ),
      colorHilo: parseChosenColor(
        rawLogo.colorHilo,
        CASCO_PALETTE_IDS.logoHilo,
        'Color de hilo del logo propio',
      ),
    };
  }
  return config;
}

function parseCascoLegacy(raw: unknown): CascoConfigLegacy {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const disenoImagenes = parseCascoDesignPhotos(b);
  const config: CascoConfigLegacy = {
    modelo: oneOf(b.modelo, ['h1', 'standard'], 'Modelo'),
    vicera: oneOf(b.vicera, ['lock', 'argentina'], 'Tipo de vicera'),
    tamano: oneOf(
      b.tamano,
      HELMET_SIZES.map((size) => size.id),
      'Tamaño',
    ),
    materialExterno: oneOf(
      b.materialExterno,
      HELMET_MATERIALS.map((material) => material.id),
      'Material externo',
    ),
    colorCasco: colorId(b.colorCasco, 'Color del casco'),
    colorViceraArriba: colorId(b.colorViceraArriba, 'Color vicera arriba'),
    colorViceraAbajo: colorId(b.colorViceraAbajo, 'Color vicera abajo'),
    colorBandaVicera: text(b.colorBandaVicera, 'negro'),
    colorTapones: colorId(b.colorTapones, 'Color de tapones'),
    correaje: flag(b.correaje),
    correajeColor: text(b.correajeColor, 'negro'),
    iniciales: flag(b.iniciales),
    inicialesTexto: text(b.inicialesTexto).trim(),
    inicialesColor: text(b.inicialesColor, DEFAULT_INITIAL_COLOR_ID),
    inicialesTipografia: text(b.inicialesTipografia, 'trajan'),
    inicialesUbicacion: oneOf(
      b.inicialesUbicacion || 'derecha',
      ['derecha', 'izquierda'],
      'Ubicación de iniciales',
    ),
    inicialesTamano: oneOf(
      b.inicialesTamano || '16',
      ['14', '16', '18'],
      'Tamaño de iniciales',
    ),
    bandera: flag(b.bandera),
    banderaUbicacion: oneOf(
      b.banderaUbicacion || 'derecha',
      ['derecha', 'izquierda', 'frente', 'atras'],
      'Ubicación de bandera',
    ),
    banderaPais: text(b.banderaPais, 'Argentina'),
    logoIcUbicacion: oneOf(
      b.logoIcUbicacion || 'derecha',
      ['derecha', 'izquierda'],
      'Ubicación del logo IC',
    ),
    logoIcColorPersonalizado: flag(b.logoIcColorPersonalizado),
    logoIcColor: text(b.logoIcColor, 'negro'),
    logoPersonalizado: flag(b.logoPersonalizado),
    logoPersonalizadoPosicion: oneOf(
      b.logoPersonalizadoPosicion || 'izquierda',
      ['derecha', 'izquierda', 'frente', 'atras'],
      'Posición del logo personalizado',
    ),
    logoPersonalizadoTamano: oneOf(
      b.logoPersonalizadoTamano || 'mediano',
      ['chico', 'mediano', 'grande'],
      'Tamaño del logo personalizado',
    ),
    logoPersonalizadoImagen: text(b.logoPersonalizadoImagen).trim(),
    disenoImagen: disenoImagenes[0] || '',
    disenoImagenes,
  };
  if (config.vicera === 'argentina')
    colorId(config.colorBandaVicera, 'Color de banda vicera');
  if (config.correaje) colorId(config.correajeColor, 'Color de correaje');
  if (config.iniciales) {
    if (!config.inicialesTexto) throw new Error('Escribí las iniciales.');
    if (config.inicialesTexto.length > 24)
      throw new Error('Iniciales: máximo 24 caracteres.');
    colorId(config.inicialesColor, 'Color de iniciales');
    oneOf(
      config.inicialesTipografia,
      FONTS.map((font) => font.id),
      'Tipografía',
    );
  }
  if (config.bandera) {
    if (!(COUNTRIES as readonly string[]).includes(config.banderaPais))
      throw new Error('Seleccioná el país de la bandera.');
  }
  if (config.logoIcColorPersonalizado)
    colorId(config.logoIcColor, 'Color del logo IC');
  if (config.logoPersonalizado) {
    if (!config.logoPersonalizadoImagen)
      throw new Error('Subí la imagen del logo personalizado.');
    if (!/^\/api\/images\/[a-z0-9-]+$/.test(config.logoPersonalizadoImagen))
      throw new Error('Imagen de logo inválida.');
  }
  return config;
}

function requireInitials(config: {
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
}) {
  if (!config.iniciales) return;
  if (!config.inicialesTexto) throw new Error('Escribí las iniciales.');
  if (config.inicialesTexto.length > 24)
    throw new Error('Iniciales: máximo 24 caracteres.');
  colorId(config.inicialesColor, 'Color de iniciales');
  oneOf(
    config.inicialesTipografia,
    FONTS.map((font) => font.id),
    'Tipografía',
  );
}

function requireImage(value: string, label: string) {
  if (!value) throw new Error(`Subí la imagen de ${label}.`);
  if (!/^\/api\/images\/[a-z0-9-]+$/.test(value))
    throw new Error(`Imagen de ${label} inválida.`);
}

function optionalImage(value: unknown, label: string) {
  const s = text(value).trim();
  if (!s) return '';
  requireImage(s, label);
  return s;
}

export const CASCO_DISENO_MAX = 10;

function optionalImages(value: unknown, label: string, max: number): string[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  const urls: string[] = [];
  for (const item of list) {
    const url = optionalImage(item, label);
    if (url && !urls.includes(url)) urls.push(url);
  }
  if (urls.length > max) throw new Error(`${label}: máximo ${max} fotos.`);
  return urls;
}

function parseCascoDesignPhotos(b: Record<string, unknown>): string[] {
  const fromArray = Array.isArray(b.disenoImagenes)
    ? optionalImages(b.disenoImagenes, 'referencia del diseño', CASCO_DISENO_MAX)
    : [];
  if (fromArray.length) return fromArray;
  return optionalImages(b.disenoImagen, 'referencia del diseño', CASCO_DISENO_MAX);
}

export function configDesignPhotos(kind: ConfiguredKind, raw: ProductConfig) {
  if (kind !== 'casco') return [];
  const config = raw as CascoConfig;
  if (Array.isArray(config.disenoImagenes) && config.disenoImagenes.length)
    return config.disenoImagenes.filter(Boolean);
  return config.disenoImagen ? [config.disenoImagen] : [];
}

export function configDesignPhoto(kind: ConfiguredKind, raw: ProductConfig) {
  return configDesignPhotos(kind, raw)[0];
}

function measureValue(value: unknown, label: string) {
  const raw =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : text(value).trim().replace(',', '.');
  if (!raw) throw new Error(`${label}: ingresá un número.`);
  if (!/^\d+(\.\d{1,2})?$/.test(raw))
    throw new Error(`${label}: solo números.`);
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 200)
    throw new Error(`${label}: número inválido.`);
  return raw;
}

function requireBotaMeasures(raw: unknown): Record<BotaMeasureId, string> {
  const src =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const measures = {} as Record<BotaMeasureId, string>;
  for (const measure of BOTA_MEASURES) {
    measures[measure.id] = measureValue(
      src[measure.id],
      `${measure.n}. ${measure.label}`,
    );
  }
  return measures;
}

export function parseRodillera(raw: unknown): RodilleraConfig {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const config: RodilleraConfig = {
    tipo: oneOf(
      b.tipo,
      RODILLERA_TIPOS.map((tipo) => tipo.id),
      'Tipo',
    ),
    modelo: oneOf(
      b.modelo,
      RODILLERA_MODELOS.map((modelo) => modelo.id),
      'Modelo',
    ),
    color: oneOf(
      b.color,
      RODILLERA_COLORS.map((color) => color.id),
      'Color',
    ),
    protectorCentroColor: oneOf(
      b.protectorCentroColor,
      RODILLERA_COLORS.map((color) => color.id),
      'Color protector centro',
    ),
    tamano: oneOf(
      b.tamano,
      RODILLERA_SIZES.map((size) => size.id),
      'Tamaño',
    ),
    iniciales: flag(b.iniciales),
    inicialesTexto: text(b.inicialesTexto).trim(),
    inicialesColor: text(b.inicialesColor, DEFAULT_INITIAL_COLOR_ID),
    inicialesTipografia: text(b.inicialesTipografia, 'trajan'),
    inicialesUbicacion: oneOf(
      b.inicialesUbicacion || 'centro',
      RODILLERA_PLACES.map((place) => place.id),
      'Ubicación de iniciales',
    ),
    inicialesTamano: oneOf(
      b.inicialesTamano || 'mediano',
      RODILLERA_SIZES.map((size) => size.id),
      'Tamaño de iniciales',
    ),
    bordado: flag(b.bordado),
    bordadoImagen: text(b.bordadoImagen).trim(),
    bordadoTamano: oneOf(
      b.bordadoTamano || 'mediano',
      RODILLERA_SIZES.map((size) => size.id),
      'Tamaño de bordado',
    ),
    bordadoUbicacion: oneOf(
      b.bordadoUbicacion || 'centro',
      RODILLERA_PLACES.map((place) => place.id),
      'Ubicación de bordado',
    ),
    bordadoColor: text(b.bordadoColor, DEFAULT_INITIAL_COLOR_ID),
  };
  requireInitials(config);
  if (config.bordado) {
    requireImage(config.bordadoImagen, 'bordado');
    colorId(config.bordadoColor, 'Color de hilo del bordado');
  }
  return config;
}

export function parseBota(raw: unknown): BotaConfig {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const config: BotaConfig = {
    modelo: oneOf(
      b.modelo,
      BOTA_MODELOS.map((modelo) => modelo.id),
      'Modelo',
    ),
    material: oneOf(
      b.material,
      BOTA_MATERIALS.map((material) => material.id),
      'Material',
    ),
    color: oneOf(
      b.color,
      BOTA_COLORS.map((color) => color.id),
      'Color',
    ),
    acabado: oneOf(
      b.acabado,
      BOTA_ACABADOS.map((acabado) => acabado.id),
      'Acabado',
    ),
    medidas: requireBotaMeasures(b.medidas),
    iniciales: flag(b.iniciales),
    inicialesTexto: text(b.inicialesTexto).trim(),
    inicialesColor: text(b.inicialesColor, DEFAULT_INITIAL_COLOR_ID),
    inicialesTipografia: text(b.inicialesTipografia, 'trajan'),
    inicialesUbicacion: oneOf(
      b.inicialesUbicacion || 'izquierda',
      BOTA_PLACES.map((place) => place.id),
      'Ubicación de iniciales',
    ),
    parche: flag(b.parche),
    pasadorRodillera: flag(b.pasadorRodillera),
    topeEspuelas: flag(b.topeEspuelas),
    engrasado: flag(b.engrasado),
  };
  requireInitials(config);
  return config;
}

export function parseConfig(kind: ConfiguredKind, raw: unknown): ProductConfig {
  if (kind === 'montura') return parseMontura(raw);
  if (kind === 'casco') return parseCasco(raw);
  if (kind === 'rodillera') return parseRodillera(raw);
  return parseBota(raw);
}

export function stockKey(kind: ConfiguredKind, raw: ProductConfig) {
  if (kind === 'montura') {
    const c = raw as MonturaConfig;
    return JSON.stringify({
      tipo: c.tipo,
      material: aliasMonturaMaterial(c.material) as MonturaMaterial,
      color: c.color,
      tamano: c.tamano,
      acabadoAsiento: c.acabadoAsiento,
      materialAsiento: aliasMonturaMaterial(
        c.materialAsiento,
      ) as MonturaMaterial,
      faldin: c.faldin,
      corte: c.corte,
      portaEstriberaIngles: c.portaEstriberaIngles,
    });
  }
  if (kind === 'rodillera') {
    const c = raw as RodilleraConfig;
    return JSON.stringify({
      tipo: c.tipo,
      modelo: c.modelo,
      color: c.color,
      protectorCentroColor: c.protectorCentroColor,
      tamano: c.tamano,
    });
  }
  if (kind === 'bota') {
    const c = raw as BotaConfig;
    return JSON.stringify({
      modelo: c.modelo,
      material: c.material,
      color: c.color,
      acabado: c.acabado,
      medidas: c.medidas,
      parche: c.parche,
      pasadorRodillera: c.pasadorRodillera,
      topeEspuelas: c.topeEspuelas,
      engrasado: c.engrasado,
    });
  }
  const c = raw as CascoConfig;
  if (isNewCascoConfig(c)) {
    const colorRef = (color?: ColorElegido) =>
      color ? `${color.palette}:${color.position}` : '';
    return JSON.stringify({
      version: 2,
      modelo: c.modelo,
      visera: c.visera,
      material: c.material,
      talle: c.talle && typeof c.talle === 'object' ? c.talle.cm : '',
      estampado: c.material === 'prints' ? c.estampado || '' : '',
      top: colorRef(c.colores.top),
      peak: colorRef(c.colores.peak),
      peakBand:
        c.visera === 'argentine' && c.material !== 'prints'
          ? colorRef(c.colores.peakBand)
          : '',
      underPeak: colorRef(c.colores.underPeak),
      strap: colorRef(c.colores.strap),
      airholes: colorRef(c.colores.airholes),
    });
  }
  return JSON.stringify({
    modelo: c.modelo,
    vicera: c.vicera,
    tamano: c.tamano,
    materialExterno: c.materialExterno,
    colorCasco: c.colorCasco,
    colorViceraArriba: c.colorViceraArriba,
    colorViceraAbajo: c.colorViceraAbajo,
    colorBandaVicera: c.vicera === 'argentina' ? c.colorBandaVicera : '',
    colorTapones: c.colorTapones,
    correaje: c.correaje,
    correajeColor: c.correaje ? c.correajeColor : '',
  });
}

function colorName(id: string, lang: ConfigLang = 'es') {
  const swatch = colorSwatch(id);
  if (!swatch) return id;
  if (lang === 'en') return swatch.nameEn || swatch.name;
  return swatch.name;
}

function fontName(id: string) {
  return FONTS.find((font) => font.id === id)?.label || id;
}

export function configLabels(
  kind: ConfiguredKind,
  raw: ProductConfig,
  lang: ConfigLang = 'es',
) {
  const yes = lang === 'en' ? 'Yes' : 'Sí';
  const no = lang === 'en' ? 'No' : 'No';
  const withWord = lang === 'en' ? 'With' : 'Con';
  const without = lang === 'en' ? 'Without' : 'Sin';
  const labels: Record<string, string> = {};
  const key = (es: string, en: string) => (lang === 'en' ? en : es);
  if (kind === 'montura') {
    const c = raw as MonturaConfig;
    labels[key('Tipo', 'Type')] =
      c.tipo === 'americana' ? 'Americana' : 'Bauti';
    labels[key('Material', 'Material')] = monturaMaterialLabel(c.material, lang);
    labels[key('Color', 'Color')] =
      c.color === 'negro'
        ? lang === 'en'
          ? 'Black'
          : 'Negro'
        : lang === 'en'
          ? 'Brown'
          : 'Marrón';
    labels[key('Tamaño', 'Size')] = c.tamano;
    labels[key('Acabado asiento', 'Seat finish')] =
      c.acabadoAsiento === 'perforado'
        ? lang === 'en'
          ? 'Perforated'
          : 'Perforado'
        : lang === 'en'
          ? 'Smooth'
          : 'Liso';
    labels[key('Material asiento', 'Seat material')] = monturaMaterialLabel(
      c.materialAsiento,
      lang,
    );
    labels[key('Faldín', 'Skirt')] = c.faldin ? withWord : without;
    labels[key('Corte', 'Cut')] =
      c.corte === 'tapita'
        ? lang === 'en'
          ? 'Flap'
          : 'Tapita'
        : lang === 'en'
          ? 'Stitch'
          : 'Costura';
    labels[key('Porta estribera inglés', 'English stirrup holder')] =
      c.portaEstriberaIngles ? yes : no;
    if (c.iniciales) {
      labels[key('Iniciales', 'Initials')] = c.inicialesTexto;
      labels[key('Color iniciales', 'Initials color')] = colorName(
        c.inicialesColor,
        lang,
      );
      labels[key('Tipografía', 'Typography')] = fontName(c.inicialesTipografia);
      labels[key('Ubicación iniciales', 'Initials placement')] = {
        atras: lang === 'en' ? 'Back' : 'Atrás',
        faldon: lang === 'en' ? 'Flap' : 'Faldón',
        faldin: lang === 'en' ? 'Skirt' : 'Faldín',
      }[c.inicialesUbicacion];
    }
    return labels;
  }
  if (kind === 'rodillera') {
    const c = raw as RodilleraConfig;
    const tipoEn: Record<string, string> = {
      velcro: 'Velcro',
      doble_velcro: 'Double velcro',
      hebilla: 'Buckle',
    };
    const colorEn: Record<string, string> = {
      negro: 'Black',
      tabaco: 'Tobacco',
      chocolate: 'Chocolate',
    };
    const sizeEn: Record<string, string> = {
      chica: 'Small',
      mediano: 'Medium',
      grande: 'Large',
    };
    const placeEn: Record<string, string> = {
      izquierda: 'Left',
      derecha: 'Right',
      centro: 'Center',
    };
    labels[key('Tipo', 'Type')] =
      lang === 'en'
        ? tipoEn[c.tipo] || c.tipo
        : RODILLERA_TIPOS.find((tipo) => tipo.id === c.tipo)?.label || c.tipo;
    labels[key('Modelo', 'Model')] =
      RODILLERA_MODELOS.find((modelo) => modelo.id === c.modelo)?.label ||
      c.modelo;
    labels[key('Color', 'Color')] =
      lang === 'en'
        ? colorEn[c.color] || c.color
        : RODILLERA_COLORS.find((color) => color.id === c.color)?.label ||
          c.color;
    labels[key('Protector centro', 'Center protector')] =
      lang === 'en'
        ? colorEn[c.protectorCentroColor] || c.protectorCentroColor
        : RODILLERA_COLORS.find((color) => color.id === c.protectorCentroColor)
            ?.label || c.protectorCentroColor;
    labels[key('Tamaño', 'Size')] =
      lang === 'en'
        ? sizeEn[c.tamano] || c.tamano
        : RODILLERA_SIZES.find((size) => size.id === c.tamano)?.label ||
          c.tamano;
    if (c.iniciales) {
      const sizeLabel =
        lang === 'en'
          ? sizeEn[c.inicialesTamano] || c.inicialesTamano
          : RODILLERA_SIZES.find((size) => size.id === c.inicialesTamano)
              ?.label || c.inicialesTamano;
      labels[key('Iniciales', 'Initials')] = `${c.inicialesTexto} · ${sizeLabel}`;
      labels[key('Color iniciales', 'Initials color')] = colorName(
        c.inicialesColor,
        lang,
      );
      labels[key('Tipografía', 'Typography')] = fontName(c.inicialesTipografia);
      labels[key('Ubicación iniciales', 'Initials placement')] =
        lang === 'en'
          ? placeEn[c.inicialesUbicacion] || c.inicialesUbicacion
          : RODILLERA_PLACES.find((place) => place.id === c.inicialesUbicacion)
              ?.label || c.inicialesUbicacion;
    }
    if (c.bordado) {
      labels[key('Bordado', 'Embroidery')] =
        lang === 'en'
          ? sizeEn[c.bordadoTamano] || c.bordadoTamano
          : RODILLERA_SIZES.find((size) => size.id === c.bordadoTamano)?.label ||
            c.bordadoTamano;
      labels[key('Ubicación bordado', 'Embroidery placement')] =
        lang === 'en'
          ? placeEn[c.bordadoUbicacion] || c.bordadoUbicacion
          : RODILLERA_PLACES.find((place) => place.id === c.bordadoUbicacion)
              ?.label || c.bordadoUbicacion;
      labels[key('Color bordado', 'Embroidery color')] = colorName(
        c.bordadoColor,
        lang,
      );
    }
    return labels;
  }
  if (kind === 'bota') {
    const c = raw as BotaConfig;
    const modeloEn: Record<string, string> = {
      standard_doble_cuero: 'Standard double leather',
      standard_triple_cuero: 'Standard triple leather',
      polo_argentino_doble_cuero: 'Argentine polo double leather premium',
      polo_argentino_triple_cuero: 'Argentine polo triple leather premium',
      texanas: 'Western boots',
    };
    const materialEn: Record<string, string> = {
      cuero_vaca: 'Cow leather',
      cuero_bufalo: 'Buffalo leather',
    };
    const colorEn: Record<string, string> = {
      negro: 'Black',
      tabaco: 'Tobacco',
      chocolate: 'Chocolate',
    };
    const acabadoEn: Record<string, string> = {
      brillante: 'Glossy',
      matte: 'Matte',
    };
    const measureEn: Record<string, string> = {
      altoCana: 'Shaft height',
      largoPie: 'Foot length',
      contornoSuperior: 'Upper circumference',
      contornoMedio: 'Mid circumference',
      contornoTobillo: 'Ankle circumference',
      contornoTalon: 'Heel circumference',
      contornoEmpeine: 'Instep circumference',
    };
    const placeEn: Record<string, string> = {
      izquierda: 'Left',
      derecha: 'Right',
    };
    labels[key('Modelo', 'Model')] =
      lang === 'en'
        ? modeloEn[c.modelo] || c.modelo
        : BOTA_MODELOS.find((modelo) => modelo.id === c.modelo)?.label ||
          c.modelo;
    labels[key('Material', 'Material')] =
      lang === 'en'
        ? materialEn[c.material] || c.material
        : BOTA_MATERIALS.find((material) => material.id === c.material)?.label ||
          c.material;
    labels[key('Color', 'Color')] =
      lang === 'en'
        ? colorEn[c.color] || c.color
        : BOTA_COLORS.find((color) => color.id === c.color)?.label || c.color;
    labels[key('Acabado', 'Finish')] =
      lang === 'en'
        ? acabadoEn[c.acabado] || c.acabado
        : BOTA_ACABADOS.find((acabado) => acabado.id === c.acabado)?.label ||
          c.acabado;
    for (const measure of BOTA_MEASURES) {
      const measureKey =
        lang === 'en'
          ? `${measure.n}. ${measureEn[measure.id] || measure.label}`
          : `${measure.n}. ${measure.label}`;
      labels[measureKey] = c.medidas[measure.id] || '—';
    }
    labels[key('Parche', 'Patch')] = c.parche ? withWord : without;
    labels[key('Pasador rodillera', 'Knee pad strap')] = c.pasadorRodillera
      ? withWord
      : without;
    labels[key('Tope espuelas', 'Spur stop')] = c.topeEspuelas
      ? withWord
      : without;
    labels[key('Engrasado', 'Oiled')] = c.engrasado ? yes : no;
    if (c.iniciales) {
      labels[key('Iniciales', 'Initials')] = c.inicialesTexto;
      labels[key('Color iniciales', 'Initials color')] = colorName(
        c.inicialesColor,
        lang,
      );
      labels[key('Tipografía', 'Typography')] = fontName(c.inicialesTipografia);
      labels[key('Ubicación iniciales', 'Initials placement')] =
        lang === 'en'
          ? placeEn[c.inicialesUbicacion] || c.inicialesUbicacion
          : BOTA_PLACES.find((place) => place.id === c.inicialesUbicacion)
              ?.label || c.inicialesUbicacion;
    }
    return labels;
  }
  const c = raw as CascoConfig;
  if (isNewCascoConfig(c)) {
    labels[key('Modelo', 'Model')] =
      c.modelo === 'h1'
        ? lang === 'en'
          ? 'Certified H1'
          : 'H1 homologado'
        : lang === 'en'
          ? 'Standard uncertified'
          : 'Standard sin homologar';
    labels[key('Estilo', 'Style')] = viseraLabel(c.visera, lang);
    labels[key('Material', 'Material')] = materialLabel(c.material, lang);
    if (c.material === 'prints' && c.estampado)
      labels[key('Estampado', 'Print')] = estampadoLabel(c.estampado, lang);
    if (c.colores.top)
      labels[key('Casquete', 'Shell')] = cascoChosenColorName(
        c.colores.top,
        lang,
      );
    if (c.colores.peak)
      labels[key('Visera', 'Peak')] = cascoChosenColorName(
        c.colores.peak,
        lang,
      );
    if (c.visera === 'argentine' && c.colores.peakBand)
      labels[key('Banda de visera', 'Peak band')] = cascoChosenColorName(
        c.colores.peakBand,
        lang,
      );
    if (c.colores.underPeak)
      labels[key('Bajo visera', 'Under peak')] = cascoChosenColorName(
        c.colores.underPeak,
        lang,
      );
    labels[key('Correaje', 'Chin strap')] = c.colores.strap
      ? cascoChosenColorName(c.colores.strap, lang)
      : lang === 'en'
        ? 'No chin strap'
        : 'Sin correaje';
    labels[key('Tapones', 'Airholes')] = cascoChosenColorName(
      c.colores.airholes,
      lang,
    );
    labels[key('Logo Iconic', 'Iconic logo')] = cascoChosenColorName(
      c.logoIconic,
      lang,
    );
    labels[key('Ubicación logo Iconic', 'Iconic logo placement')] =
      lang === 'en' ? 'Right side' : 'Lado derecho';
    labels[key('Talle', 'Size')] =
      c.talle && typeof c.talle === 'object'
        ? talleLabel(c.talle)
        : lang === 'en'
          ? 'Not selected'
          : 'Sin elegir';
    if (c.iniciales) {
      labels[key('Iniciales', 'Initials')] =
        `${c.iniciales.texto} · ${inicialesMm(c.iniciales.posicion, c.iniciales.tamano)} mm`;
      labels[key('Ubicación iniciales', 'Initials placement')] = posicionLabel(
        c.iniciales.posicion,
        lang,
      );
      labels[key('Color de hilo', 'Thread color')] = cascoChosenColorName(
        c.iniciales.colorHilo,
        lang,
      );
      labels[key('Tipografía', 'Typography')] = fontName(c.iniciales.tipografia);
    }
    if (c.bandera) {
      labels[key('Bandera', 'Flag')] = c.bandera.pais;
      labels[key('Ubicación bandera', 'Flag placement')] = posicionLabel(
        c.bandera.posicion,
        lang,
      );
    }
    if (c.logoPropio) {
      labels[key('Logo propio', 'Custom logo')] =
        `${logoTamanoLabel(c.logoPropio.tamano, lang)} · ${posicionLabel(c.logoPropio.posicion, lang)}`;
      labels[key('Color logo propio', 'Custom logo color')] =
        cascoChosenColorName(c.logoPropio.colorHilo, lang);
    }
    const designCount = configDesignPhotos('casco', c).length;
    if (designCount === 1)
      labels[key('Diseño', 'Design')] =
        lang === 'en' ? 'Attached image' : 'Imagen adjunta';
    else if (designCount > 1)
      labels[key('Diseño', 'Design')] =
        lang === 'en'
          ? `${designCount} attached images`
          : `${designCount} imágenes adjuntas`;
    return labels;
  }
  labels[key('Modelo', 'Model')] =
    c.modelo === 'h1'
      ? lang === 'en'
        ? 'Certified H1'
        : 'H1 homologado'
      : lang === 'en'
        ? 'Standard uncertified'
        : 'Standard sin homologar';
  labels[key('Tipo de vicera', 'Peak type')] =
    c.vicera === 'lock'
      ? 'Lock / English'
      : lang === 'en'
        ? 'Argentine'
        : 'Argentina';
  labels[key('Tamaño', 'Size')] =
    HELMET_SIZES.find((size) => size.id === c.tamano)?.label || c.tamano;
  const helmetMaterialEn: Record<string, string> = {
    tela: 'Cloth',
    cuero: 'Leather',
    softshell: 'Softshell',
    prints: 'Print',
  };
  labels[key('Material externo', 'Outer material')] =
    lang === 'en'
      ? helmetMaterialEn[c.materialExterno] || c.materialExterno
      : HELMET_MATERIALS.find((material) => material.id === c.materialExterno)
          ?.label || c.materialExterno;
  labels[key('Color casco', 'Helmet color')] = colorName(c.colorCasco, lang);
  labels[key('Vicera arriba', 'Peak top')] = colorName(c.colorViceraArriba, lang);
  labels[key('Vicera abajo', 'Peak underside')] = colorName(
    c.colorViceraAbajo,
    lang,
  );
  if (c.vicera === 'argentina')
    labels[key('Banda vicera', 'Peak band')] = colorName(
      c.colorBandaVicera,
      lang,
    );
  labels[key('Tapones', 'Airholes')] = colorName(c.colorTapones, lang);
  labels[key('Correaje', 'Chin strap')] = c.correaje
    ? colorName(c.correajeColor, lang)
    : lang === 'en'
      ? 'No chin strap'
      : 'Sin correaje';
  labels[key('Logo IC', 'IC logo')] =
    c.logoIcUbicacion === 'derecha'
      ? lang === 'en'
        ? 'Right'
        : 'Derecha'
      : lang === 'en'
        ? 'Left'
        : 'Izquierda';
  if (c.logoIcColorPersonalizado)
    labels[key('Color logo IC', 'IC logo color')] = colorName(
      c.logoIcColor,
      lang,
    );
  if (c.iniciales) {
    labels[key('Iniciales', 'Initials')] =
      `${c.inicialesTexto} · ${c.inicialesTamano} mm`;
    labels[key('Color iniciales', 'Initials color')] = colorName(
      c.inicialesColor,
      lang,
    );
    labels[key('Tipografía', 'Typography')] = fontName(c.inicialesTipografia);
    labels[key('Ubicación iniciales', 'Initials placement')] =
      c.inicialesUbicacion === 'derecha'
        ? lang === 'en'
          ? 'Right'
          : 'Derecha'
        : lang === 'en'
          ? 'Left'
          : 'Izquierda';
  }
  if (c.bandera) {
    labels[key('Bandera', 'Flag')] = c.banderaPais;
    labels[key('Ubicación bandera', 'Flag placement')] = {
      derecha: lang === 'en' ? 'Right' : 'Derecha',
      izquierda: lang === 'en' ? 'Left' : 'Izquierda',
      frente: lang === 'en' ? 'Front' : 'Frente',
      atras: lang === 'en' ? 'Back' : 'Atrás',
    }[c.banderaUbicacion];
  }
  if (c.logoPersonalizado) {
    labels[key('Logo personalizado', 'Custom logo')] = c.logoPersonalizadoTamano;
    labels[key('Posición logo', 'Logo position')] = {
      derecha: lang === 'en' ? 'Right' : 'Derecha',
      izquierda: lang === 'en' ? 'Left' : 'Izquierda',
      frente: lang === 'en' ? 'Front' : 'Frente',
      atras: lang === 'en' ? 'Back' : 'Atrás',
    }[c.logoPersonalizadoPosicion];
  }
  const designCount = configDesignPhotos('casco', c).length;
  if (designCount === 1)
    labels[key('Diseño', 'Design')] =
      lang === 'en' ? 'Attached image' : 'Imagen adjunta';
  else if (designCount > 1)
    labels[key('Diseño', 'Design')] =
      lang === 'en'
        ? `${designCount} attached images`
        : `${designCount} imágenes adjuntas`;
  return labels;
}

export function extraCharges(
  kind: ConfiguredKind,
  raw: ProductConfig,
  pricing: ConfiguredPricing = emptyPricing(),
) {
  return selectedPriceKeys(kind, raw).map((id) => ({
    id,
    label: pricedLabel(kind, id),
    extra: pricePoint(pricing, id),
  }));
}

export function extraTotals(
  kind: ConfiguredKind,
  raw: ProductConfig,
  pricing: ConfiguredPricing = emptyPricing(),
) {
  return extraCharges(kind, raw, pricing).reduce(
    (sum, charge) => ({
      price: sum.price + charge.extra.price,
      cost: sum.cost + charge.extra.cost,
      pending: sum.pending || charge.extra.pending,
    }),
    { price: 0, cost: 0, pending: false },
  );
}

export function adjustedConfiguredPrices(
  kind: ConfiguredKind,
  previousRaw: unknown,
  next: ProductConfig,
  pricing: ConfiguredPricing,
  unitPrice: number,
  unitCost: number,
) {
  const nextExtras = extraTotals(kind, next, pricing);
  let previousExtras = { price: 0, cost: 0, pending: false };
  try {
    previousExtras = extraTotals(kind, parseConfig(kind, previousRaw), pricing);
  } catch {
    return { unit_price: unitPrice, unit_cost: unitCost };
  }
  return {
    unit_price: Math.max(0, unitPrice + nextExtras.price - previousExtras.price),
    unit_cost: Math.max(0, unitCost + nextExtras.cost - previousExtras.cost),
  };
}

export const STOCK_PLACES = [
  { id: 'ivan', label: 'Ivan' },
  { id: 'kriko', label: 'Kriko' },
] as const;
export type StockPlace = (typeof STOCK_PLACES)[number]['id'];

export function stockPlaceLabel(id: string) {
  return STOCK_PLACES.find((place) => place.id === id)?.label || 'Sin ubicación';
}

export function stockForConfig(
  movements: {
    product_id: string;
    config_key?: string;
    quantity: number;
    location?: string;
  }[],
  productId: string,
  key: string,
  location?: string,
) {
  return movements
    .filter(
      (movement) =>
        movement.product_id === productId &&
        (movement.config_key || '') === key &&
        (location === undefined || (movement.location || '') === location),
    )
    .reduce((sum, movement) => sum + movement.quantity, 0);
}

export function stockAtPlace(
  movements: { product_id: string; quantity: number; location?: string }[],
  productId: string,
  location: string,
) {
  return movements
    .filter(
      (movement) =>
        movement.product_id === productId &&
        (movement.location || '') === location,
    )
    .reduce((sum, movement) => sum + movement.quantity, 0);
}

export function stockByConfig(
  movements: {
    product_id: string;
    config_key?: string;
    quantity: number;
    location?: string;
    supplier_id?: string;
    config?: Record<string, unknown>;
  }[],
  productId: string,
) {
  const rows = new Map<
    string,
    {
      quantity: number;
      location: string;
      supplier_id: string;
      config: Record<string, unknown>;
      config_key: string;
    }
  >();
  for (const movement of movements) {
    if (movement.product_id !== productId) continue;
    const location = movement.location || '';
    const config_key = movement.config_key || '';
    const key = `${config_key}\t${location}`;
    const prev = rows.get(key);
    const config =
      movement.config && Object.keys(movement.config).length
        ? movement.config
        : prev?.config || {};
    const supplier_id =
      movement.quantity > 0 && movement.supplier_id
        ? movement.supplier_id
        : prev?.supplier_id || movement.supplier_id || '';
    rows.set(key, {
      quantity: (prev?.quantity || 0) + movement.quantity,
      location,
      supplier_id,
      config,
      config_key: config_key || prev?.config_key || '',
    });
  }
  return [...rows.entries()]
    .map(([key, row]) => ({ key, ...row }))
    .filter((row) => row.quantity !== 0)
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        a.location.localeCompare(b.location) ||
        a.key.localeCompare(b.key),
    );
}

export type StockReservation = {
  orderId: string;
  orderNumber: string;
  quantity: number;
};

export type StockHold = {
  orderId: string;
  orderNumber: string;
  productId: string;
  configKey: string;
  location: string;
  quantity: number;
};

export type StockAvailabilityRow = {
  key: string;
  config_key: string;
  quantity: number;
  reserved: number;
  available: number;
  location: string;
  supplier_id: string;
  config: Record<string, unknown>;
  reservations: StockReservation[];
};

export function itemStockHold(
  item: {
    product_id: string;
    quantity: number;
    selections: {
      from_stock?: boolean;
      config?: Record<string, unknown>;
      location?: string;
    };
  },
  kind: ConfiguredKind | null,
  order: { id: string; number: string },
): StockHold | null {
  if (!item.selections.from_stock || item.quantity <= 0) return null;
  let configKey = '';
  if (kind && item.selections.config) {
    try {
      configKey = stockKey(kind, parseConfig(kind, item.selections.config));
    } catch {
      return null;
    }
  } else if (item.selections.config) {
    const raw = item.selections.config as { riendas?: unknown };
    if (
      raw.riendas === 1 ||
      raw.riendas === 2 ||
      raw.riendas === '1' ||
      raw.riendas === '2'
    ) {
      try {
        configKey = cabezadaStockKey(
          parseCabezadaConfig(item.selections.config),
        );
      } catch {
        return null;
      }
    }
  }
  return {
    orderId: order.id,
    orderNumber: order.number,
    productId: item.product_id,
    configKey,
    location: item.selections.location || '',
    quantity: item.quantity,
  };
}

export function reservedHolds(
  orders: {
    id: string;
    number: string;
    archived: number;
    deleted?: number;
    status: string;
    items: {
      product_id: string;
      quantity: number;
      selections: {
        from_stock?: boolean;
        config?: Record<string, unknown>;
        location?: string;
      };
    }[];
  }[],
  products: { id: string; category: string; kind?: string }[],
  exceptOrderId?: string,
): StockHold[] {
  const kinds = new Map(
    products.map((product) => [product.id, configuredKindOf(product)]),
  );
  const holds: StockHold[] = [];
  for (const order of orders) {
    if (
      order.archived ||
      order.deleted ||
      order.status === 'entregado' ||
      order.status === 'cotización'
    )
      continue;
    if (exceptOrderId && order.id === exceptOrderId) continue;
    for (const item of order.items) {
      const hold = itemStockHold(
        item,
        kinds.get(item.product_id) ?? null,
        order,
      );
      if (hold) holds.push(hold);
    }
  }
  return holds;
}

export function stockAvailability(
  movements: Parameters<typeof stockByConfig>[0],
  holds: StockHold[],
  productId: string,
): StockAvailabilityRow[] {
  const rows: StockAvailabilityRow[] = stockByConfig(movements, productId)
    .filter((row) => row.quantity > 0)
    .map((row) => ({
      ...row,
      reserved: 0,
      available: row.quantity,
      reservations: [],
    }));
  for (const hold of holds) {
    if (hold.productId !== productId || hold.quantity <= 0) continue;
    let remaining = hold.quantity;
    const matches = rows
      .filter((row) => {
        if (row.config_key !== hold.configKey) return false;
        if (hold.location && row.location !== hold.location) return false;
        return true;
      })
      .sort((a, b) => b.available - a.available);
    const addReservation = (row: StockAvailabilityRow, quantity: number) => {
      row.reserved += quantity;
      row.available = Math.max(0, row.quantity - row.reserved);
      const existing = row.reservations.find(
        (reservation) => reservation.orderId === hold.orderId,
      );
      if (existing) existing.quantity += quantity;
      else
        row.reservations.push({
          orderId: hold.orderId,
          orderNumber: hold.orderNumber,
          quantity,
        });
    };
    for (const row of matches) {
      if (remaining <= 0) break;
      const take = Math.min(Math.max(row.available, 0), remaining);
      if (take <= 0) continue;
      addReservation(row, take);
      remaining -= take;
    }
    if (remaining > 0 && matches[0]) addReservation(matches[0], remaining);
  }
  return rows;
}

function lowerEs(value: string) {
  return value.toLocaleLowerCase('es');
}

function lowerEn(value: string) {
  return value.toLocaleLowerCase('en');
}

function summarizeMontura(raw: MonturaConfig, lang: ConfigLang = 'es') {
  const tipo = raw.tipo === 'americana' ? 'Americana' : 'Bauti';
  const material = monturaMaterialLabel(raw.material, lang);
  const color =
    raw.color === 'negro'
      ? lang === 'en'
        ? 'Black'
        : 'Negro'
      : lang === 'en'
        ? 'Brown'
        : 'Marrón';
  const asiento =
    raw.acabadoAsiento === 'perforado'
      ? lang === 'en'
        ? 'Perforated'
        : 'Perforado'
      : lang === 'en'
        ? 'Smooth'
        : 'Liso';
  const asientoMaterial = monturaMaterialLabel(raw.materialAsiento, lang);
  const corte =
    raw.corte === 'tapita'
      ? lang === 'en'
        ? 'Flap'
        : 'Tapita'
      : lang === 'en'
        ? 'Stitch'
        : 'Costura';
  const lower = lang === 'en' ? lowerEn : lowerEs;
  const lines =
    lang === 'en'
      ? [
          `Saddle ${tipo} ${lower(material)} ${lower(color)} ${raw.tamano}`,
          `Seat: ${lower(asiento)}, ${lower(asientoMaterial)}`,
          `Cut: ${lower(corte)}`,
        ]
      : [
          `Montura ${tipo} ${lower(material)} ${lower(color)} ${raw.tamano}`,
          `Asiento: ${lower(asiento)}, ${lower(asientoMaterial)}`,
          `Corte: ${lower(corte)}`,
        ];
  if (!raw.faldin)
    lines.push(lang === 'en' ? 'Without skirt' : 'Sin faldín');
  if (raw.portaEstriberaIngles)
    lines.push(
      lang === 'en' ? 'English stirrup holder' : 'Porta estribera inglés',
    );
  if (raw.iniciales && raw.inicialesTexto.trim()) {
    lines.push(
      `${lang === 'en' ? 'Initials' : 'Iniciales'}: ${raw.inicialesTexto.trim()}`,
    );
  }
  return lines.join('\n');
}

function summarizeRodillera(raw: RodilleraConfig, lang: ConfigLang = 'es') {
  const modelo =
    RODILLERA_MODELOS.find((item) => item.id === raw.modelo)?.label ||
    raw.modelo;
  const tipoEn: Record<string, string> = {
    velcro: 'Velcro',
    doble_velcro: 'Double velcro',
    hebilla: 'Buckle',
  };
  const colorEn: Record<string, string> = {
    negro: 'Black',
    tabaco: 'Tobacco',
    chocolate: 'Chocolate',
  };
  const sizeEn: Record<string, string> = {
    chica: 'Small',
    mediano: 'Medium',
    grande: 'Large',
  };
  const tipo =
    lang === 'en'
      ? tipoEn[raw.tipo] || raw.tipo
      : RODILLERA_TIPOS.find((item) => item.id === raw.tipo)?.label || raw.tipo;
  const color =
    lang === 'en'
      ? colorEn[raw.color] || raw.color
      : RODILLERA_COLORS.find((item) => item.id === raw.color)?.label ||
        raw.color;
  const tamano =
    lang === 'en'
      ? sizeEn[raw.tamano] || raw.tamano
      : RODILLERA_SIZES.find((item) => item.id === raw.tamano)?.label ||
        raw.tamano;
  const protector =
    lang === 'en'
      ? colorEn[raw.protectorCentroColor] || raw.protectorCentroColor
      : RODILLERA_COLORS.find((item) => item.id === raw.protectorCentroColor)
          ?.label || raw.protectorCentroColor;
  const lower = lang === 'en' ? lowerEn : lowerEs;
  const lines =
    lang === 'en'
      ? [
          `Knee pad ${lower(modelo)} ${lower(tipo)} ${lower(color)}.`,
          `Size: ${lower(tamano)}`,
        ]
      : [
          `Rodillera ${lower(modelo)} ${lower(tipo)} ${lower(color)}.`,
          `Tamaño: ${lower(tamano)}`,
        ];
  if (raw.protectorCentroColor !== raw.color) {
    lines.push(
      `${lang === 'en' ? 'Center protector' : 'Protector centro'}: ${lower(protector)}`,
    );
  }
  if (raw.iniciales && raw.inicialesTexto.trim()) {
    lines.push(
      `${lang === 'en' ? 'Initials' : 'Iniciales'}: ${raw.inicialesTexto.trim()}`,
    );
  }
  if (raw.bordado) lines.push(lang === 'en' ? 'Embroidery' : 'Bordado');
  return lines.join('\n');
}

export function summarizeConfig(
  kind: ConfiguredKind,
  raw: ProductConfig,
  lang: ConfigLang = 'es',
) {
  if (kind === 'montura') return summarizeMontura(raw as MonturaConfig, lang);
  if (kind === 'rodillera')
    return summarizeRodillera(raw as RodilleraConfig, lang);
  const labels = configLabels(kind, raw, lang);
  return Object.entries(labels)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

export function describeConfigured(
  product: { kind?: string; category: string },
  config: unknown,
  lang: ConfigLang = 'es',
) {
  const kind = configuredKindOf(product);
  if (!kind || !config || typeof config !== 'object') return '';
  try {
    return summarizeConfig(kind, parseConfig(kind, config), lang);
  } catch {
    return '';
  }
}
