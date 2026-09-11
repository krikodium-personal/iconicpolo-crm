import type { Category, Product } from './types';

/** Variantes y SKU de rodilleras. No aplicar a otras categorías. */
export const RODILLERA_FIELDS: Category['fields'] = [
  { name: 'Modelo', values: ['Estandard', 'Premium'] },
  {
    name: 'Tipo',
    values: ['Velcro y hebilla', 'Doble velcro'],
  },
  { name: 'Color', values: ['Marron', 'Negro'] },
];

export const RODILLERA_SKU_ATTRIBUTES: Record<
  string,
  Record<string, string>
> = {
  '1017REVHN': {
    Modelo: 'Estandard',
    Tipo: 'Velcro y hebilla',
    Color: 'Negro',
  },
  '1017REVVN': {
    Modelo: 'Estandard',
    Tipo: 'Doble velcro',
    Color: 'Negro',
  },
  '1017REVHM': {
    Modelo: 'Estandard',
    Tipo: 'Velcro y hebilla',
    Color: 'Marron',
  },
  '1017REVVM': {
    Modelo: 'Estandard',
    Tipo: 'Doble velcro',
    Color: 'Marron',
  },
  '1017RPVHN': {
    Modelo: 'Premium',
    Tipo: 'Velcro y hebilla',
    Color: 'Negro',
  },
  '1017RPVVN': {
    Modelo: 'Premium',
    Tipo: 'Doble velcro',
    Color: 'Negro',
  },
  '1017RPVHM': {
    Modelo: 'Premium',
    Tipo: 'Velcro y hebilla',
    Color: 'Marron',
  },
  '1017RPVVM': {
    Modelo: 'Premium',
    Tipo: 'Doble velcro',
    Color: 'Marron',
  },
};

export function closedFields(fields: Category['fields']) {
  return fields.filter((field) => field.values.length > 0);
}

export function skuFields(
  fields: Category['fields'],
  products: Pick<Product, 'category' | 'attributes'>[],
  categoryId: string,
) {
  const inCategory = products.filter(
    (product) => product.category === categoryId,
  );
  return closedFields(fields).filter((field) =>
    inCategory.some((product) => product.attributes[field.name]),
  );
}

export function findVariantProduct<
  T extends Pick<Product, 'id' | 'category' | 'attributes' | 'archived'>,
>(
  products: T[],
  categoryId: string,
  attributes: Record<string, string>,
  fields: Category['fields'],
) {
  const keys = skuFields(fields, products, categoryId);
  if (!keys.length || keys.some((field) => !attributes[field.name]))
    return undefined;
  return products.find(
    (product) =>
      !product.archived &&
      product.category === categoryId &&
      keys.every(
        (field) => product.attributes[field.name] === attributes[field.name],
      ),
  );
}
