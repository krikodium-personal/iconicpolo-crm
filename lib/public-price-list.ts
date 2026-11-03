/**
 * Carga en D1 el catálogo público de una lista de precios.
 */

import { stmt } from '@/lib/server';
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

/** Carga una lista activa y los productos con precio ya descontado. */
export async function loadPublicPriceList(
  listId: string,
): Promise<PublicPriceList | null> {
  const id = listId.trim();
  if (!id) return null;

  await stmt(
    "CREATE TABLE IF NOT EXISTS price_lists (id text PRIMARY KEY NOT NULL, name text NOT NULL, discount integer NOT NULL DEFAULT 0, archived integer NOT NULL DEFAULT 0, version integer NOT NULL DEFAULT 1, sort integer NOT NULL DEFAULT 0)",
  ).run();

  const list = await stmt(
    'SELECT id, name, discount, archived FROM price_lists WHERE id=?',
    id,
  ).first<{
    id: string;
    name: string;
    discount: number;
    archived: number;
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

  // Modelos/opciones base primero; adicionales (+) al final de cada producto.
  items.sort(
    (a, b) =>
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
