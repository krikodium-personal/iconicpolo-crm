import { readFile, writeFile } from 'node:fs/promises';

const baseUrl = process.env.ICONIC_BASE_URL || 'http://localhost:3000';
const inventory = JSON.parse(
  await readFile(new URL('../data/stock-inicial.json', import.meta.url), 'utf8'),
);
const catalogPath = new URL('../data/catalogo-real.json', import.meta.url);
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

const currentResponse = await fetch(`${baseUrl}/api/crm`, {
  cache: 'no-store',
});
if (!currentResponse.ok) {
  throw new Error(`No se pudo leer el CRM: ${currentResponse.status}`);
}
const current = await currentResponse.json();
const bySku = new Map(
  current.products.map((product) => [product.sku, product]),
);
const movementsByProduct = new Map();
for (const movement of current.movements || []) {
  const list = movementsByProduct.get(movement.product_id) || [];
  list.push(movement);
  movementsByProduct.set(movement.product_id, list);
}

const grouped = new Map();
const unmatched = [];
for (const row of inventory.rows) {
  const crmSku = row.crmSku || row.sku;
  if (!crmSku) {
    unmatched.push({ ...row, why: 'Sin SKU en la planilla' });
    continue;
  }
  const product = bySku.get(crmSku);
  if (!product) {
    unmatched.push({ ...row, crmSku, why: `SKU ${crmSku} no está en el catálogo` });
    continue;
  }
  const entry = grouped.get(crmSku) || {
    crmSku,
    product,
    quantity: 0,
    details: [],
  };
  entry.quantity += row.quantity;
  if (row.quantity || row.comment) {
    const bits = [
      row.supplier,
      row.comment,
      row.quantity ? `${row.quantity} uds.` : '0 uds.',
    ].filter(Boolean);
    entry.details.push(bits.join(' · '));
  }
  grouped.set(crmSku, entry);
}

let posted = 0;
let skipped = 0;
const loaded = [];
for (const entry of grouped.values()) {
  if (entry.quantity <= 0) {
    skipped += 1;
    continue;
  }
  const existing = movementsByProduct.get(entry.product.id) || [];
  if (existing.some((movement) => movement.reason?.startsWith(inventory.reason))) {
    skipped += 1;
    continue;
  }
  const detail = entry.details.length ? `. ${entry.details.join('; ')}` : '';
  const reason = `${inventory.reason}${detail}`.slice(0, 500);
  const response = await fetch(`${baseUrl}/api/crm`, {
    method: 'POST',
    headers: {
      Origin: baseUrl,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'stock',
      product_id: entry.product.id,
      quantity: entry.quantity,
      reason,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`${entry.crmSku} · ${entry.product.name}: ${result.error}`);
  }
  posted += 1;
  loaded.push({
    sku: entry.crmSku,
    name: entry.product.name,
    quantity: entry.quantity,
  });
}

const catalogStock = new Map(
  [...grouped.values()].map((entry) => [entry.crmSku, entry.quantity]),
);
for (const product of catalog.products) {
  product.stock = catalogStock.get(product.sku) ?? 0;
}
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      reason: inventory.reason,
      rows: inventory.rows.length,
      matchedSkus: grouped.size,
      posted,
      skipped,
      units: loaded.reduce((sum, row) => sum + row.quantity, 0),
      loaded,
      unmatched: unmatched.map((row) => ({
        sku: row.sku,
        crmSku: row.crmSku || null,
        name: row.name,
        quantity: row.quantity,
        why: row.why,
      })),
    },
    null,
    2,
  ),
);
