/**
 * Catálogo del taco de polo.
 *
 * Las opciones salen del personalizador del sitio (`src/data/malletModel.ts`
 * y `src/data/helmetPalettes.ts` en iconicpolo.com): el sitio es lo que ve el
 * cliente, así que manda. Si allá se agrega un color o una opción, hay que
 * reflejarlo acá o la solicitud llega con un aviso.
 *
 * Los colores se identifican por nombre y no por hexadecimal: en la paleta de
 * lacas el Rojo y el Rojo Neón comparten el mismo valor, y en el taller son dos
 * lacas distintas.
 */

export type TacoColor = {
  id: string;
  name: string;
  nameEn: string;
  /** El color con que se muestra la muestra en el CRM. */
  hex: string;
};

export const TACO_TAMANOS = [48, 49, 50, 51, 52, 53, 54] as const;
export type TacoTamano = (typeof TACO_TAMANOS)[number];

export const TACO_FLEX = [
  { id: 'rigida', label: 'Rígida', labelEn: 'Stiff' },
  { id: 'media_rigida', label: 'Media / Rígida', labelEn: 'Medium stiff' },
  { id: 'media', label: 'Media', labelEn: 'Medium' },
  { id: 'blanda', label: 'Blanda', labelEn: 'Flexible' },
] as const;
export type TacoFlex = (typeof TACO_FLEX)[number]['id'];

/** Peso del cigarro en gramos, de 160 a 215 de a 5. */
export const TACO_PESOS = [
  160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215,
] as const;
export type TacoPeso = (typeof TACO_PESOS)[number];

export const TACO_MANIJAS = [
  { id: 'chica', label: 'Chica', labelEn: 'Small' },
  { id: 'regular', label: 'Regular', labelEn: 'Regular' },
  { id: 'grande', label: 'Grande', labelEn: 'Large' },
] as const;
export type TacoManija = (typeof TACO_MANIJAS)[number]['id'];

/** Las zonas de madera que se pintan. La puntera va aparte: es cinta. */
export const TACO_ZONAS = [
  { id: 'cigarro', label: 'Cigarro', labelEn: 'Cigar' },
  { id: 'bandas', label: 'Bandas', labelEn: 'Bands' },
  { id: 'extremos', label: 'Extremos', labelEn: 'Ends' },
  { id: 'puntas', label: 'Puntas', labelEn: 'Tips' },
] as const;
export type TacoZona = (typeof TACO_ZONAS)[number]['id'];

export const TACO_COLORES_NUMERO = [
  { id: 'negro', label: 'Negro', labelEn: 'Black' },
  { id: 'blanco', label: 'Blanco', labelEn: 'White' },
] as const;
export type TacoColorNumero = (typeof TACO_COLORES_NUMERO)[number]['id'];

/** Las letras del grabado: una por casilla, en un lugar fijo del cigarro. */
export const TACO_INICIALES_MAX = 3;

function slug(nombre: string) {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function paleta(colores: Array<[string, string, string]>): TacoColor[] {
  return colores.map(([name, nameEn, hex]) => ({ id: slug(name), name, nameEn, hex }));
}

/** El color que deja la madera a la vista: no pinta nada. */
export const TACO_NATURAL = 'natural';

/** Lacas para cigarro, bandas, extremos y puntas. */
export const TACO_LACAS = paleta([
  // En el sitio Natural vale #ffffff porque tiñe; acá se muestra la madera.
  ['Natural', 'Natural', '#e0b166'],
  ['Negro', 'Black', '#000000'],
  ['Verde Cazador', 'Hunter Green', '#003f09'],
  ['Verde Lima', 'Lime Green', '#00f22c'],
  ['Azul Marino', 'Navy Blue', '#030086'],
  ['Rosa Claro', 'Light Pink', '#ff9dba'],
  ['Rojo', 'Red', '#ff0000'],
  ['Bordó', 'Burgundy', '#680404'],
  ['Amarillo', 'Yellow', '#f9ff00'],
  ['Verde Irlandés', 'Irish Green', '#3ea32e'],
  ['Verde Azulado', 'Teal', '#008080'],
  ['Aqua Zappala', 'Zappala Aqua', '#00fdbb'],
  ['Azul Francia', 'Royal Blue', '#0032c8'],
  ['Celeste', 'Light Blue', '#00f2f7'],
  ['Blanco', 'White', '#f7f2f2'],
  ['Gris Oscuro', 'Dark Grey', '#565656'],
  ['Gris Claro', 'Light Grey', '#818181'],
  ['Oro Amarillo', 'Yellow Gold', '#f1be00'],
  ['Naranja', 'Orange', '#ff4600'],
  ['Marrón Oscuro', 'Dark Brown', '#352500'],
  ['Beige', 'Beige', '#efdaa6'],
  ['Marrón Claro', 'Light Brown', '#664929'],
  ['Magenta', 'Magenta', '#ff01ec'],
  ['Fucsia', 'Hot Pink', '#ff0094'],
  ['Violeta', 'Purple', '#630099'],
  ['Rojo Neón', 'Neon Red', '#ff0000'],
  ['Amarillo Neón', 'Neon Yellow', '#f3ff00'],
  ['Verde Neón', 'Neon Green', '#00ff1e'],
  ['Naranja Neón', 'Neon Orange', '#ff7f00'],
  ['Dorado Metalizado', 'Metallic Gold', '#cda53c'],
  ['Plateado Metalizado', 'Metallic Silver', '#bbbbbb'],
]);

/** Cinta de la puntera: natural o la paleta de tela del casco del sitio. */
export const TACO_PUNTERAS = paleta([
  ['Natural', 'Natural', '#f2f2f2'],
  ['Gris Claro', 'Light Grey', '#b8b5a8'],
  ['Gris Medio', 'Medium Grey', '#3f3f3f'],
  ['Negro', 'Black', '#000000'],
  ['Azul Marino', 'Marine Blue', '#06132b'],
  ['Azul Clásico', 'Classic Blue', '#3564a9'],
  ['Azul Pastel Oscuro', 'Dark Pastel Blue', '#4989bc'],
  ['Azul Pastel Claro', 'Light Pastel Blue', '#c5daeb'],
  ['Azul Acero Claro', 'Light Steel Blue', '#7e96a2'],
  ['Agua', 'Aqua', '#3db7bf'],
  ['Violeta', 'Violet', '#7e6eac'],
  ['Púrpura', 'Purple', '#44377d'],
  ['Rosa Pálido', 'Blush', '#fdd6d6'],
  ['Bordó Oscuro', 'Dark Burgundy', '#660a17'],
  ['Rojo', 'Red', '#e00505'],
  ['Naranja Fantasía', 'Fantasy Orange', '#ff6a00'],
  ['Amarillo Canario', 'Canary Yellow', '#ffe998'],
  ['Verde Esmeralda', 'Emerald Green', '#008035'],
  ['Verde Cazador', 'Hunter Green', '#13452e'],
  ['Verde Oliva', 'Olive Green', '#808035'],
  ['Verde Oliva Oscuro', 'Dark Olive Green', '#3d3c1a'],
  ['Salvia', 'Sage', '#a1997d'],
  ['Marfil', 'Ivory', '#f9f0ca'],
  ['Café con Leche', 'Cafe Au Lait', '#c5a780'],
  ['Cacao', 'Cocoa', '#7a491d'],
  ['Marrón Nogal', 'Walnut Brown', '#5e462f'],
  ['Blanco', 'White', '#ffffff'],
]);

/** Busca un color por el nombre que muestra el sitio, sin importar acentos ni mayúsculas. */
export function tacoColorPorNombre(
  colores: TacoColor[],
  nombre: string,
): TacoColor | undefined {
  const id = slug(nombre || '');
  return colores.find((color) => color.id === id);
}

export function tacoLaca(id: string) {
  return TACO_LACAS.find((color) => color.id === id);
}

export function tacoPuntera(id: string) {
  return TACO_PUNTERAS.find((color) => color.id === id);
}

export type TacoConfig = {
  tamano: TacoTamano;
  /**
   * Flex, peso y manija son opcionales: sin elegir, el taller arma el taco
   * estándar y el valor guardado no se usa. Elegirlos suma un recargo único
   * por opción (`flex`, `peso`, `manija`), sea cual sea el valor.
   */
  conFlex: boolean;
  flex: TacoFlex;
  conPeso: boolean;
  peso: TacoPeso;
  conManija: boolean;
  manija: TacoManija;
  /** Laca de cada zona de madera; `natural` = sin pintar. */
  colores: Record<TacoZona, string>;
  puntera: string;
  /** Color del número de tamaño grabado. Las iniciales salen del mismo color. */
  colorNumero: TacoColorNumero;
  iniciales: boolean;
  /**
   * Una letra por casilla, en orden. Una casilla vacía va como espacio, porque
   * cada casilla tiene su lugar fijo en el cigarro: la segunda va junto a la
   * caña aunque la primera esté vacía.
   */
  inicialesTexto: string;
  /** Renders del diseño que mandó el sitio. */
  disenoImagenes: string[];
};

/**
 * Las zonas pintadas de algo que no es Natural. La pintura tiene un único
 * recargo (`pintura`): se cobra una vez si hay al menos una, sean las que sean.
 */
export function tacoZonasPintadas(colores: Record<TacoZona, string>) {
  return TACO_ZONAS.filter((zona) => colores[zona.id] !== TACO_NATURAL);
}
