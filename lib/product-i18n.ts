import type { Product } from './types';

/** Phrase-level EN for SKU / accessory names on English quotes. */
export function productNameEn(name: string, product?: Product) {
  const category = product?.category || '';
  const known: Record<string, string> = {
    Casco: 'Helmet',
    Montura: 'Saddle',
    Rodillera: 'Knee pad',
    Rodilleras: 'Knee pads',
    Bota: 'Boot',
    Botas: 'Boots',
    Taco: 'Mallet',
    Tacos: 'Mallets',
  };
  if (known[name]) return known[name];
  if (known[category] && name === category) return known[category];

  // Longest phrases first so compound product names win over shorter stems.
  const phrases: [RegExp, string][] = [
    [/cabezada completa/gi, 'Complete bridle set'],
    [/bols[oó]n monturero/gi, 'Saddle bag'],
    [/almohadillas? interior cascos homologados/gi, 'Homologated helmet liner pads'],
    [/taquera de cordura y cuero chica/gi, 'Cordura and leather mallet bag small'],
    [/taquera de cordura y cuero mediana/gi, 'Cordura and leather mallet bag medium'],
    [/taquera de cordura y cuero grande/gi, 'Cordura and leather mallet bag large'],
    [/taquera de cordura con ruedas/gi, 'Cordura mallet bag with wheels'],
    [/taquera de cordura/gi, 'Cordura mallet bag'],
    [/cincha neoprene desmontable/gi, 'Detachable neoprene girth'],
    [/cincha neoprene tiradores de cuero/gi, 'Neoprene girth with leather straps'],
    [/cincha neoprene/gi, 'Neoprene girth'],
    [/cincha standard/gi, 'Standard girth'],
    [/sobrecinchas? guarda pampa/gi, 'Overgirth guarda pampa'],
    [/montura americana/gi, 'American saddle'],
    [/montura bauti/gi, 'Bauti saddle'],
    [/cuero forrado/gi, 'lined leather'],
    [/\ben cuero o sublimado\b/gi, 'in leather or sublimated'],
    [/\ben softshell\b/gi, 'in softshell'],
    [/casco no homologado/gi, 'Non-homologated helmet'],
    [/casco homologado/gi, 'Homologated helmet'],
    [/botas polo argentino/gi, 'Argentine Polo boots'],
    [/botas texas/gi, 'Texas boots'],
    [/botas estandard/gi, 'Standard boots'],
    [/rodilleras estandard/gi, 'Standard knee pads'],
    [/rodilleras premium/gi, 'Premium knee pads'],
    [/velcro y hebilla/gi, 'velcro and buckle'],
    [/doble velcro/gi, 'double velcro'],
    [/doble cuero/gi, 'double leather'],
    [/triple cuero/gi, 'triple leather'],
    [/tacos personalizados/gi, 'Custom mallets'],
    [/tacos estandard/gi, 'Standard mallets'],
    [/riendas por par/gi, 'Reins per pair'],
    [/sobrecinchas?/gi, 'Overgirth'],
    [/sobreinchas?/gi, 'Overgirth'],
    [/estriberas/gi, 'Stirrup leathers'],
    [/riendillas/gi, 'Running reins'],
    [/riendas/gi, 'Reins'],
    [/cabezada/gi, 'Bridle'],
    [/pechera/gi, 'Breastplate'],
    [/pretal/gi, 'Breastplate'],
    [/cincha/gi, 'Girth'],
    [/estribos/gi, 'Stirrups'],
    [/hocquieras/gi, 'Nosebands'],
    [/cierra bocas/gi, 'Mouth closer'],
    [/botero/gi, 'Boot bag'],
    [/red para cascos/gi, 'Helmet net'],
    [/funda para cascos/gi, 'Helmet cover'],
    [/tensabotas/gi, 'Boot trees'],
    [/protectores/gi, 'Protectors'],
    [/rodilleras/gi, 'Knee pads'],
    [/no homologado/gi, 'non-homologated'],
    [/homologado/gi, 'homologated'],
    [/modelo argentino/gi, 'Argentine model'],
    [/modelo lock/gi, 'lock model'],
    [/\bdescarne\b/gi, 'rawhide'],
    [/\bsuela\b/gi, 'sole leather'],
    [/combinada/gi, 'combined'],
    [/desmontable/gi, 'detachable'],
    [/tiradores/gi, 'straps'],
    [/estandard/gi, 'standard'],
    [/standard/gi, 'standard'],
    [/neoprene/gi, 'neoprene'],
    [/softshell/gi, 'softshell'],
    [/sublimado/gi, 'sublimated'],
    [/velcro/gi, 'velcro'],
    [/hebilla/gi, 'buckle'],
    [/premium/gi, 'premium'],
    [/\bcuero\b/gi, 'leather'],
    [/\bmarr[oó]n\b/gi, 'brown'],
    [/\bnegro\b/gi, 'black'],
    [/\bblanco\b/gi, 'white'],
    [/\btabaco\b/gi, 'tobacco'],
    [/\bchocolate\b/gi, 'chocolate'],
    [/\bchica\b/gi, 'small'],
    [/\bmediana\b/gi, 'medium'],
    [/\bgrande\b/gi, 'large'],
  ];
  let next = name;
  for (const [pattern, replacement] of phrases) {
    next = next.replace(pattern, replacement);
  }
  return next;
}

const ATTRIBUTE_LABEL_EN: Record<string, string> = {
  Color: 'Color',
  Material: 'Material',
  Modelo: 'Model',
  Talle: 'Size',
  Tamaño: 'Size',
  Tipo: 'Type',
  Riendas: 'Reins',
  Medida: 'Size',
  Proveedor: 'Supplier',
};

const ATTRIBUTE_VALUE_EN: Record<string, string> = {
  Negro: 'Black',
  Marrón: 'Brown',
  Marron: 'Brown',
  Blanco: 'White',
  Tabaco: 'Tobacco',
  Chocolate: 'Chocolate',
  Standard: 'Standard',
  Premium: 'Premium',
  Velcro: 'Velcro',
  'Doble velcro': 'Double velcro',
  Hebilla: 'Buckle',
  Chica: 'Small',
  Mediano: 'Medium',
  Mediana: 'Medium',
  Grande: 'Large',
  '1 rienda': '1 rein',
  '2 riendas': '2 reins',
};

/** Translate stored SKU attribute rows for English quote sheets. */
export function translateAttributeRows(
  rows: { label: string; value: string }[],
  lang: 'es' | 'en',
) {
  if (lang !== 'en') return rows;
  return rows.map((row) => ({
    label: ATTRIBUTE_LABEL_EN[row.label] || productNameEn(row.label),
    value: ATTRIBUTE_VALUE_EN[row.value] || productNameEn(row.value),
  }));
}
