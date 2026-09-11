import { readFile } from 'node:fs/promises';

const baseUrl = process.env.ICONIC_BASE_URL || 'http://localhost:3000';
const catalog = JSON.parse(
  await readFile(
    new URL('../data/catalogo-real.json', import.meta.url),
    'utf8',
  ),
);

async function crm(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `${path}: ${response.status}`);
  }
  return result;
}

await crm('/api/crm', {
  method: 'POST',
  headers: {
    Origin: baseUrl,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'initialize', demo: false }),
});

const current = await crm('/api/crm', { cache: 'no-store' });
const bySku = new Map(
  current.products.map((product) => [product.sku, product]),
);
const suppliersByName = new Map(
  current.contacts
    .filter((contact) => contact.kind === 'supplier' && !contact.archived)
    .map((contact) => [contact.name.trim().toUpperCase(), contact]),
);

const supplierNames = [
  ...new Set(
    catalog.products
      .map((product) => product.supplier)
      .filter((name) => typeof name === 'string' && name.trim()),
  ),
];
for (const name of supplierNames) {
  const key = name.trim().toUpperCase();
  if (suppliersByName.has(key)) continue;
  const created = await crm('/api/crm', {
    method: 'POST',
    headers: {
      Origin: baseUrl,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'contact',
      kind: 'supplier',
      name: name.trim(),
      contact: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      notes: 'Cargado desde inventario 2026-09-10',
      fiscal: {},
    }),
  });
  suppliersByName.set(key, { id: created.id, name: name.trim() });
}

let created = 0;
let updated = 0;
for (const product of catalog.products) {
  const existing = bySku.get(product.sku);
  const attributes = { ...(product.attributes || {}) };
  if (product.sourceSku !== product.sku) {
    attributes['SKU original'] = product.sourceSku;
  }
  if (product.cost === null) {
    attributes['Costo'] = 'Pendiente de definir';
  }
  if (product.price === null) {
    attributes['Precio de lista'] = 'Pendiente de definir';
  }
  if (product.ffPrice === null) {
    attributes['Precio F&F'] = 'Pendiente de definir';
  }
  const supplier =
    typeof product.supplier === 'string' && product.supplier.trim()
      ? suppliersByName.get(product.supplier.trim().toUpperCase())
      : null;

  await crm('/api/crm', {
    method: 'POST',
    headers: {
      Origin: baseUrl,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'product',
      id: existing?.id,
      version: existing?.version,
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplier_id: supplier?.id || existing?.supplier_id || '',
      cost: Math.round((product.cost ?? 0) * 100),
      price: Math.round((product.price ?? 0) * 100),
      ff_discount: 0,
      ff_price:
        product.ffPrice === null ? null : Math.round(product.ffPrice * 100),
      promo_kind: 'none',
      promo_value: 0,
      photos: existing?.photos ?? [],
      options: existing?.options ?? [],
      attributes,
    }),
  });
  if (existing) updated += 1;
  else created += 1;
}

console.log(
  JSON.stringify({
    currency: catalog.currency,
    total: catalog.products.length,
    created,
    updated,
    pendingCost: catalog.products.filter((p) => p.cost === null).length,
    pendingListPrice: catalog.products.filter((p) => p.price === null).length,
    pendingFriendsAndFamily: catalog.products.filter((p) => p.ffPrice === null)
      .length,
  }),
);
