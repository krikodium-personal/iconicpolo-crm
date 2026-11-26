/**
 * Carga en D1 el catálogo público de una lista de precios.
 */

import { ensurePriceLists, stmt } from '@/lib/server';
import { codigoDeDireccion, direccionLista } from '@/lib/lista-direccion';
import { formatMoney, percent } from '@/lib/money';
import { configuredKindOf } from '@/lib/configure';
import {
  decodeAttributes,
  expandConfiguredPublicItems,
  expandSkuPublicItem,
  type ListRef,
  type PublicPriceList,
  type PublicPriceListItem,
} from '@/lib/public-price-catalog';

export type {
  PublicPriceList,
  PublicPriceListGroup,
  PublicPriceListItem,
} from '@/lib/public-price-catalog';

export { expandConfiguredPublicItems } from '@/lib/public-price-catalog';

/**
 * Orden de las categorías en la lista pública, por nombre. Las que no están
 * acá van al final, por orden alfabético.
 */
const ORDEN_CATEGORIAS = [
  'cascos',
  'monturas',
  'botas',
  'rodilleras',
  'tacos',
  'cabezadas',
  'accesorios',
];

function rangoCategoria(nombre: string) {
  const clave = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const rango = ORDEN_CATEGORIAS.indexOf(clave);
  return rango === -1 ? ORDEN_CATEGORIAS.length : rango;
}

/**
 * Carga una lista activa y los productos con precio ya descontado.
 *
 * `direccion` es lo que viene después de /lista/: la dirección con nombre y
 * código, o el id de las direcciones viejas. La lista se encuentra por el
 * id o por el código; `address` dice cuál es su dirección de hoy, para
 * redirigir si se llegó por otra.
 */
export async function loadPublicPriceList(
  direccion: string,
): Promise<(PublicPriceList & { address: string }) | null> {
  const id = direccion.trim();
  if (!id) return null;

  await ensurePriceLists();

  const list = await stmt(
    "SELECT id, name, discount, archived, code FROM price_lists WHERE id=? OR (code<>'' AND code=?) ORDER BY id=? DESC LIMIT 1",
    id,
    codigoDeDireccion(id),
    id,
  ).first<{
    id: string;
    name: string;
    discount: number;
    archived: number;
    code: string;
  }>();
  if (!list || list.archived) return null;

  const listRef: ListRef = {
    id: list.id,
    discount: Number(list.discount) || 0,
  };

  const currency =
    (
      await stmt('SELECT currency FROM settings WHERE id=1').first<{
        currency: string;
      }>()
    )?.currency || 'USD';

  const categories = (
    await stmt('SELECT id, name FROM categories ORDER BY name').all<{
      id: string;
      name: string;
    }>()
  ).results;
  const categoryName = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const products = (
    await stmt(
      'SELECT id, name, sku, category, price, list_prices, photos, kind, unit, attributes, pricing FROM products WHERE archived=0 ORDER BY name',
    ).all<{
      id: string;
      name: string;
      sku: string;
      category: string;
      price: number;
      list_prices: string | null;
      photos: string | null;
      kind: string;
      unit: string | null;
      attributes: string | null;
      pricing: string | null;
    }>()
  ).results;

  const items: PublicPriceListItem[] = [];
  for (const product of products) {
    const attributes = decodeAttributes(product.attributes);
    if (attributes['Precio de lista'] === 'Pendiente de definir') continue;
    if ((Number(product.price) || 0) <= 0) continue;

    const catName = categoryName.get(product.category) || product.category;
    const kind = configuredKindOf({
      kind: product.kind || 'sku',
      category: product.category,
    });

    if (kind) {
      items.push(...expandConfiguredPublicItems(product, catName, listRef));
      continue;
    }

    const sku = expandSkuPublicItem(product, catName, listRef);
    if (sku) items.push(sku);
  }

  // Categorías en el orden de ORDEN_CATEGORIAS; modelos/opciones base
  // primero y adicionales (+) al final de cada producto.
  items.sort(
    (a, b) =>
      rangoCategoria(a.categoryName) - rangoCategoria(b.categoryName) ||
      a.categoryName.localeCompare(b.categoryName, 'es') ||
      a.sku.localeCompare(b.sku, 'es') ||
      Number(a.addon) - Number(b.addon) ||
      a.name.localeCompare(b.name, 'es'),
  );

  const groups: PublicPriceList['groups'] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.categoryId === item.categoryId) last.items.push(item);
    else
      groups.push({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        items: [item],
      });
  }

  return {
    id: list.id,
    address: direccionLista(list),
    name: list.name,
    discount: listRef.discount,
    discountLabel: percent(listRef.discount),
    currency,
    groups,
    itemCount: items.length,
  };
}

export function formatPublicPrice(cents: number, currency: string) {
  return formatMoney(cents, currency);
}
