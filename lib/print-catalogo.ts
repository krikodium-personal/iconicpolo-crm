/**
 * Catálogo de Print: dibujos de ejemplo para que el cliente pruebe sobre el
 * casco antes de subir el suyo.
 *
 * Los archivos viven en public/prints/: `<id>.webp` es la imagen que se
 * proyecta (máx. 1536 px) y `<id>-thumb.webp` la miniatura cuadrada del
 * selector. Para sumar uno, se agregan los dos archivos y una línea acá.
 *
 * Copia de src/data/printCatalog.ts del sitio: los ids y los archivos tienen
 * que ser los mismos en los dos repos, porque las solicitudes del sitio llegan
 * con el id y el stock del CRM se agrupa por él.
 */
export interface PrintCatalogo {
  id: string;
  es: string;
  en: string;
}

export const PRINTS_CATALOGO: PrintCatalogo[] = [
  { id: 'camo-azul', es: 'Camuflaje azul', en: 'Blue camo' },
  { id: 'barroco-azul', es: 'Barroco azul', en: 'Blue baroque' },
  { id: 'tribal-azul', es: 'Tribal azul', en: 'Blue tribal' },
  { id: 'camo-hielo', es: 'Camuflaje hielo', en: 'Ice camo' },
  { id: 'camo-naranja', es: 'Camuflaje naranja', en: 'Orange camo' },
  { id: 'camo-verde-neon', es: 'Camuflaje verde neón', en: 'Neon green camo' },
  { id: 'camo-capas', es: 'Camuflaje en capas', en: 'Layered camo' },
  { id: 'calaveras', es: 'Calaveras', en: 'Skulls' },
  { id: 'topografico-naranja', es: 'Topográfico naranja', en: 'Orange topographic' },
  { id: 'abstracto-lima', es: 'Abstracto lima', en: 'Lime abstract' },
  { id: 'graffiti-neon', es: 'Graffiti neón', en: 'Neon graffiti' },
  { id: 'good-vibes', es: 'Good Vibes', en: 'Good Vibes' },
  { id: 'stickers-negro', es: 'Stickers negro', en: 'Black stickers' },
  { id: 'dragon-rojo-negro', es: 'Dragón rojo y negro', en: 'Red & black dragon' },
  { id: 'dragones-blanco', es: 'Dragones blanco', en: 'White dragons' },
  { id: 'barroco-blanco', es: 'Barroco blanco', en: 'White baroque' },
];

export const urlPrint = (id: string) => `/prints/${id}.webp`;
export const urlMiniaturaPrint = (id: string) => `/prints/${id}-thumb.webp`;
