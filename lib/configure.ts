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

export type ColorSwatch = { id: string; name: string; hex: string };

/** Colores de iniciales, tomados de la carta adjunta. */
export const INITIAL_COLORS: ColorSwatch[] = [
  { id: 'blanco', name: 'Blanco', hex: '#ffffff' },
  { id: 'plata', name: 'Plata', hex: '#b8b8b8' },
  { id: 'grafito', name: 'Grafito', hex: '#5a5a5a' },
  { id: 'negro', name: 'Negro', hex: '#111111' },
  { id: 'azul-marino', name: 'Azul marino', hex: '#0b1d3a' },
  { id: 'azul-oscuro', name: 'Azul oscuro', hex: '#12326b' },
  { id: 'azul', name: 'Azul', hex: '#2f6bdb' },
  { id: 'azul-petroleo', name: 'Azul petróleo', hex: '#1d5f8a' },
  { id: 'celeste-gris', name: 'Celeste gris', hex: '#c5d5e8' },
  { id: 'celeste', name: 'Celeste', hex: '#8ed0ef' },
  { id: 'cian', name: 'Cian', hex: '#12b0d0' },
  { id: 'violeta', name: 'Violeta', hex: '#7b68a6' },
  { id: 'uva', name: 'Uva', hex: '#6b3d7a' },
  { id: 'lavanda', name: 'Lavanda', hex: '#c8b8e0' },
  { id: 'rosa-palo', name: 'Rosa palo', hex: '#f5d0d0' },
  { id: 'rosa', name: 'Rosa', hex: '#e8a0b0' },
  { id: 'fucsia', name: 'Fucsia', hex: '#e04080' },
  { id: 'bordo', name: 'Bordo', hex: '#5c1a1a' },
  { id: 'rojo-oscuro', name: 'Rojo oscuro', hex: '#9b1c1c' },
  { id: 'rojo', name: 'Rojo', hex: '#c62828' },
  { id: 'naranja-intenso', name: 'Naranja intenso', hex: '#ff4500' },
  { id: 'naranja', name: 'Naranja', hex: '#ff7a1a' },
  { id: 'durazno', name: 'Durazno', hex: '#ffb347' },
  { id: 'amarillo', name: 'Amarillo', hex: '#ffdd00' },
  { id: 'lima', name: 'Lima', hex: '#d4ff00' },
  { id: 'verde-manzana', name: 'Verde manzana', hex: '#8fbf40' },
  { id: 'verde', name: 'Verde', hex: '#3d9b3d' },
  { id: 'verde-bosque', name: 'Verde bosque', hex: '#1f5a28' },
  { id: 'verde-botella', name: 'Verde botella', hex: '#14351c' },
  { id: 'oliva', name: 'Oliva', hex: '#5a6230' },
  { id: 'hueso', name: 'Hueso', hex: '#f4efe4' },
  { id: 'beige', name: 'Beige', hex: '#e2c8b0' },
  { id: 'tan', name: 'Tan', hex: '#c4a06a' },
  { id: 'suela', name: 'Suela', hex: '#8b5a2b' },
  { id: 'marron', name: 'Marrón', hex: '#5c3317' },
  { id: 'crema', name: 'Crema', hex: '#fff3c4' },
  { id: 'dorado', name: 'Dorado', hex: '#d4a017' },
];

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
  { id: 'descarne', label: 'Descarne' },
  { id: 'cuero_forrado', label: 'Cuero forrado' },
  { id: 'gamuza', label: 'Gamuza' },
  { id: 'suela', label: 'Suela' },
] as const;

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
export type ConfiguredPricing = { extras: Record<string, PricePoint> };

export type PricedOption = { id: string; label: string };
export type PricedGroup = { id: string; label: string; options: PricedOption[] };

export const emptyPricing = (): ConfiguredPricing => ({ extras: {} });

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
      options: [
        { id: 'asiento_descarne', label: 'Descarne' },
        { id: 'asiento_cuero_forrado', label: 'Cuero forrado' },
        { id: 'asiento_gamuza', label: 'Gamuza' },
        { id: 'asiento_suela', label: 'Suela' },
      ],
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
  }
  return { extras };
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
  material: 'descarne' | 'cuero_forrado' | 'gamuza' | 'suela';
  color: 'negro' | 'marron';
  tamano: '18' | '19' | '20';
  acabadoAsiento: 'perforado' | 'liso';
  materialAsiento: 'descarne' | 'cuero_forrado' | 'gamuza' | 'suela';
  faldin: boolean;
  iniciales: boolean;
  inicialesTexto: string;
  inicialesColor: string;
  inicialesTipografia: string;
  inicialesUbicacion: 'atras' | 'faldon' | 'faldin';
  corte: 'tapita' | 'costura';
  portaEstriberaIngles: boolean;
};

export type CascoConfig = {
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
};

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
    inicialesColor: 'negro',
    inicialesTipografia: 'trajan',
    inicialesUbicacion: 'atras',
    corte: 'tapita',
    portaEstriberaIngles: false,
  };
}

export function defaultCasco(): CascoConfig {
  return {
    modelo: 'h1',
    vicera: 'lock',
    tamano: '57',
    materialExterno: 'softshell',
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
    inicialesUbicacion: 'derecha',
    inicialesTamano: '16',
    bandera: false,
    banderaUbicacion: 'derecha',
    banderaPais: 'Argentina',
    logoIcUbicacion: 'derecha',
    logoIcColorPersonalizado: false,
    logoIcColor: 'negro',
    logoPersonalizado: false,
    logoPersonalizadoPosicion: 'izquierda',
    logoPersonalizadoTamano: 'mediano',
    logoPersonalizadoImagen: '',
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
    inicialesColor: 'negro',
    inicialesTipografia: 'trajan',
    inicialesUbicacion: 'centro',
    inicialesTamano: 'mediano',
    bordado: false,
    bordadoImagen: '',
    bordadoTamano: 'mediano',
    bordadoUbicacion: 'centro',
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
    inicialesColor: 'negro',
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
  if (!INITIAL_COLORS.some((color) => color.id === id))
    throw new Error(`${label}: color inválido.`);
  return id;
}

export function parseMontura(raw: unknown): MonturaConfig {
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const config: MonturaConfig = {
    tipo: oneOf(b.tipo, ['americana', 'bauti'], 'Tipo'),
    material: oneOf(
      b.material || 'cuero_forrado',
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
      b.materialAsiento,
      ['descarne', 'cuero_forrado', 'gamuza', 'suela'],
      'Material asiento',
    ),
    faldin: flag(b.faldin),
    iniciales: flag(b.iniciales),
    inicialesTexto: text(b.inicialesTexto).trim(),
    inicialesColor: text(b.inicialesColor, 'negro'),
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
  const b =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const config: CascoConfig = {
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
    inicialesColor: text(b.inicialesColor, 'negro'),
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
    inicialesColor: text(b.inicialesColor, 'negro'),
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
  };
  requireInitials(config);
  if (config.bordado) requireImage(config.bordadoImagen, 'bordado');
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
    inicialesColor: text(b.inicialesColor, 'negro'),
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
      material: c.material,
      color: c.color,
      tamano: c.tamano,
      acabadoAsiento: c.acabadoAsiento,
      materialAsiento: c.materialAsiento,
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

function colorName(id: string) {
  return INITIAL_COLORS.find((color) => color.id === id)?.name || id;
}

function fontName(id: string) {
  return FONTS.find((font) => font.id === id)?.label || id;
}

export function configLabels(kind: ConfiguredKind, raw: ProductConfig) {
  const labels: Record<string, string> = {};
  if (kind === 'montura') {
    const c = raw as MonturaConfig;
    labels.Tipo = c.tipo === 'americana' ? 'Americana' : 'Bauti';
    labels.Material =
      MONTURA_MATERIALS.find((material) => material.id === c.material)?.label ||
      c.material;
    labels.Color = c.color === 'negro' ? 'Negro' : 'Marrón';
    labels.Tamaño = c.tamano;
    labels['Acabado asiento'] =
      c.acabadoAsiento === 'perforado' ? 'Perforado' : 'Liso';
    labels['Material asiento'] = {
      descarne: 'Descarne',
      cuero_forrado: 'Cuero forrado',
      gamuza: 'Gamuza',
      suela: 'Suela',
    }[c.materialAsiento];
    labels.Faldín = c.faldin ? 'Con' : 'Sin';
    labels.Corte = c.corte === 'tapita' ? 'Tapita' : 'Costura';
    labels['Porta estribera inglés'] = c.portaEstriberaIngles ? 'Sí' : 'No';
    if (c.iniciales) {
      labels.Iniciales = c.inicialesTexto;
      labels['Color iniciales'] = colorName(c.inicialesColor);
      labels.Tipografía = fontName(c.inicialesTipografia);
      labels['Ubicación iniciales'] = {
        atras: 'Atrás',
        faldon: 'Faldón',
        faldin: 'Faldín',
      }[c.inicialesUbicacion];
    }
    return labels;
  }
  if (kind === 'rodillera') {
    const c = raw as RodilleraConfig;
    labels.Tipo =
      RODILLERA_TIPOS.find((tipo) => tipo.id === c.tipo)?.label || c.tipo;
    labels.Modelo =
      RODILLERA_MODELOS.find((modelo) => modelo.id === c.modelo)?.label ||
      c.modelo;
    labels.Color =
      RODILLERA_COLORS.find((color) => color.id === c.color)?.label || c.color;
    labels['Protector centro'] =
      RODILLERA_COLORS.find((color) => color.id === c.protectorCentroColor)
        ?.label || c.protectorCentroColor;
    labels.Tamaño =
      RODILLERA_SIZES.find((size) => size.id === c.tamano)?.label || c.tamano;
    if (c.iniciales) {
      labels.Iniciales = `${c.inicialesTexto} · ${
        RODILLERA_SIZES.find((size) => size.id === c.inicialesTamano)?.label ||
        c.inicialesTamano
      }`;
      labels['Color iniciales'] = colorName(c.inicialesColor);
      labels.Tipografía = fontName(c.inicialesTipografia);
      labels['Ubicación iniciales'] =
        RODILLERA_PLACES.find((place) => place.id === c.inicialesUbicacion)
          ?.label || c.inicialesUbicacion;
    }
    if (c.bordado) {
      labels.Bordado =
        RODILLERA_SIZES.find((size) => size.id === c.bordadoTamano)?.label ||
        c.bordadoTamano;
      labels['Ubicación bordado'] =
        RODILLERA_PLACES.find((place) => place.id === c.bordadoUbicacion)
          ?.label || c.bordadoUbicacion;
    }
    return labels;
  }
  if (kind === 'bota') {
    const c = raw as BotaConfig;
    labels.Modelo =
      BOTA_MODELOS.find((modelo) => modelo.id === c.modelo)?.label || c.modelo;
    labels.Material =
      BOTA_MATERIALS.find((material) => material.id === c.material)?.label ||
      c.material;
    labels.Color =
      BOTA_COLORS.find((color) => color.id === c.color)?.label || c.color;
    labels.Acabado =
      BOTA_ACABADOS.find((acabado) => acabado.id === c.acabado)?.label ||
      c.acabado;
    for (const measure of BOTA_MEASURES) {
      labels[`${measure.n}. ${measure.label}`] =
        c.medidas[measure.id] || '—';
    }
    labels.Parche = c.parche ? 'Con' : 'Sin';
    labels['Pasador rodillera'] = c.pasadorRodillera ? 'Con' : 'Sin';
    labels['Tope espuelas'] = c.topeEspuelas ? 'Con' : 'Sin';
    labels.Engrasado = c.engrasado ? 'Sí' : 'No';
    if (c.iniciales) {
      labels.Iniciales = c.inicialesTexto;
      labels['Color iniciales'] = colorName(c.inicialesColor);
      labels.Tipografía = fontName(c.inicialesTipografia);
      labels['Ubicación iniciales'] =
        BOTA_PLACES.find((place) => place.id === c.inicialesUbicacion)
          ?.label || c.inicialesUbicacion;
    }
    return labels;
  }
  const c = raw as CascoConfig;
  labels.Modelo =
    c.modelo === 'h1' ? 'H1 homologado' : 'Standard sin homologar';
  labels['Tipo de vicera'] =
    c.vicera === 'lock' ? 'Lock / English' : 'Argentina';
  labels.Tamaño =
    HELMET_SIZES.find((size) => size.id === c.tamano)?.label || c.tamano;
  labels['Material externo'] =
    HELMET_MATERIALS.find((material) => material.id === c.materialExterno)
      ?.label || c.materialExterno;
  labels['Color casco'] = colorName(c.colorCasco);
  labels['Vicera arriba'] = colorName(c.colorViceraArriba);
  labels['Vicera abajo'] = colorName(c.colorViceraAbajo);
  if (c.vicera === 'argentina')
    labels['Banda vicera'] = colorName(c.colorBandaVicera);
  labels.Tapones = colorName(c.colorTapones);
  labels.Correaje = c.correaje ? colorName(c.correajeColor) : 'Sin correaje';
  labels['Logo IC'] = c.logoIcUbicacion === 'derecha' ? 'Derecha' : 'Izquierda';
  if (c.logoIcColorPersonalizado)
    labels['Color logo IC'] = colorName(c.logoIcColor);
  if (c.iniciales) {
    labels.Iniciales = `${c.inicialesTexto} · ${c.inicialesTamano} mm`;
    labels['Color iniciales'] = colorName(c.inicialesColor);
    labels.Tipografía = fontName(c.inicialesTipografia);
    labels['Ubicación iniciales'] =
      c.inicialesUbicacion === 'derecha' ? 'Derecha' : 'Izquierda';
  }
  if (c.bandera) {
    labels.Bandera = c.banderaPais;
    labels['Ubicación bandera'] = {
      derecha: 'Derecha',
      izquierda: 'Izquierda',
      frente: 'Frente',
      atras: 'Atrás',
    }[c.banderaUbicacion];
  }
  if (c.logoPersonalizado) {
    labels['Logo personalizado'] = c.logoPersonalizadoTamano;
    labels['Posición logo'] = {
      derecha: 'Derecha',
      izquierda: 'Izquierda',
      frente: 'Frente',
      atras: 'Atrás',
    }[c.logoPersonalizadoPosicion];
  }
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
    config?: Record<string, unknown>;
  }[],
  productId: string,
) {
  const rows = new Map<
    string,
    { quantity: number; location: string; config: Record<string, unknown> }
  >();
  for (const movement of movements) {
    if (movement.product_id !== productId) continue;
    const location = movement.location || '';
    const key = `${movement.config_key || ''}\t${location}`;
    const prev = rows.get(key);
    const config =
      movement.config && Object.keys(movement.config).length
        ? movement.config
        : prev?.config || {};
    rows.set(key, {
      quantity: (prev?.quantity || 0) + movement.quantity,
      location,
      config,
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

export function summarizeConfig(kind: ConfiguredKind, raw: ProductConfig) {
  const labels = configLabels(kind, raw);
  return Object.entries(labels)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}
