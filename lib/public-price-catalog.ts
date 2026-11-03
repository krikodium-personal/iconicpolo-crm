/**
 * Expansión de catálogo público: SKUs y opciones de configurables.
 * Sin acceso a D1 (testeable en Node).
 */

import {
  discounted,
  parseListPrices,
  priceFromList,
} from '@/lib/money';
import {
  PRICED_GROUPS,
  configuredKindOf,
  parsePricing,
  type ConfiguredKind,
  type ConfiguredPricing,
} from '@/lib/configure';

export type PublicPriceListItem = {
  id: string;
  name: string;
  /** Texto secundario (producto · grupo). */
  detail: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  photo: string;
  /** Precio de lista (centavos); en extras es el recargo de lista. */
  listPrice: number;
  /** Precio con la lista aplicada (centavos). */
  price: number;
  kind: string;
  unit: string;
  /** Extra/adicional: se muestra como recargo (+). */
  addon: boolean;
};

export type PublicPriceListGroup = {
  categoryId: string;
  categoryName: string;
  items: PublicPriceListItem[];
};

export type PublicPriceList = {
  id: string;
  name: string;
  /** Descuento en basis points (1500 = 15%). */
  discount: number;
  discountLabel: string;
  currency: string;
  groups: PublicPriceListGroup[];
  itemCount: number;
};

export type ListRef = { id: string; discount: number };

function decodePhotos(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

export function decodeAttributes(raw: unknown): Record<string, string> {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}

function decodePricing(raw: unknown): ConfiguredPricing {
  if (raw == null || raw === '') return parsePricing({});
  if (typeof raw === 'string') {
    try {
      return parsePricing(JSON.parse(raw));
    } catch {
      return parsePricing({});
    }
  }
  return parsePricing(raw);
}

/** Grupos cuyo precio es absoluto (base + delta), no un recargo suelto. */
function isModelGroup(kind: ConfiguredKind, groupId: string) {
  if (groupId === 'modelo') return true;
  if (kind === 'montura' && groupId === 'tipo') return true;
  return false;
}

function resolveDelta(amount: number, list: ListRef) {
  if (amount <= 0) return 0;
  return discounted(amount, list.discount);
}

/**
 * Expande un configurable en filas de modelo (precio total) + adicionales (+).
 */
export function expandConfiguredPublicItems(
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    list_prices?: string | null;
    photos?: string | null;
    pricing?: string | null;
    unit?: string | null;
    kind?: string;
  },
  categoryName: string,
  list: ListRef,
): PublicPriceListItem[] {
  const kind = configuredKindOf({
    kind: product.kind || 'configured',
    category: product.category,
  });
  if (!kind) return [];

  const baseList = Number(product.price) || 0;
  if (baseList <= 0) return [];

  const exact = parseListPrices(product.list_prices);
  const resolvedBase = priceFromList(baseList, list, exact);
  const pricing = decodePricing(product.pricing);
  const photos = decodePhotos(product.photos);
  const productPhoto = photos[0] || '';
  const unit = product.unit || 'unidad';
  const rows: PublicPriceListItem[] = [];

  for (const group of PRICED_GROUPS[kind]) {
    const asModel = isModelGroup(kind, group.id);
    for (const option of group.options) {
      const delta = pricing.extras[option.id]?.price || 0;
      const optionPhoto = pricing.photos[option.id] || productPhoto;

      if (asModel) {
        rows.push({
          id: `${product.id}:${option.id}`,
          name: option.label,
          detail: `${product.name} · ${group.label}`,
          sku: product.sku,
          categoryId: product.category,
          categoryName,
          photo: optionPhoto,
          listPrice: baseList + delta,
          price: resolvedBase + resolveDelta(delta, list),
          kind: 'configured',
          unit,
          addon: false,
        });
        continue;
      }

      if (delta <= 0) continue;
      rows.push({
        id: `${product.id}:${option.id}`,
        name: option.label,
        detail: `${product.name} · ${group.label}`,
        sku: product.sku,
        categoryId: product.category,
        categoryName,
        photo: optionPhoto || productPhoto,
        listPrice: delta,
        price: resolveDelta(delta, list),
        kind: 'configured',
        unit,
        addon: true,
      });
    }
  }

  if (!rows.length) {
    rows.push({
      id: product.id,
      name: product.name,
      detail: '',
      sku: product.sku,
      categoryId: product.category,
      categoryName,
      photo: productPhoto,
      listPrice: baseList,
      price: resolvedBase,
      kind: 'configured',
      unit,
      addon: false,
    });
  }

  return rows;
}

export function expandSkuPublicItem(
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    list_prices?: string | null;
    photos?: string | null;
    unit?: string | null;
    kind?: string;
  },
  categoryName: string,
  list: ListRef,
): PublicPriceListItem | null {
  const listPrice = Number(product.price) || 0;
  if (listPrice <= 0) return null;
  const exact = parseListPrices(product.list_prices);
  const photos = decodePhotos(product.photos);
  return {
    id: product.id,
    name: product.name,
    detail: '',
    sku: product.sku,
    categoryId: product.category,
    categoryName,
    photo: photos[0] || '',
    listPrice,
    price: priceFromList(listPrice, list, exact),
    kind: product.kind || 'sku',
    unit: product.unit || 'unidad',
    addon: false,
  };
}
