import { db } from '@/db';
import {
  integer,
  lineTotals,
  fixedLineTotals,
  discounted,
  promoPrice,
  increaseByPercent,
  arsFromUsd,
} from './money';
import {
  ORDER_STATUSES,
  orderIsDelivered,
  orderIsLocked,
  orderIsQuote,
  type Product,
  type Item,
  type Order,
  type Contact,
  type Option,
  type Category,
  type Partner,
  type AccountExpense,
  type AccountEntry,
  type PartnerCashout,
  type Task,
} from './types';
import {
  assertSharesComplete,
  cashoutLimit,
  monthlyResults,
  sharesAreComplete,
  totalsOf,
} from './account';
import { TASK_KINDS } from './tasks';
import {
  cabezadaRiendasLabel,
  cabezadaStockKey,
  isCabezadaProduct,
  parseCabezadaConfig,
  tryParseCabezadaConfig,
} from './cabezada';
import { whatsappGroup } from './whatsapp';
import { setPartnerAccess } from './auth';
import {
  configuredKindOf,
  extraTotals,
  adjustedConfiguredPrices,
  configLabels,
  itemStockHold,
  parseConfig,
  parsePricing,
  rewriteMonturaGamuzaText,
  stockAvailability,
  stockKey,
  stockPlaceLabel,
  TEMPLATE_IDS,
  type StockHold,
} from './configure';
export function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('Datos inválidos.');
  return v as Record<string, unknown>;
}
export function str(v: unknown, label: string, required = false, max = 500) {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
    throw new Error(`${label}: revisá el valor.`);
  return v.trim();
}
export function list(v: unknown, max = 100): unknown[] {
  if (!Array.isArray(v) || v.length > max) throw new Error('Lista inválida.');
  return v;
}
export function choice(v: unknown, values: string[], label: string) {
  const s = str(v, label, true);
  if (!values.includes(s)) throw new Error(`${label}: opción inválida.`);
  return s;
}
export function date(v: unknown, required = false) {
  const s = str(v, 'Fecha', required);
  if (
    s &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(s) ||
      !Number.isFinite(Date.parse(s)) ||
      new Date(s).toISOString().slice(0, 10) !== s)
  )
    throw new Error('Fecha inválida.');
  return s;
}
export function photo(v: unknown) {
  const s = str(v, 'Foto');
  if (s && !/^\/api\/images\/[a-z0-9-]+$/.test(s))
    throw new Error('Foto inválida.');
  return s;
}
function photos(v: unknown, required = false) {
  if (v == null || v === '') return [];
  const items =
    typeof v === 'string'
      ? (() => {
          try {
            return JSON.parse(v);
          } catch {
            return null;
          }
        })()
      : v;
  if (!Array.isArray(items)) {
    if (!required) return [];
    throw new Error('Fotos inválidas.');
  }
  return list(items, 10).map(photo).filter(Boolean);
}
async function requireSupplier(id: unknown, keep?: string) {
  const supplier = str(id, 'Proveedor', true);
  const row = await stmt(
    "SELECT id FROM contacts WHERE id=? AND kind='supplier' AND (archived=0 OR id=?)",
    supplier,
    keep || '',
  ).first();
  if (!row) throw new Error('Proveedor inválido.');
  return supplier;
}
/** Socio que recupera el capital (costo) de una venta. Obligatorio si hay costo. */
async function requireCostPartner(id: unknown, cost: number) {
  if (cost <= 0) return '';
  const partnerId = str(id, 'Socio que recupera el costo', true);
  const partner = await stmt(
    'SELECT id FROM partners WHERE id=? AND archived=0',
    partnerId,
  ).first();
  if (!partner)
    throw new Error('Elegí un socio activo que recupera el costo del proveedor.');
  return partnerId;
}
/** For inbound stock: whether cost was paid to supplier, and by which partner. */
async function stockCostPayment(b: Record<string, unknown>, inbound: boolean) {
  if (!inbound) return { costPaid: 0, paidPartnerId: '' };
  const costPaid = b.cost_paid === true || b.cost_paid === 1 || b.cost_paid === '1';
  if (!costPaid) return { costPaid: 0, paidPartnerId: '' };
  const partnerId = str(b.paid_partner_id, 'Socio que pagó el costo', true);
  const partner = await stmt(
    'SELECT id FROM partners WHERE id=? AND archived=0',
    partnerId,
  ).first();
  if (!partner) throw new Error('Elegí un socio activo que pagó el costo.');
  return { costPaid: 1, paidPartnerId: partnerId };
}
/** Optional supplier: empty string allowed. */
async function optionalSupplier(id: unknown, keep?: string) {
  const supplier = str(id ?? '', 'Proveedor');
  if (!supplier) return '';
  return requireSupplier(supplier, keep);
}
/** Keep product catalog supplier in sync when stock names one. */
async function syncProductSupplier(productId: string, supplierId: string) {
  if (!supplierId) return null;
  return stmt(
    'UPDATE products SET supplier_id=?,version=version+1 WHERE id=? AND (supplier_id IS NULL OR supplier_id!=?)',
    supplierId,
    productId,
    supplierId,
  );
}
/** Optional customer (contact kind=customer): empty string allowed. */
async function optionalCustomer(id: unknown, keep?: string) {
  const customer = str(id ?? '', 'Cliente');
  if (!customer) return '';
  const row = await stmt(
    "SELECT id FROM contacts WHERE id=? AND kind='customer' AND (archived=0 OR id=?)",
    customer,
    keep || '',
  ).first();
  if (!row) throw new Error('Cliente inválido.');
  return customer;
}
export function attributes(v: unknown) {
  const a = obj(v);
  if (Object.keys(a).length > 30)
    throw new Error('Demasiadas características.');
  return Object.fromEntries(
    Object.entries(a).map(([k, v]) => [
      str(k, 'Característica', true, 80),
      str(v, 'Valor', false, 150),
    ]),
  );
}
export function decode<T>(row: unknown, fields: string[]): T {
  const result = { ...obj(row) };
  for (const f of fields) result[f] = JSON.parse(String(result[f]));
  return result as T;
}
export function stmt(sql: string, ...args: (string | number | null)[]) {
  return db()
    .prepare(sql)
    .bind(...args);
}
export async function ensureAccountTables() {
  const d = db();
  await d.batch([
    d.prepare(
      'CREATE TABLE IF NOT EXISTS partners (id text PRIMARY KEY NOT NULL, name text NOT NULL, share integer NOT NULL DEFAULT 0, archived integer NOT NULL DEFAULT 0, version integer NOT NULL DEFAULT 1)',
    ),
    d.prepare(
      "CREATE TABLE IF NOT EXISTS account_expenses (id text PRIMARY KEY NOT NULL, kind text NOT NULL, amount integer NOT NULL, date text NOT NULL, notes text NOT NULL DEFAULT '', created_at text NOT NULL)",
    ),
    d.prepare(
      'CREATE INDEX IF NOT EXISTS idx_expenses_date ON account_expenses (date)',
    ),
    d.prepare(
      "CREATE TABLE IF NOT EXISTS partner_cashouts (id text PRIMARY KEY NOT NULL, partner_id text NOT NULL, amount integer NOT NULL, date text NOT NULL, notes text NOT NULL DEFAULT '', created_at text NOT NULL, FOREIGN KEY (partner_id) REFERENCES partners(id))",
    ),
    d.prepare(
      'CREATE INDEX IF NOT EXISTS idx_cashouts_partner_date ON partner_cashouts (partner_id, date)',
    ),
    d.prepare(
      "CREATE TABLE IF NOT EXISTS account_entries (id text PRIMARY KEY NOT NULL, concept text NOT NULL, detail text NOT NULL DEFAULT '', partner_id text NOT NULL, supplier_id text NOT NULL DEFAULT '', order_id text NOT NULL DEFAULT '', receipt text NOT NULL DEFAULT '', amount integer NOT NULL, currency text NOT NULL, fx_rate integer NOT NULL DEFAULT 0, amount_ars integer NOT NULL DEFAULT 0, date text NOT NULL, created_at text NOT NULL, created_by text NOT NULL DEFAULT '', FOREIGN KEY (partner_id) REFERENCES partners(id))",
    ),
    d.prepare(
      'CREATE INDEX IF NOT EXISTS idx_account_entries_date ON account_entries (date)',
    ),
  ]);
  const partnerCols = await stmt('PRAGMA table_info(partners)').all();
  const partnerNames = new Set(
    partnerCols.results.map((column) => String(obj(column).name)),
  );
  if (!partnerNames.has('share')) {
    await stmt(
      'ALTER TABLE partners ADD share integer NOT NULL DEFAULT 0',
    ).run();
  }
  await ensureActorColumns();
  const orderNames = await columnNames('orders');
  const orderAlters = [
    await addColumn(
      'orders',
      orderNames,
      'paid_partner_id',
      "paid_partner_id text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'cost_partner_id',
      "cost_partner_id text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'shipping_carrier',
      "shipping_carrier text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'shipping_amount',
      'shipping_amount integer NOT NULL DEFAULT 0',
    ),
  ].filter(Boolean);
  if (orderAlters.length)
    await d.batch(orderAlters as ReturnType<typeof stmt>[]);
  const entryNames = await columnNames('account_entries');
  const entryAlters = [
    await addColumn(
      'account_entries',
      entryNames,
      'supplier_id',
      "supplier_id text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'account_entries',
      entryNames,
      'receipt',
      "receipt text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'account_entries',
      entryNames,
      'fx_rate',
      'fx_rate integer NOT NULL DEFAULT 0',
    ),
    await addColumn(
      'account_entries',
      entryNames,
      'amount_ars',
      'amount_ars integer NOT NULL DEFAULT 0',
    ),
    await addColumn(
      'account_entries',
      entryNames,
      'order_id',
      "order_id text NOT NULL DEFAULT ''",
    ),
  ].filter(Boolean);
  if (entryAlters.length)
    await d.batch(entryAlters as ReturnType<typeof stmt>[]);
  await ensureTasksTable();
}

export async function ensureTasksTable() {
  const d = db();
  await d.batch([
    d.prepare(
      "CREATE TABLE IF NOT EXISTS tasks (id text PRIMARY KEY NOT NULL, created_at text NOT NULL, due_date text NOT NULL, partner_id text NOT NULL, supplier_id text NOT NULL DEFAULT '', customer_id text NOT NULL DEFAULT '', kind text NOT NULL, kind_other text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', done integer NOT NULL DEFAULT 0, created_by text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1, FOREIGN KEY (partner_id) REFERENCES partners(id))",
    ),
    d.prepare(
      'CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks (due_date, done)',
    ),
    d.prepare(
      'CREATE INDEX IF NOT EXISTS idx_tasks_partner ON tasks (partner_id)',
    ),
  ]);
  const taskNames = await columnNames('tasks');
  const taskAlters = [
    await addColumn(
      'tasks',
      taskNames,
      'customer_id',
      "customer_id text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'tasks',
      taskNames,
      'kind_other',
      "kind_other text NOT NULL DEFAULT ''",
    ),
  ].filter(Boolean);
  if (taskAlters.length)
    await d.batch(taskAlters as ReturnType<typeof stmt>[]);
}

async function addColumn(
  table: string,
  names: Set<string>,
  column: string,
  ddl: string,
) {
  if (names.has(column)) return null;
  return stmt(`ALTER TABLE ${table} ADD ${ddl}`);
}

async function columnNames(table: string) {
  const cols = await stmt(`PRAGMA table_info(${table})`).all();
  return new Set(cols.results.map((column) => String(obj(column).name)));
}

export async function ensureActorColumns() {
  const d = db();
  const partnerNames = await columnNames('partners');
  const orderNames = await columnNames('orders');
  const productNames = await columnNames('products');
  const movementNames = await columnNames('stock_movements');
  const cashoutNames = await columnNames('partner_cashouts');
  const alters = [
    await addColumn(
      'partners',
      partnerNames,
      'email',
      "email text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'partners',
      partnerNames,
      'password_hash',
      "password_hash text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'created_by',
      "created_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'archived_by',
      "archived_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'orders',
      orderNames,
      'deleted',
      'deleted integer NOT NULL DEFAULT 0',
    ),
    await addColumn(
      'orders',
      orderNames,
      'deleted_by',
      "deleted_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'products',
      productNames,
      'created_by',
      "created_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'products',
      productNames,
      'archived_by',
      "archived_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'stock_movements',
      movementNames,
      'created_by',
      "created_by text NOT NULL DEFAULT ''",
    ),
    await addColumn(
      'partner_cashouts',
      cashoutNames,
      'created_by',
      "created_by text NOT NULL DEFAULT ''",
    ),
  ].filter(Boolean);
  if (alters.length) await d.batch(alters as ReturnType<typeof stmt>[]);
  await d.batch([
    d.prepare(
      'CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY NOT NULL, partner_id text NOT NULL, expires_at text NOT NULL, FOREIGN KEY (partner_id) REFERENCES partners(id))',
    ),
  ]);
}
export async function ensureConfiguredCatalog() {
  const d = db();
  const productCols = await stmt('PRAGMA table_info(products)').all();
  const productNames = new Set(
    productCols.results.map((column) => String(obj(column).name)),
  );
  const movementCols = await stmt('PRAGMA table_info(stock_movements)').all();
  const movementNames = new Set(
    movementCols.results.map((column) => String(obj(column).name)),
  );
  const alters = [
    ...(!productNames.has('kind')
      ? [stmt("ALTER TABLE products ADD kind text NOT NULL DEFAULT 'sku'")]
      : []),
    ...(!movementNames.has('config')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD config text NOT NULL DEFAULT '{}'",
          ),
        ]
      : []),
    ...(!movementNames.has('config_key')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD config_key text NOT NULL DEFAULT ''",
          ),
        ]
      : []),
    ...(!movementNames.has('location')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD location text NOT NULL DEFAULT ''",
          ),
        ]
      : []),
    ...(!movementNames.has('supplier_id')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD supplier_id text NOT NULL DEFAULT ''",
          ),
        ]
      : []),
    ...(!movementNames.has('photos')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD photos text NOT NULL DEFAULT '[]'",
          ),
        ]
      : []),
    ...(!movementNames.has('cost_paid')
      ? [
          stmt(
            'ALTER TABLE stock_movements ADD cost_paid integer NOT NULL DEFAULT 0',
          ),
        ]
      : []),
    ...(!movementNames.has('paid_partner_id')
      ? [
          stmt(
            "ALTER TABLE stock_movements ADD paid_partner_id text NOT NULL DEFAULT ''",
          ),
        ]
      : []),
    ...(!productNames.has('pricing')
      ? [stmt("ALTER TABLE products ADD pricing text NOT NULL DEFAULT '{}'")]
      : []),
  ];
  if (alters.length) await d.batch(alters);
  const pending = JSON.stringify({
    Costo: 'Pendiente de definir',
    'Precio de lista': 'Pendiente de definir',
  });
  await d.batch([
    stmt(
      "INSERT OR IGNORE INTO categories(id,name,fields) VALUES('monturas','Monturas','[]')",
    ),
    stmt(
      "INSERT OR IGNORE INTO categories(id,name,fields) VALUES('cascos','Cascos','[]')",
    ),
    stmt(
      "INSERT OR IGNORE INTO categories(id,name,fields) VALUES('rodilleras','Rodilleras','[]')",
    ),
    stmt(
      "INSERT OR IGNORE INTO categories(id,name,fields) VALUES('botas','Botas','[]')",
    ),
    stmt(
      'CREATE INDEX IF NOT EXISTS idx_stock_product_config ON stock_movements (product_id, config_key)',
    ),
    stmt('DROP TRIGGER IF EXISTS stock_no_negative'),
    stmt(
      `CREATE TRIGGER stock_no_negative BEFORE INSERT ON stock_movements WHEN NEW.quantity + COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id=NEW.product_id AND COALESCE(config_key,'')=COALESCE(NEW.config_key,'')),0) < 0 BEGIN SELECT RAISE(ABORT,'STOCK_NEGATIVE'); END`,
    ),
    stmt('DROP TRIGGER IF EXISTS order_closed_stock'),
    stmt('DROP TRIGGER IF EXISTS order_reopened_stock'),
    stmt(
      "INSERT OR IGNORE INTO products(id,name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,pricing,kind) VALUES ('cfg-montura','Montura','MONTURA','monturas',NULL,0,0,1500,NULL,'none',0,'[]','[]',?,'{}','configured')",
      pending,
    ),
    stmt(
      "INSERT OR IGNORE INTO products(id,name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,pricing,kind) VALUES ('cfg-casco','Casco','CASCO','cascos',NULL,0,0,1500,NULL,'none',0,'[]','[]',?,'{}','configured')",
      pending,
    ),
    stmt(
      "INSERT OR IGNORE INTO products(id,name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,pricing,kind) VALUES ('cfg-rodillera','Rodillera','RODILLERA','rodilleras',NULL,0,0,1500,NULL,'none',0,'[]','[]',?,'{}','configured')",
      pending,
    ),
    stmt(
      "INSERT OR IGNORE INTO products(id,name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,pricing,kind) VALUES ('cfg-bota','Bota','BOTA','botas',NULL,0,0,1500,NULL,'none',0,'[]','[]',?,'{}','configured')",
      pending,
    ),
    stmt(
      "UPDATE products SET kind='configured', version=version+1 WHERE id IN ('cfg-montura','cfg-casco','cfg-rodillera','cfg-bota') AND kind!='configured'",
    ),
  ]);
}

function usesWarehouseStock(item: Item, product?: Product) {
  const kind = product ? configuredKindOf(product) : null;
  if (!kind) return true;
  return !!item.selections.from_stock;
}

function warehouseConfig(item: Item, product?: Product) {
  const kind = product ? configuredKindOf(product) : null;
  if (kind && item.selections.config) {
    const config = parseConfig(kind, item.selections.config);
    return { key: stockKey(kind, config), configJson: JSON.stringify(config) };
  }
  if (product && isCabezadaProduct(product) && item.selections.config) {
    try {
      const config = parseCabezadaConfig(item.selections.config);
      return {
        key: cabezadaStockKey(config),
        configJson: JSON.stringify(config),
      };
    } catch {
      return { key: '', configJson: '{}' };
    }
  }
  return { key: '', configJson: '{}' };
}

async function productsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, Product>();
  const rows = await stmt(
    `SELECT * FROM products WHERE id IN (${unique.map(() => '?').join(',')})`,
    ...unique,
  ).all();
  return new Map(
    rows.results.map((row) => {
      const product = decode<Product>(row, ['photos', 'options', 'attributes']);
      product.kind = product.kind === 'configured' ? 'configured' : 'sku';
      return [product.id, product] as const;
    }),
  );
}

function movementConfig(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string' && raw) {
    try {
      return obj(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === 'object') return obj(raw);
  return {};
}

async function reservedHoldsForProducts(
  productIds: string[],
  exceptOrderId: string,
) {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (!unique.length) return [] as StockHold[];
  const products = await productsByIds(unique);
  const rows = await stmt(
    `SELECT o.id AS order_id, o.number AS order_number, i.product_id, i.quantity, i.selections
     FROM order_items i
     JOIN orders o ON o.id = i.order_id
     WHERE o.archived=0 AND o.deleted=0 AND o.status NOT IN ('entregado','cotización') AND o.id != ?
     AND i.product_id IN (${unique.map(() => '?').join(',')})`,
    exceptOrderId,
    ...unique,
  ).all<{
    order_id: string;
    order_number: string;
    product_id: string;
    quantity: number;
    selections: string;
  }>();
  const holds: StockHold[] = [];
  for (const row of rows.results) {
    const selections =
      typeof row.selections === 'string'
        ? (JSON.parse(row.selections) as Item['selections'])
        : row.selections;
    const product = products.get(row.product_id);
    const hold = itemStockHold(
      { product_id: row.product_id, quantity: row.quantity, selections },
      product ? configuredKindOf(product) : null,
      { id: row.order_id, number: row.order_number },
    );
    if (hold) holds.push(hold);
  }
  return holds;
}

async function assertFromStockAvailable(orderId: string, items: Item[]) {
  const fromStock = items.filter((item) => item.selections.from_stock);
  if (!fromStock.length) return;
  const productIds = [...new Set(fromStock.map((item) => item.product_id))];
  const [products, holds, movementRows] = await Promise.all([
    productsByIds(productIds),
    reservedHoldsForProducts(productIds, orderId),
    stmt(
      `SELECT product_id, config_key, quantity, location, supplier_id, config
       FROM stock_movements
       WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      ...productIds,
    ).all<{
      product_id: string;
      config_key: string | null;
      quantity: number;
      location: string | null;
      supplier_id: string | null;
      config: unknown;
    }>(),
  ]);
  const movements = movementRows.results.map((row) => ({
    product_id: row.product_id,
    config_key: row.config_key || '',
    quantity: row.quantity,
    location: row.location || '',
    supplier_id: row.supplier_id || '',
    config: movementConfig(row.config),
  }));
  const used = new Map<string, number>();
  for (const item of fromStock) {
    const product = products.get(item.product_id);
    const hold = itemStockHold(
      item,
      product ? configuredKindOf(product) : null,
      { id: orderId, number: '' },
    );
    if (!hold) continue;
    const rows = stockAvailability(movements, holds, item.product_id);
    const row = rows.find(
      (candidate) =>
        candidate.config_key === hold.configKey &&
        (!hold.location || candidate.location === hold.location),
    );
    const key = `${hold.productId}\t${hold.configKey}\t${hold.location}`;
    const taken = used.get(key) || 0;
    if (item.quantity > (row?.available || 0) - taken)
      throw new Error(
        `Esa unidad de ${item.name} ya está reservada para otro pedido.`,
      );
    used.set(key, taken + item.quantity);
  }
}

async function orderWarehouseMoves(
  order: { id: string; number: string },
  items: Item[],
  direction: 'close' | 'reopen',
  actor: { id: string },
) {
  const now = new Date().toISOString();
  if (direction === 'reopen') {
    const closes = await stmt(
      'SELECT product_id, quantity, config, config_key, location, supplier_id FROM stock_movements WHERE order_id=? AND quantity < 0',
      order.id,
    ).all<{
      product_id: string;
      quantity: number;
      config: unknown;
      config_key: string | null;
      location: string | null;
      supplier_id: string | null;
    }>();
    return closes.results.map((row) =>
      stmt(
        'INSERT INTO stock_movements (id,product_id,order_id,quantity,reason,created_at,config,config_key,location,supplier_id,photos,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        crypto.randomUUID(),
        row.product_id,
        order.id,
        Math.abs(row.quantity),
        `Reapertura ${order.number}`,
        now,
        typeof row.config === 'string'
          ? row.config
          : JSON.stringify(movementConfig(row.config)),
        row.config_key || '',
        row.location || '',
        row.supplier_id || '',
        '[]',
        actor.id,
      ),
    );
  }
  const already = await stmt(
    'SELECT id FROM stock_movements WHERE order_id=? AND quantity < 0 LIMIT 1',
    order.id,
  ).first();
  if (already) return [];
  const products = await productsByIds(items.map((item) => item.product_id));
  const statements = [];
  for (const item of items) {
    const product = products.get(item.product_id);
    if (!usesWarehouseStock(item, product)) continue;
    const { key, configJson } = warehouseConfig(item, product);
    const preferred = item.selections.location || '';
    const have = await stmt(
      preferred
        ? "SELECT COALESCE(SUM(quantity),0) qty FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND COALESCE(location,'')=?"
        : "SELECT COALESCE(SUM(quantity),0) qty FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=?",
      item.product_id,
      key,
      ...(preferred ? [preferred] : []),
    ).first<{ qty: number }>();
    if ((have?.qty || 0) < item.quantity)
      throw new Error(
        `Stock insuficiente para ${item.name}. Registrá un ingreso de esa combinación antes de cerrar.`,
      );
    let location = preferred;
    if (!location) {
      const place = await stmt(
        "SELECT location FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? GROUP BY location HAVING SUM(quantity) >= ? LIMIT 1",
        item.product_id,
        key,
        item.quantity,
      ).first<{ location: string }>();
      location = place?.location || '';
    }
    statements.push(
      stmt(
        'INSERT INTO stock_movements (id,product_id,order_id,quantity,reason,created_at,config,config_key,location,supplier_id,photos,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        crypto.randomUUID(),
        item.product_id,
        order.id,
        -item.quantity,
        `Entrega ${order.number}`,
        now,
        configJson,
        key,
        location,
        item.selections.supplier_id || '',
        '[]',
        actor.id,
      ),
    );
  }
  return statements;
}

export async function allData() {
  await ensureAccountTables();
  await ensureConfiguredCatalog();
  const d = db();
  const [c, p, o, i, m, cat, s, partners, expenses, cashouts, entries, tasks] =
    await d.batch([
    d.prepare('SELECT * FROM contacts ORDER BY name'),
    d.prepare(
      'SELECT p.*,COALESCE((SELECT SUM(quantity) FROM stock_movements m WHERE m.product_id=p.id),0) stock FROM products p ORDER BY name',
    ),
    d.prepare('SELECT * FROM orders ORDER BY date DESC,number DESC'),
    d.prepare('SELECT * FROM order_items'),
    d.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC'),
    d.prepare('SELECT * FROM categories ORDER BY name'),
    d.prepare('SELECT currency FROM settings WHERE id=1'),
    d.prepare('SELECT * FROM partners ORDER BY name'),
    d.prepare(
      'SELECT * FROM account_expenses ORDER BY date DESC, created_at DESC',
    ),
    d.prepare(
      'SELECT * FROM partner_cashouts ORDER BY date DESC, created_at DESC',
    ),
    d.prepare(
      'SELECT * FROM account_entries ORDER BY date DESC, created_at DESC',
    ),
    d.prepare(
      'SELECT * FROM tasks ORDER BY done ASC, due_date ASC, created_at DESC',
    ),
  ]);
  const items = i.results.map((r) => decode<Item>(r, ['selections']));
  return {
    contacts: c.results.map((r) => decode<Contact>(r, ['fiscal'])),
    products: p.results.map((r) => {
      const raw = obj(r);
      const product = decode<Product>(
        { ...raw, pricing: raw.pricing ?? '{}' },
        ['photos', 'options', 'attributes', 'pricing'],
      );
      return {
        ...product,
        kind: product.kind === 'configured' ? 'configured' : 'sku',
        pricing: parsePricing(product.pricing),
      };
    }),
    orders: o.results.map((r) => {
      const row = obj(r);
      return {
        ...row,
        shipping_carrier:
          typeof row.shipping_carrier === 'string' ? row.shipping_carrier : '',
        shipping_amount:
          typeof row.shipping_amount === 'number' ? row.shipping_amount : 0,
        paid_partner_id:
          typeof row.paid_partner_id === 'string' ? row.paid_partner_id : '',
        cost_partner_id:
          typeof row.cost_partner_id === 'string' ? row.cost_partner_id : '',
        items: items.filter((item) => item.order_id === row.id),
      };
    }),
    movements: m.results.map((r) => {
      const row = obj(r);
      let config: Record<string, unknown> = {};
      if (typeof row.config === 'string' && row.config) {
        try {
          config = obj(JSON.parse(rewriteMonturaGamuzaText(row.config)));
        } catch {
          config = {};
        }
      } else if (row.config && typeof row.config === 'object') {
        config = obj(row.config);
        if (config.material === 'gamuza') config.material = 'descarne';
        if (config.materialAsiento === 'gamuza')
          config.materialAsiento = 'descarne';
      }
      return {
        ...row,
        config,
        config_key:
          typeof row.config_key === 'string'
            ? rewriteMonturaGamuzaText(row.config_key)
            : '',
        location: typeof row.location === 'string' ? row.location : '',
        supplier_id:
          typeof row.supplier_id === 'string' ? row.supplier_id : '',
        photos: photos(row.photos),
        cost_paid: Number(row.cost_paid) ? 1 : 0,
        paid_partner_id:
          typeof row.paid_partner_id === 'string' ? row.paid_partner_id : '',
      };
    }),
    categories: cat.results.map((r) => decode<Category>(r, ['fields'])),
    partners: partners.results.map((row) => {
      const partner = obj(row);
      const hash = String(partner.password_hash || '');
      delete partner.password_hash;
      return {
        ...partner,
        share: Number(partner.share) || 0,
        email: String(partner.email || ''),
        has_password: hash ? 1 : 0,
      } as Partner;
    }),
    expenses: expenses.results as AccountExpense[],
    cashouts: cashouts.results as PartnerCashout[],
    entries: (entries.results as AccountEntry[]).map((row) => ({
      ...row,
      supplier_id: typeof row.supplier_id === 'string' ? row.supplier_id : '',
      order_id: typeof row.order_id === 'string' ? row.order_id : '',
      receipt: typeof row.receipt === 'string' ? row.receipt : '',
      fx_rate: Number(row.fx_rate) || 0,
      amount_ars: Number(row.amount_ars) || 0,
    })),
    tasks: (tasks.results as Task[]).map((row) => ({
      ...row,
      supplier_id: typeof row.supplier_id === 'string' ? row.supplier_id : '',
      customer_id: typeof row.customer_id === 'string' ? row.customer_id : '',
      kind_other: typeof row.kind_other === 'string' ? row.kind_other : '',
      description: typeof row.description === 'string' ? row.description : '',
      done: Number(row.done) ? 1 : 0,
      version: Number(row.version) || 1,
      created_by: typeof row.created_by === 'string' ? row.created_by : '',
    })),
    currency: s.results[0] ? obj(s.results[0]).currency : 'ARS',
  };
}
export async function contact(b: Record<string, unknown>) {
  const kind = choice(b.kind, ['supplier', 'customer'], 'Tipo');
  const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
  const name = str(b.name, 'Nombre', true, 150);
  const email = str(b.email, 'Email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Email inválido.');
  const website = str(b.website, 'Web');
  if (website && !/^https?:\/\/[^\s]+$/.test(website))
    throw new Error('La web debe comenzar con https:// o http://.');
  const group = str(b.whatsapp_group || '', 'Grupo WhatsApp');
  const groupUrl = group ? whatsappGroup(group) : '';
  if (group && !groupUrl)
    throw new Error(
      'Ingresá un enlace de grupo de WhatsApp (chat.whatsapp.com).',
    );
  const fiscal = obj(b.fiscal);
  const taxId = str(fiscal.taxId || '', 'CUIT/CUIL');
  if (taxId && !/^\d{11}$/.test(taxId.replace(/-/g, '')))
    throw new Error('CUIT/CUIL debe tener 11 dígitos.');
  const f = {
    name: str(fiscal.name || '', 'Razón social'),
    taxId,
    address: str(fiscal.address || '', 'Domicilio fiscal'),
    vat: choice(
      fiscal.vat || 'Consumidor final',
      [
        'Consumidor final',
        'Responsable inscripto',
        'Monotributista',
        'Exento',
        'No informado',
      ],
      'Condición IVA',
    ),
  };
  const values = [
    kind,
    name,
    str(b.contact, 'Contacto'),
    str(b.title || '', 'Título'),
    str(b.address, 'Dirección'),
    str(b.phone, 'Teléfono'),
    email,
    website,
    groupUrl || '',
    str(b.notes, 'Notas', false, 2000),
    JSON.stringify(f),
  ];
  if (b.id) {
    const result = await stmt(
      'UPDATE contacts SET kind=?,name=?,contact=?,title=?,address=?,phone=?,email=?,website=?,whatsapp_group=?,notes=?,fiscal=?,version=? WHERE id=? AND kind=? AND archived=0',
      ...values,
      integer(b.version, 'Versión') + 1,
      id,
      kind,
    ).run();
    if (!result.meta.changes) throw new Error('Contacto no disponible.');
  } else
    await stmt(
      'INSERT INTO contacts (kind,name,contact,title,address,phone,email,website,whatsapp_group,notes,fiscal,id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      ...values,
      id,
    ).run();
  return { id };
}
export async function product(
  b: Record<string, unknown>,
  actor?: { id: string },
) {
  const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
  const category = str(b.category, 'Categoría', true);
  if (!(await stmt('SELECT id FROM categories WHERE id=?', category).first()))
    throw new Error('Categoría inválida.');
  const supplier = b.supplier_id ? str(b.supplier_id, 'Proveedor') : null;
  if (
    supplier &&
    !(await stmt(
      "SELECT id FROM contacts WHERE id=? AND kind='supplier' AND archived=0",
      supplier,
    ).first())
  )
    throw new Error('Proveedor inválido.');
  const options = list(b.options, 30).map((v) => {
    const o = obj(v);
    return {
      id: str(o.id, 'ID opción', true),
      name: str(o.name, 'Nombre de opción', true, 100),
      price: integer(o.price),
      cost: integer(o.cost),
      photo: photo(o.photo),
    };
  });
  if (new Set(options.map((o) => o.id)).size !== options.length)
    throw new Error('Opciones duplicadas.');
  const photos = list(b.photos, 10).map(photo);
  const pk = choice(b.promo_kind, ['none', 'percent', 'manual'], 'Promoción');
  const pv = integer(
    b.promo_value,
    'Promoción',
    pk === 'percent' ? 10000 : 1e12,
  );
  const price = integer(b.price, 'Precio');
  if (pk === 'manual' && pv > price)
    throw new Error('El precio promocional no puede superar lista.');
  const ffPrice =
    b.ff_price === null || b.ff_price === undefined
      ? null
      : integer(b.ff_price, 'Precio F&F');
  if (ffPrice !== null && ffPrice > price)
    throw new Error('El precio F&F no puede superar lista.');
  const cost = integer(b.cost, 'Costo');
  const productAttributes = attributes(b.attributes);
  if (cost > 0 && productAttributes.Costo === 'Pendiente de definir')
    delete productAttributes.Costo;
  if (
    price > 0 &&
    productAttributes['Precio de lista'] === 'Pendiente de definir'
  )
    delete productAttributes['Precio de lista'];
  if (
    ffPrice !== null &&
    productAttributes['Precio F&F'] === 'Pendiente de definir'
  )
    delete productAttributes['Precio F&F'];
  const kind =
    id === TEMPLATE_IDS.rodilleras ||
    id === TEMPLATE_IDS.botas ||
    category === 'monturas' ||
    category === 'cascos'
      ? 'configured'
      : 'sku';
  if (kind === 'configured') {
    const expected =
      category === 'cascos'
        ? TEMPLATE_IDS.cascos
        : category === 'rodilleras'
          ? TEMPLATE_IDS.rodilleras
          : category === 'botas'
            ? TEMPLATE_IDS.botas
            : TEMPLATE_IDS.monturas;
    if (!b.id || id !== expected)
      throw new Error(
        'Monturas, cascos, rodilleras y botas se configuran desde Productos.',
      );
  }
  const pricingJson = JSON.stringify(
    kind === 'configured' ? parsePricing(b.pricing) : {},
  );
  const values = [
    str(b.name, 'Nombre', true, 150),
    str(b.sku, 'SKU', true, 80).toUpperCase(),
    category,
    supplier,
    cost,
    price,
    integer(b.ff_discount, 'F&F', 10000),
    ffPrice,
    pk,
    pv,
    JSON.stringify(photos),
    JSON.stringify(options),
    JSON.stringify(productAttributes),
    pricingJson,
    kind,
  ];
  if (b.id) {
    const result = await stmt(
      'UPDATE products SET name=?,sku=?,category=?,supplier_id=?,cost=?,price=?,ff_discount=?,ff_price=?,promo_kind=?,promo_value=?,photos=?,options=?,attributes=?,pricing=?,kind=?,version=? WHERE id=? AND archived=0',
      ...values,
      integer(b.version, 'Versión') + 1,
      id,
    ).run();
    if (!result.meta.changes) throw new Error('Producto no disponible.');
  } else {
    if (!actor?.id) throw new Error('Tenés que ingresar.');
    await stmt(
      'INSERT INTO products(name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,pricing,kind,id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      ...values,
      id,
      actor.id,
    ).run();
  }
  return { id };
}
async function customerIdForOrder(b: Record<string, unknown>) {
  const draft =
    b.customer && typeof b.customer === 'object' && !Array.isArray(b.customer)
      ? (b.customer as Record<string, unknown>)
      : null;
  if (draft) {
    const created = await contact({
      kind: 'customer',
      name: draft.name,
      contact: draft.contact || '',
      title: '',
      phone: draft.phone || '',
      email: draft.email || '',
      address: draft.address || '',
      website: '',
      whatsapp_group: '',
      notes: draft.notes || '',
      fiscal: {},
    });
    return created.id;
  }
  const customer = str(b.customer_id, 'Cliente', true);
  if (customer === '__new__')
    throw new Error('Completá los datos del cliente nuevo.');
  if (
    !(await stmt(
      "SELECT id FROM contacts WHERE id=? AND kind='customer' AND archived=0",
      customer,
    ).first())
  )
    throw new Error('Seleccioná un cliente activo.');
  return customer;
}

export async function saveOrder(
  b: Record<string, unknown>,
  actor?: { id: string },
) {
  if (!actor?.id) throw new Error('Tenés que ingresar.');
  const d = db();
  const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
  const existing = b.id
    ? await stmt(
        'SELECT * FROM orders WHERE id=? AND archived=0 AND deleted=0',
        id,
      ).first<Order>()
    : null;
  if (b.id && !existing) throw new Error('Pedido no disponible.');
  if (existing && orderIsLocked(existing.status))
    throw new Error('Reabrí el pedido antes de editarlo.');
  const customer = await customerIdForOrder(b);
  const previous = existing
    ? (
        await stmt('SELECT * FROM order_items WHERE order_id=?', id).all()
      ).results.map((r) => decode<Item>(r, ['selections']))
    : [];
  const itemInputs = list(b.items, 50);
  if (!itemInputs.length) throw new Error('Agregá al menos un producto.');
  const used = new Set<string>();
  const items: Item[] = [];
  for (const value of itemInputs) {
    const input = obj(value);
    const old = previous.find((x) => x.id === input.id);
    let snapshot: Pick<
      Item,
      'product_id' | 'name' | 'sku' | 'selections' | 'unit_price' | 'unit_cost'
    >;
    if (old) {
      const supplier_id = old.selections.from_stock
        ? old.selections.supplier_id ||
          (await requireSupplier(
            input.supplier_id || old.selections.supplier_id,
            old.selections.supplier_id,
          ))
        : await requireSupplier(
            input.supplier_id || old.selections.supplier_id,
            old.selections.supplier_id,
          );
      snapshot = {
        ...old,
        selections: {
          ...old.selections,
          supplier_id,
        },
      };
      if (!old.selections.from_stock) {
        const row = await stmt(
          'SELECT * FROM products WHERE id=?',
          old.product_id,
        ).first();
        if (row) {
          const rawProduct = obj(row);
          const p = decode<Product>(
            { ...rawProduct, pricing: rawProduct.pricing ?? '{}' },
            ['options', 'attributes', 'photos', 'pricing'],
          );
          p.kind = p.kind === 'configured' ? 'configured' : 'sku';
          p.pricing = parsePricing(p.pricing);
          const configured = configuredKindOf(p);
          if (configured) {
            const config = parseConfig(configured, input.config);
            const prices = adjustedConfiguredPrices(
              configured,
              old.selections.config,
              config,
              p.pricing,
              old.unit_price,
              old.unit_cost,
            );
            snapshot = {
              product_id: old.product_id,
              name: old.name,
              sku: old.sku,
              selections: {
                options: [],
                attributes: configLabels(configured, config),
                config,
                supplier_id,
              },
              unit_price: integer(prices.unit_price),
              unit_cost: integer(prices.unit_cost),
            };
          }
        }
      }
    } else {
      const row = await stmt(
        'SELECT * FROM products WHERE id=? AND archived=0',
        str(input.product_id, 'Producto', true),
      ).first();
      if (!row) throw new Error('Producto no disponible.');
      const rawProduct = obj(row);
      const p = decode<Product>(
        { ...rawProduct, pricing: rawProduct.pricing ?? '{}' },
        ['options', 'attributes', 'photos', 'pricing'],
      );
      p.kind = p.kind === 'configured' ? 'configured' : 'sku';
      p.pricing = parsePricing(p.pricing);
      if (p.attributes.Costo === 'Pendiente de definir')
        throw new Error(`Completá el costo de ${p.name} antes de venderlo.`);
      if (p.attributes['Precio de lista'] === 'Pendiente de definir')
        throw new Error(
          `Completá el precio de lista de ${p.name} antes de venderlo.`,
        );
      const mode = choice(
        input.price_mode || 'list',
        ['list', 'ff', 'promo', 'manual'],
        'Precio',
      );
      if (
        mode === 'ff' &&
        p.attributes['Precio F&F'] === 'Pendiente de definir'
      )
        throw new Error(`Completá el precio F&F de ${p.name}.`);
      const configured = configuredKindOf(p);
      if (configured) {
        const config = parseConfig(configured, input.config);
        const extras = extraTotals(configured, config, p.pricing);
        if (extras.pending)
          throw new Error(
            `Completá los precios de ${p.name} en Productos antes de venderlo.`,
          );
        const base =
          mode === 'manual'
            ? integer(input.manual_price, 'Precio manual')
            : mode === 'ff'
              ? (p.ff_price ?? discounted(p.price, p.ff_discount))
              : mode === 'promo'
                ? promoPrice(p)
                : p.price;
        snapshot = {
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          selections: {
            options: [],
            attributes: configLabels(configured, config),
            config,
            supplier_id: await requireSupplier(input.supplier_id),
            from_stock: !!input.from_stock || undefined,
            stock_qty: input.from_stock
              ? integer(input.stock_qty, 'Stock', 10000)
              : undefined,
            location: input.from_stock
              ? str(input.location || '', 'Ubicación', false, 40) || undefined
              : undefined,
          },
          unit_price: integer(base + extras.price),
          unit_cost: integer(p.cost + extras.cost),
        };
      } else {
        const ids = list(input.option_ids || [], 30).map((v) =>
          str(v, 'Opción', true),
        );
        if (new Set(ids).size !== ids.length)
          throw new Error('Opción repetida.');
        const options: Option[] = ids.map((optionId) => {
          const found = p.options.find((o) => o.id === optionId);
          if (!found) throw new Error('Opción no disponible.');
          return found;
        });
        const selected = attributes(input.attributes || {});
        const cat = await stmt(
          'SELECT * FROM categories WHERE id=?',
          p.category,
        ).first();
        const fields = decode<Category>(cat, ['fields']).fields;
        for (const field of fields) {
          if (field.values.length && !selected[field.name])
            throw new Error(`Elegí ${field.name}.`);
        }
        for (const [k, v] of Object.entries(selected)) {
          const field = fields.find((f) => f.name === k);
          if (!field || (field.values.length && !field.values.includes(v)))
            throw new Error('Característica seleccionada inválida.');
          if (p.attributes[k] && p.attributes[k] !== v)
            throw new Error(`La combinación no corresponde al SKU ${p.sku}.`);
        }
        const base =
          mode === 'manual'
            ? integer(input.manual_price, 'Precio manual')
            : mode === 'ff'
              ? (p.ff_price ?? discounted(p.price, p.ff_discount))
              : mode === 'promo'
                ? promoPrice(p)
                : p.price;
        const cabezada = isCabezadaProduct(p)
          ? parseCabezadaConfig(input.config)
          : null;
        snapshot = {
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          selections: {
            options,
            attributes: cabezada
              ? {
                  ...selected,
                  Riendas: cabezadaRiendasLabel(cabezada),
                }
              : selected,
            ...(cabezada ? { config: cabezada } : {}),
            supplier_id: await requireSupplier(input.supplier_id),
            from_stock: !!input.from_stock || undefined,
            stock_qty: input.from_stock
              ? integer(input.stock_qty, 'Stock', 10000)
              : undefined,
            location: input.from_stock
              ? str(input.location || '', 'Ubicación', false, 40) || undefined
              : undefined,
          },
          unit_price: integer(base + options.reduce((s, o) => s + o.price, 0)),
          unit_cost: integer(p.cost + options.reduce((s, o) => s + o.cost, 0)),
        };
      }
    }
    const itemId = old?.id || crypto.randomUUID();
    if (used.has(itemId)) throw new Error('Ítem duplicado.');
    used.add(itemId);
    const quantity = integer(input.quantity, 'Cantidad', 10000);
    const stockCap = snapshot.selections.stock_qty;
    if (
      snapshot.selections.from_stock &&
      stockCap &&
      quantity > stockCap
    )
      throw new Error('La cantidad no puede superar el stock de esa unidad.');
    const saleMode = choice(
      input.discount_mode || snapshot.selections.sale_mode || 'percent',
      ['percent', 'fixed'],
      'Ajuste del ítem',
    ) as 'percent' | 'fixed';
    let discount = 0;
    let unitPrice = snapshot.unit_price;
    let totals: ReturnType<typeof lineTotals>;
    if (saleMode === 'fixed') {
      const saleUnit = integer(
        input.sale_price !== undefined ? input.sale_price : input.discount,
        'Precio fijo de venta',
      );
      if (!saleUnit)
        throw new Error('El precio fijo de venta debe ser mayor a cero.');
      unitPrice = saleUnit;
      discount = 0;
      totals = fixedLineTotals(saleUnit, snapshot.unit_cost, quantity);
    } else {
      discount = integer(input.discount, 'Descuento', 10000);
      totals = lineTotals(
        snapshot.unit_price,
        snapshot.unit_cost,
        quantity,
        discount,
      );
    }
    items.push({
      ...snapshot,
      unit_price: unitPrice,
      selections: {
        ...snapshot.selections,
        sale_mode: saleMode,
      },
      id: itemId,
      order_id: id,
      quantity,
      discount,
      total: totals.total,
      cost: totals.cost,
    });
  }
  await assertFromStockAvailable(id, items);
  const total = integer(items.reduce((s, i) => s + i.total, 0));
  const cost = integer(items.reduce((s, i) => s + i.cost, 0));
  const paid = integer(b.paid, 'Cobrado');
  if (paid > total) throw new Error('El cobro no puede superar el total.');
  const paidPartnerId =
    paid > 0
      ? str(b.paid_partner_id, 'Socio que recibió el cobro', true)
      : '';
  if (paid > 0) {
    const partner = await stmt(
      'SELECT id FROM partners WHERE id=? AND archived=0',
      paidPartnerId,
    ).first();
    if (!partner) throw new Error('Elegí un socio activo que recibió el cobro.');
  }
  const orderDate = date(b.date, true);
  const delivery = date(b.delivery);
  if (delivery && delivery < orderDate)
    throw new Error('La entrega no puede ser anterior al pedido.');
  const status = choice(b.status, [...ORDER_STATUSES], 'Estado');
  const costPartnerId = orderIsQuote(status)
    ? ''
    : await requireCostPartner(
        b.cost_partner_id ?? existing?.cost_partner_id,
        cost,
      );
  const invoice = integer(b.invoice, 'Facturación', 1);
  const notes = str(b.notes, 'Notas', false, 2000);
  let shippingCarrier = existing?.shipping_carrier || '';
  let shippingAmount = existing?.shipping_amount || 0;
  if (b.shipping_carrier !== undefined) {
    if (String(b.shipping_carrier || '').trim()) {
      shippingCarrier = choice(b.shipping_carrier, ['DHL', 'FedEx'], 'Carrier');
      shippingAmount = integer(
        b.shipping_amount !== undefined ? b.shipping_amount : shippingAmount,
        'Costo de envío',
      );
    } else {
      shippingCarrier = '';
      shippingAmount = 0;
    }
  } else if (b.shipping_amount !== undefined && shippingCarrier) {
    shippingAmount = integer(b.shipping_amount, 'Costo de envío');
  }
  const currency =
    existing?.currency ||
    (
      await stmt('SELECT currency FROM settings WHERE id=1').first<{
        currency: string;
      }>()
    )?.currency ||
    'ARS';
  const number =
    existing?.number ||
    `IC-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const statements: D1PreparedStatement[] = [];
  if (existing) {
    statements.push(
      stmt(
        'UPDATE orders SET customer_id=?,date=?,delivery=?,paid=?,paid_partner_id=?,cost_partner_id=?,invoice=?,notes=?,shipping_carrier=?,shipping_amount=?,total=?,cost=?,version=? WHERE id=?',
        customer,
        orderDate,
        delivery,
        paid,
        paidPartnerId,
        costPartnerId,
        invoice,
        notes,
        shippingCarrier,
        shippingAmount,
        total,
        cost,
        integer(b.version, 'Versión') + 1,
        id,
      ),
    );
    statements.push(stmt('DELETE FROM order_items WHERE order_id=?', id));
  } else {
    statements.push(
      stmt(
        "INSERT INTO orders(id,number,customer_id,date,delivery,status,paid,paid_partner_id,cost_partner_id,invoice,notes,currency,shipping_carrier,shipping_amount,total,cost,created_by) VALUES (?,?,?,?,?,'nuevo',?,?,?,?,?,?,?,?,?,?,?)",
        id,
        number,
        customer,
        orderDate,
        delivery,
        paid,
        paidPartnerId,
        costPartnerId,
        invoice,
        notes,
        currency,
        shippingCarrier,
        shippingAmount,
        total,
        cost,
        actor.id,
      ),
    );
  }
  for (const i of items)
    statements.push(
      stmt(
        'INSERT INTO order_items (id,order_id,product_id,name,sku,selections,unit_price,unit_cost,quantity,discount,total,cost) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        i.id,
        id,
        i.product_id,
        i.name,
        i.sku,
        JSON.stringify(i.selections),
        i.unit_price,
        i.unit_cost,
        i.quantity,
        i.discount,
        i.total,
        i.cost,
      ),
    );
  if (status !== (existing?.status || 'nuevo')) {
    statements.push(
      stmt(
        'UPDATE orders SET status=?,version=version+1 WHERE id=?',
        status,
        id,
      ),
    );
    if (!orderIsDelivered(existing?.status || 'nuevo') && orderIsDelivered(status)) {
      statements.push(
        ...(await orderWarehouseMoves(
          { id, number },
          items,
          'close',
          actor,
        )),
      );
    } else if (
      orderIsDelivered(existing?.status || '') &&
      !orderIsDelivered(status)
    ) {
      statements.push(
        ...(await orderWarehouseMoves({ id, number }, items, 'reopen', actor)),
      );
    }
  }
  await d.batch(statements);
  return { id, number };
}
export async function patchOrder(
  b: Record<string, unknown>,
  actor: { id: string },
) {
  const id = str(b.id, 'ID', true);
  const existing = await stmt(
    'SELECT * FROM orders WHERE id=? AND archived=0 AND deleted=0',
    id,
  ).first<Order>();
  if (!existing) throw new Error('Pedido no disponible.');
  const version = integer(b.version, 'Versión') + 1;
  if (b.status !== undefined) {
    const status = choice(b.status, [...ORDER_STATUSES], 'Estado');
    const statements = [
      stmt(
        'UPDATE orders SET status=?,version=? WHERE id=?',
        status,
        version,
        id,
      ),
    ];
    if (existing.status !== status) {
      const items = (
        await stmt('SELECT * FROM order_items WHERE order_id=?', id).all()
      ).results.map((row) => decode<Item>(row, ['selections']));
      if (!orderIsDelivered(existing.status) && orderIsDelivered(status)) {
        statements.push(
          ...(await orderWarehouseMoves(existing, items, 'close', actor)),
        );
      } else if (orderIsDelivered(existing.status) && !orderIsDelivered(status)) {
        statements.push(
          ...(await orderWarehouseMoves(existing, items, 'reopen', actor)),
        );
      }
    }
    const result = await db().batch(statements);
    if (!result[0]?.meta.changes) throw new Error('Pedido no disponible.');
    return { ok: true };
  }
  if (b.delivery !== undefined) {
    const delivery = date(b.delivery);
    if (delivery && delivery < existing.date)
      throw new Error('La entrega no puede ser anterior al pedido.');
    const result = await stmt(
      'UPDATE orders SET delivery=?,version=? WHERE id=?',
      delivery,
      version,
      id,
    ).run();
    if (!result.meta.changes) throw new Error('Pedido no disponible.');
    return { ok: true };
  }
  if (b.invoice !== undefined) {
    const invoice = integer(b.invoice, 'Facturación', 1);
    const result = await stmt(
      'UPDATE orders SET invoice=?,version=? WHERE id=?',
      invoice,
      version,
      id,
    ).run();
    if (!result.meta.changes) throw new Error('Pedido no disponible.');
    return { ok: true };
  }
  if (b.shipping_carrier !== undefined || b.shipping_amount !== undefined) {
    const shippingCarrier =
      b.shipping_carrier != null && String(b.shipping_carrier).trim()
        ? choice(b.shipping_carrier, ['DHL', 'FedEx'], 'Carrier')
        : '';
    const shippingAmount = shippingCarrier
      ? integer(
          b.shipping_amount !== undefined
            ? b.shipping_amount
            : existing.shipping_amount,
          'Costo de envío',
        )
      : 0;
    const result = await stmt(
      'UPDATE orders SET shipping_carrier=?,shipping_amount=?,version=? WHERE id=?',
      shippingCarrier,
      shippingAmount,
      version,
      id,
    ).run();
    if (!result.meta.changes) throw new Error('Pedido no disponible.');
    return { ok: true };
  }
  const pay = choice(
    b.pay,
    ['no pagado', 'pago parcial', 'pagado'],
    'Pago',
  );
  const paid =
    pay === 'pagado'
      ? existing.total
      : pay === 'no pagado'
        ? 0
        : integer(b.paid, 'Cobrado');
  if (pay === 'pago parcial' && (!paid || paid >= existing.total))
    throw new Error('El pago parcial tiene que ser mayor a 0 y menor al total.');
  if (paid > existing.total)
    throw new Error('El cobro no puede superar el total.');
  const paidPartnerId =
    paid > 0
      ? str(b.paid_partner_id || existing.paid_partner_id, 'Socio que recibió el cobro', true)
      : '';
  if (paid > 0) {
    const partner = await stmt(
      'SELECT id FROM partners WHERE id=? AND archived=0',
      paidPartnerId,
    ).first();
    if (!partner) throw new Error('Elegí un socio activo que recibió el cobro.');
  }
  const costPartnerId =
    paid > 0
      ? await requireCostPartner(
          b.cost_partner_id ?? existing.cost_partner_id,
          Number(existing.cost) || 0,
        )
      : typeof existing.cost_partner_id === 'string'
        ? existing.cost_partner_id
        : '';
  const result = await stmt(
    'UPDATE orders SET paid=?,paid_partner_id=?,cost_partner_id=?,version=? WHERE id=?',
    paid,
    paidPartnerId,
    costPartnerId,
    version,
    id,
  ).run();
  if (!result.meta.changes) throw new Error('Pedido no disponible.');
  return { ok: true };
}
const keptAttributes = new Set([
  'Costo',
  'Precio de lista',
  'Precio F&F',
  'SKU original',
]);
async function productsBulk(b: Record<string, unknown>) {
  const ids = [
    ...new Set(list(b.ids, 200).map((value) => str(value, 'Producto', true))),
  ];
  if (!ids.length) throw new Error('Seleccioná al menos un producto.');
  const kind = choice(b.kind, ['category', 'supplier', 'price'], 'Acción');
  const placeholders = ids.map(() => '?').join(',');
  const found = (
    await stmt(
      `SELECT * FROM products WHERE id IN (${placeholders})`,
      ...ids,
    ).all()
  ).results.map((row) =>
    decode<Product>(row, ['photos', 'options', 'attributes']),
  );
  if (found.length !== ids.length)
    throw new Error(
      'Algunos productos ya no están disponibles. Recargá la lista.',
    );
  const byId = new Map(found.map((product) => [product.id, product]));
  const ordered = ids.map((id) => byId.get(id)!);
  const statements = [];
  let updated = 0;
  let skipped = 0;
  if (kind === 'category') {
    const category = str(b.category, 'Categoría', true);
    if (!(await stmt('SELECT id FROM categories WHERE id=?', category).first()))
      throw new Error('Categoría inválida.');
    for (const product of ordered) {
      if (product.category === category) {
        skipped += 1;
        continue;
      }
      const attributes = Object.fromEntries(
        Object.entries(product.attributes).filter(([key]) =>
          keptAttributes.has(key),
        ),
      );
      statements.push(
        stmt(
          'UPDATE products SET category=?,attributes=?,version=? WHERE id=?',
          category,
          JSON.stringify(attributes),
          product.version + 1,
          product.id,
        ),
      );
      updated += 1;
    }
  } else if (kind === 'supplier') {
    const supplier = b.supplier_id ? str(b.supplier_id, 'Proveedor') : '';
    if (
      supplier &&
      !(await stmt(
        "SELECT id FROM contacts WHERE id=? AND kind='supplier' AND archived=0",
        supplier,
      ).first())
    )
      throw new Error('Proveedor inválido.');
    const next = supplier || null;
    for (const product of ordered) {
      if ((product.supplier_id || null) === next) {
        skipped += 1;
        continue;
      }
      statements.push(
        stmt(
          'UPDATE products SET supplier_id=?,version=? WHERE id=?',
          next,
          product.version + 1,
          product.id,
        ),
      );
      updated += 1;
    }
  } else {
    const bp = integer(b.price_increase_bp, 'Porcentaje', 100000);
    if (!bp) throw new Error('El aumento debe ser mayor a cero.');
    for (const product of ordered) {
      if (
        !product.price ||
        product.attributes['Precio de lista'] === 'Pendiente de definir'
      ) {
        skipped += 1;
        continue;
      }
      const price = increaseByPercent(product.price, bp);
      let ffPrice =
        product.ff_price == null
          ? null
          : increaseByPercent(product.ff_price, bp);
      if (ffPrice !== null && ffPrice > price) ffPrice = price;
      let promoValue = product.promo_value;
      if (product.promo_kind === 'manual') {
        promoValue = increaseByPercent(product.promo_value, bp);
        if (promoValue > price) promoValue = price;
      }
      statements.push(
        stmt(
          'UPDATE products SET price=?,ff_price=?,promo_value=?,version=? WHERE id=?',
          price,
          ffPrice,
          promoValue,
          product.version + 1,
          product.id,
        ),
      );
      updated += 1;
    }
  }
  if (!updated)
    throw new Error(
      kind === 'price'
        ? 'Ningún producto seleccionado tiene precio de lista para aumentar.'
        : 'No hay cambios para aplicar en la selección.',
    );
  await db().batch(statements);
  return { ok: true, updated, skipped };
}
export async function mutate(
  b: Record<string, unknown>,
  actor: { id: string },
) {
  await ensureConfiguredCatalog();
  switch (b.action) {
    case 'contact':
      return contact(b);
    case 'product':
      return product(b, actor);
    case 'order':
      return saveOrder(b, actor);
    case 'order_quick':
      return patchOrder(b, actor);
    case 'products_bulk':
      return productsBulk(b);
    case 'stock': {
      const q = b.quantity;
      if (
        typeof q !== 'number' ||
        !Number.isInteger(q) ||
        !q ||
        Math.abs(q) > 100000
      )
        throw new Error('Movimiento inválido.');
      const id = str(b.product_id, 'Producto', true);
      const row = await stmt(
        'SELECT * FROM products WHERE id=? AND archived=0',
        id,
      ).first();
      if (!row) throw new Error('Producto no disponible.');
      const product = decode<Product>(row, ['options', 'attributes', 'photos']);
      product.kind = product.kind === 'configured' ? 'configured' : 'sku';
      const configured = configuredKindOf(product);
      let configJson = '{}';
      let key = '';
      if (configured) {
        const config = parseConfig(configured, b.config);
        configJson = JSON.stringify(config);
        key = stockKey(configured, config);
      } else if (isCabezadaProduct(product)) {
        const config = tryParseCabezadaConfig(b.config);
        if (config) {
          configJson = JSON.stringify(config);
          key = cabezadaStockKey(config);
        }
      }
      const location = choice(b.location, ['ivan', 'kriko'], 'Ubicación');
      const supplier = await optionalSupplier(b.supplier_id);
      const payment = await stockCostPayment(b, q > 0);
      if (q < 0) {
        const have = await stmt(
          "SELECT COALESCE(SUM(quantity),0) qty FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND COALESCE(location,'')=?",
          id,
          key,
          location,
        ).first<{ qty: number }>();
        if ((have?.qty || 0) + q < 0)
          throw new Error(
            `No hay suficiente stock en ${stockPlaceLabel(location)}.`,
          );
      }
      await stmt(
        'INSERT INTO stock_movements (id,product_id,quantity,reason,created_at,config,config_key,location,supplier_id,photos,created_by,cost_paid,paid_partner_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        crypto.randomUUID(),
        id,
        q,
        typeof b.reason === 'string' ? str(b.reason, 'Motivo', false, 500) : '',
        new Date().toISOString(),
        configJson,
        key,
        location,
        supplier,
        JSON.stringify(photos(b.photos)),
        actor.id,
        payment.costPaid,
        payment.paidPartnerId,
      ).run();
      const sync = await syncProductSupplier(id, supplier);
      if (sync) await sync.run();
      return { ok: true };
    }
    case 'stock_update': {
      const movementId = str(b.id, 'Movimiento', true);
      const existing = await stmt(
        'SELECT * FROM stock_movements WHERE id=?',
        movementId,
      ).first();
      if (!existing) throw new Error('Movimiento no disponible.');
      const current = obj(existing);
      if (current.order_id)
        throw new Error(
          'Este movimiento viene de un pedido y no se puede editar.',
        );
      const id = str(current.product_id, 'Producto', true);
      const row = await stmt(
        'SELECT * FROM products WHERE id=? AND archived=0',
        id,
      ).first();
      if (!row) throw new Error('Producto no disponible.');
      const product = decode<Product>(row, ['options', 'attributes', 'photos']);
      product.kind = product.kind === 'configured' ? 'configured' : 'sku';
      const configured = configuredKindOf(product);
      let configJson = '{}';
      let key = '';
      if (configured) {
        const config = parseConfig(configured, b.config);
        configJson = JSON.stringify(config);
        key = stockKey(configured, config);
      } else if (isCabezadaProduct(product)) {
        const config = tryParseCabezadaConfig(b.config);
        if (config) {
          configJson = JSON.stringify(config);
          key = cabezadaStockKey(config);
        }
      }
      const location = choice(b.location, ['ivan', 'kriko'], 'Ubicación');
      const supplier = await optionalSupplier(
        b.supplier_id,
        typeof current.supplier_id === 'string' ? current.supplier_id : '',
      );
      const rawQty = b.quantity;
      if (
        typeof rawQty !== 'number' ||
        !Number.isInteger(rawQty) ||
        rawQty < 1 ||
        rawQty > 100000
      )
        throw new Error('Movimiento inválido.');
      const q = rawQty * (Number(current.quantity) < 0 ? -1 : 1);
      const payment = await stockCostPayment(b, q > 0);
      const have = await stmt(
        "SELECT COALESCE(SUM(quantity),0) qty FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND id!=?",
        id,
        key,
        movementId,
      ).first<{ qty: number }>();
      if ((have?.qty || 0) + q < 0)
        throw new Error('El cambio dejaría el stock en negativo.');
      if (q < 0) {
        const atPlace = await stmt(
          "SELECT COALESCE(SUM(quantity),0) qty FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND COALESCE(location,'')=? AND id!=?",
          id,
          key,
          location,
          movementId,
        ).first<{ qty: number }>();
        if ((atPlace?.qty || 0) + q < 0)
          throw new Error(
            `No hay suficiente stock en ${stockPlaceLabel(location)}.`,
          );
      }
      const d = db();
      const sync = await syncProductSupplier(id, supplier);
      await d.batch([
        stmt('DROP TRIGGER IF EXISTS stock_immutable_update'),
        stmt(
          'UPDATE stock_movements SET quantity=?,reason=?,config=?,config_key=?,location=?,supplier_id=?,photos=?,cost_paid=?,paid_partner_id=? WHERE id=?',
          q,
          typeof b.reason === 'string' ? str(b.reason, 'Motivo', false, 500) : '',
          configJson,
          key,
          location,
          supplier,
          JSON.stringify(photos(b.photos)),
          payment.costPaid,
          payment.paidPartnerId,
          movementId,
        ),
        ...(sync ? [sync] : []),
        stmt(
          "CREATE TRIGGER stock_immutable_update BEFORE UPDATE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END",
        ),
      ]);
      return { ok: true };
    }
    case 'archive': {
      const table = choice(
        b.entity,
        ['contacts', 'products', 'orders'],
        'Entidad',
      );
      const id = str(b.id, 'ID', true);
      if (table === 'orders') {
        const row = await stmt(
          'SELECT * FROM orders WHERE id=?',
          id,
        ).first<Order>();
        if (row?.deleted)
          throw new Error('Restaurá el pedido borrado antes de archivarlo.');
        if (row && (orderIsLocked(row.status) || row.paid > 0))
          throw new Error(
            'No se puede archivar un pedido cerrado, entregado o con cobros.',
          );
      }
      const archived = integer(b.archived, 'Archivo', 1);
      const r =
        table === 'contacts'
          ? await stmt(
              `UPDATE contacts SET archived=?,version=? WHERE id=?`,
              archived,
              integer(b.version, 'Versión') + 1,
              id,
            ).run()
          : await stmt(
              `UPDATE ${table} SET archived=?,archived_by=?,version=? WHERE id=?`,
              archived,
              archived ? actor.id : '',
              integer(b.version, 'Versión') + 1,
              id,
            ).run();
      if (!r.meta.changes) throw new Error('Registro no disponible.');
      return { ok: true };
    }
    case 'reopen': {
      const id = str(b.id, 'ID', true);
      const existing = await stmt(
        "SELECT * FROM orders WHERE id=? AND status IN ('cerrado','entregado') AND archived=0 AND deleted=0",
        id,
      ).first<Order>();
      if (!existing) throw new Error('Pedido no disponible.');
      const items = (
        await stmt('SELECT * FROM order_items WHERE order_id=?', id).all()
      ).results.map((row) => decode<Item>(row, ['selections']));
      const statements = [
        stmt(
          "UPDATE orders SET status='abierto',version=? WHERE id=? AND status IN ('cerrado','entregado') AND archived=0 AND deleted=0",
          integer(b.version, 'Versión') + 1,
          id,
        ),
        ...(orderIsDelivered(existing.status)
          ? await orderWarehouseMoves(existing, items, 'reopen', actor)
          : []),
      ];
      const r = await db().batch(statements);
      if (!r[0]?.meta.changes) throw new Error('Pedido no disponible.');
      return { ok: true };
    }
    case 'currency': {
      const currency = choice(b.currency, ['ARS', 'USD', 'EUR'], 'Moneda');
      if (
        await stmt(
          'SELECT id FROM products UNION ALL SELECT id FROM orders LIMIT 1',
        ).first()
      )
        throw new Error(
          'La moneda sólo se puede cambiar antes de cargar productos o pedidos.',
        );
      await stmt(
        'INSERT INTO settings(id,currency) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET currency=excluded.currency',
        currency,
      ).run();
      return { ok: true };
    }
    case 'category': {
      const fields = list(b.fields, 20).map((v) => {
        const f = obj(v);
        return {
          name: str(f.name, 'Característica', true, 80),
          values: list(f.values, 50).map((x) => str(x, 'Valor', true, 150)),
        };
      });
      if (new Set(fields.map((f) => f.name)).size !== fields.length)
        throw new Error('Características repetidas.');
      await stmt(
        'UPDATE categories SET fields=? WHERE id=?',
        JSON.stringify(fields),
        str(b.id, 'Categoría', true),
      ).run();
      return { ok: true };
    }
    case 'partner':
    case 'partner_shares': {
      await ensureAccountTables();
      const items =
        b.action === 'partner_shares'
          ? list(b.partners, 20).map((item) => {
              const row = obj(item);
              return {
                id: row.id ? str(row.id, 'ID', true) : '',
                name: str(row.name, 'Socio', true, 80),
                share: integer(row.share, 'Porcentaje', 10000),
              };
            })
          : [
              {
                id: b.id ? str(b.id, 'ID', true) : '',
                name: str(b.name, 'Socio', true, 80),
                share:
                  b.share == null
                    ? undefined
                    : integer(b.share, 'Porcentaje', 10000),
              },
            ];
      if (!items.length) throw new Error('Socios: revisá el valor.');
      for (const item of items) {
        if (item.id) {
          const r = await stmt(
            item.share == null
              ? 'UPDATE partners SET name=?,version=version+1 WHERE id=? AND archived=0'
              : 'UPDATE partners SET name=?,share=?,version=version+1 WHERE id=? AND archived=0',
            ...(item.share == null
              ? [item.name, item.id]
              : [item.name, item.share, item.id]),
          ).run();
          if (!r.meta.changes) throw new Error('Socio no disponible.');
        } else {
          await stmt(
            'INSERT INTO partners(id,name,share) VALUES(?,?,?)',
            crypto.randomUUID(),
            item.name,
            item.share ?? 0,
          ).run();
        }
      }
      const snapshot = await allData();
      assertSharesComplete(snapshot.partners);
      return { ok: true };
    }
    case 'expense':
    case 'month_expense': {
      await ensureAccountTables();
      const kind = choice(b.kind, ['mkt', 'comisiones'], 'Tipo');
      const amount = integer(b.amount, 'Importe');
      if (b.action === 'month_expense') {
        const month = str(b.month, 'Mes', true);
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
          throw new Error('Mes inválido.');
        await stmt(
          'DELETE FROM account_expenses WHERE kind=? AND substr(date,1,7)=?',
          kind,
          month,
        ).run();
        if (!amount) return { ok: true };
        await stmt(
          'INSERT INTO account_expenses(id,kind,amount,date,notes,created_at) VALUES(?,?,?,?,?,?)',
          crypto.randomUUID(),
          kind,
          amount,
          `${month}-01`,
          str(b.notes || '', 'Notas'),
          new Date().toISOString(),
        ).run();
        return { ok: true };
      }
      if (!amount) throw new Error('Importe: debe ser mayor a cero.');
      await stmt(
        'INSERT INTO account_expenses(id,kind,amount,date,notes,created_at) VALUES(?,?,?,?,?,?)',
        crypto.randomUUID(),
        kind,
        amount,
        date(b.date, true),
        str(b.notes || '', 'Notas'),
        new Date().toISOString(),
      ).run();
      return { ok: true };
    }
    case 'cashout': {
      await ensureAccountTables();
      const partnerId = str(b.partner_id, 'Socio', true);
      if (
        !(await stmt(
          'SELECT id FROM partners WHERE id=? AND archived=0',
          partnerId,
        ).first())
      )
        throw new Error('Socio no disponible.');
      const amount = integer(b.amount, 'Importe');
      if (!amount) throw new Error('Importe: debe ser mayor a cero.');
      const snapshot = await allData();
      const profit = totalsOf(
        monthlyResults(snapshot.orders as Order[], snapshot.expenses),
      ).profit;
      if (!sharesAreComplete(snapshot.partners))
        throw new Error(
          'Definí los porcentajes de los socios en Configuración.',
        );
      const partner = snapshot.partners.find((row) => row.id === partnerId);
      const available = cashoutLimit(
        partner,
        profit,
        snapshot.cashouts,
        snapshot.partners,
      );
      if (amount > available) {
        throw new Error(
          available <= 0
            ? 'Este socio no tiene ganancia disponible para retirar.'
            : 'El cashout no puede superar la parte de este socio.',
        );
      }
      await stmt(
        'INSERT INTO partner_cashouts(id,partner_id,amount,date,notes,created_at,created_by) VALUES(?,?,?,?,?,?,?)',
        crypto.randomUUID(),
        partnerId,
        amount,
        date(b.date, true),
        str(b.notes || '', 'Notas'),
        new Date().toISOString(),
        actor.id,
      ).run();
      return { ok: true };
    }
    case 'account_entry': {
      await ensureAccountTables();
      const concept = choice(
        b.concept,
        ['pago_proveedor', 'gasto_publicitario', 'gastos_extras', 'otros'],
        'Concepto',
      );
      const detail = str(
        b.detail || '',
        'Concepto',
        concept === 'otros' || concept === 'pago_proveedor',
        160,
      );
      const partnerId = str(b.partner_id, 'Pagado por', true);
      if (
        !(await stmt(
          'SELECT id FROM partners WHERE id=? AND archived=0',
          partnerId,
        ).first())
      )
        throw new Error('Socio no disponible.');
      const supplierId =
        concept === 'pago_proveedor' ? await requireSupplier(b.supplier_id) : '';
      let orderId = '';
      if (concept === 'pago_proveedor' && b.order_id) {
        orderId = str(b.order_id, 'Pedido', true);
        const order = await stmt(
          'SELECT id FROM orders WHERE id=? AND deleted=0',
          orderId,
        ).first();
        if (!order) throw new Error('Pedido no disponible.');
      }
      const amount = integer(b.amount, 'Monto');
      if (!amount) throw new Error('Monto: debe ser mayor a cero.');
      const currency = choice(b.currency, ['ARS', 'USD'], 'Moneda');
      const receipt = photo(b.receipt || '');
      const fxRate =
        currency === 'USD' ? integer(b.fx_rate, 'Tipo de cambio') : 0;
      const amountArs =
        currency === 'USD' ? arsFromUsd(amount, fxRate) : amount;
      await stmt(
        'INSERT INTO account_entries(id,concept,detail,partner_id,supplier_id,order_id,receipt,amount,currency,fx_rate,amount_ars,date,created_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        crypto.randomUUID(),
        concept,
        detail,
        partnerId,
        supplierId,
        orderId,
        receipt,
        amount,
        currency,
        fxRate,
        amountArs,
        date(b.date, true),
        new Date().toISOString(),
        actor.id,
      ).run();
      return { ok: true };
    }
    case 'partner_access': {
      await ensureAccountTables();
      const id = str(b.id, 'ID', true);
      const email = str(b.email, 'Email', true, 120);
      const password =
        b.password == null || b.password === ''
          ? undefined
          : str(b.password, 'Contraseña', true, 80);
      await setPartnerAccess(id, email, password);
      return { ok: true };
    }
    case 'task': {
      await ensureTasksTable();
      const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
      const dueDate = date(b.due_date, true);
      const partnerId = str(b.partner_id, 'Responsable', true);
      if (
        !(await stmt(
          'SELECT id FROM partners WHERE id=? AND archived=0',
          partnerId,
        ).first())
      )
        throw new Error('Responsable no disponible.');
      const kind = choice(b.kind, [...TASK_KINDS], 'Tipo de tarea') as Task['kind'];
      const kindOther =
        kind === 'otro'
          ? str(b.kind_other || '', 'Tipo personalizado', true, 120)
          : '';
      const description = str(b.description || '', 'Descripción', false, 2000);
      const done = b.done == null ? undefined : integer(b.done, 'Hecha', 1);
      if (b.id) {
        const existing = await stmt(
          'SELECT * FROM tasks WHERE id=?',
          id,
        ).first<Task>();
        if (!existing) throw new Error('Tarea no disponible.');
        const supplierId = await optionalSupplier(
          b.supplier_id,
          existing.supplier_id,
        );
        const customerId = await optionalCustomer(
          b.customer_id,
          existing.customer_id,
        );
        const nextDone = done == null ? Number(existing.done) || 0 : done;
        const r = await stmt(
          'UPDATE tasks SET due_date=?,partner_id=?,supplier_id=?,customer_id=?,kind=?,kind_other=?,description=?,done=?,version=? WHERE id=? AND version=?',
          dueDate,
          partnerId,
          supplierId,
          customerId,
          kind,
          kindOther,
          description,
          nextDone,
          integer(b.version, 'Versión') + 1,
          id,
          integer(b.version, 'Versión'),
        ).run();
        if (!r.meta.changes) throw new Error('Tarea no disponible.');
        return { id };
      }
      const supplierId = await optionalSupplier(b.supplier_id);
      const customerId = await optionalCustomer(b.customer_id);
      await stmt(
        'INSERT INTO tasks(id,created_at,due_date,partner_id,supplier_id,customer_id,kind,kind_other,description,done,created_by,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        id,
        new Date().toISOString(),
        dueDate,
        partnerId,
        supplierId,
        customerId,
        kind,
        kindOther,
        description,
        done ?? 0,
        actor.id,
        1,
      ).run();
      return { id };
    }
    case 'task_delete': {
      await ensureTasksTable();
      const id = str(b.id, 'ID', true);
      const r = await stmt('DELETE FROM tasks WHERE id=?', id).run();
      if (!r.meta.changes) throw new Error('Tarea no disponible.');
      return { ok: true };
    }
    case 'order_delete': {
      const id = str(b.id, 'ID', true);
      const deleted = integer(b.deleted, 'Borrado', 1);
      const existing = await stmt(
        'SELECT * FROM orders WHERE id=?',
        id,
      ).first<Order>();
      if (!existing) throw new Error('Pedido no disponible.');
      const r = await stmt(
        deleted
          ? 'UPDATE orders SET deleted=1,deleted_by=?,archived=0,archived_by=?,version=? WHERE id=?'
          : "UPDATE orders SET deleted=0,deleted_by='',version=? WHERE id=?",
        ...(deleted
          ? [actor.id, '', integer(b.version, 'Versión') + 1, id]
          : [integer(b.version, 'Versión') + 1, id]),
      ).run();
      if (!r.meta.changes) throw new Error('Pedido no disponible.');
      return { ok: true };
    }
    case 'stock_delete': {
      const id = str(b.id, 'ID', true);
      const movement = await stmt(
        'SELECT * FROM stock_movements WHERE id=?',
        id,
      ).first<{
        id: string;
        product_id: string;
        quantity: number;
        order_id: string | null;
        config_key: string | null;
        location: string | null;
      }>();
      if (!movement) throw new Error('Registro de stock no disponible.');
      if (movement.quantity <= 0 || movement.order_id)
        throw new Error('Solo se pueden borrar ingresos de stock.');
      const key = movement.config_key || '';
      const location = movement.location || '';
      const holds = await reservedHoldsForProducts(
        [movement.product_id],
        '',
      );
      if (
        holds.some(
          (hold) =>
            hold.configKey === key &&
            (!hold.location || hold.location === location),
        )
      )
        throw new Error(
          'No se puede borrar: hay pedidos que reservan esta unidad.',
        );
      const outbound = await stmt(
        "SELECT id FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND COALESCE(location,'')=? AND quantity<0 LIMIT 1",
        movement.product_id,
        key,
        location,
      ).first();
      if (outbound)
        throw new Error(
          'No se puede borrar: esta unidad ya se usó en un pedido.',
        );
      const d = db();
      const r = await d.batch([
        stmt('DROP TRIGGER IF EXISTS stock_immutable_delete'),
        stmt(
          "DELETE FROM stock_movements WHERE product_id=? AND COALESCE(config_key,'')=? AND COALESCE(location,'')=? AND quantity>0 AND COALESCE(order_id,'')=''",
          movement.product_id,
          key,
          location,
        ),
        stmt(
          "CREATE TRIGGER stock_immutable_delete BEFORE DELETE ON stock_movements BEGIN SELECT RAISE(ABORT,'STOCK_IMMUTABLE'); END",
        ),
      ]);
      if (!r[1]?.meta.changes)
        throw new Error('No se pudo borrar el stock.');
      return { ok: true };
    }
    default:
      throw new Error('Acción desconocida.');
  }
}
