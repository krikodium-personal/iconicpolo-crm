import { db } from '@/db';
import {
  integer,
  lineTotals,
  discounted,
  promoPrice,
  increaseByPercent,
} from './money';
import type {
  Product,
  Item,
  Order,
  Contact,
  Option,
  Category,
  Partner,
  AccountExpense,
  PartnerCashout,
} from './types';
import { whatsappGroup } from './whatsapp';
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
      'CREATE TABLE IF NOT EXISTS partners (id text PRIMARY KEY NOT NULL, name text NOT NULL, archived integer NOT NULL DEFAULT 0, version integer NOT NULL DEFAULT 1)',
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
  ]);
}
export async function allData() {
  await ensureAccountTables();
  const d = db();
  const [c, p, o, i, m, cat, s, partners, expenses, cashouts] = await d.batch([
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
  ]);
  const items = i.results.map((r) => decode<Item>(r, ['selections']));
  return {
    contacts: c.results.map((r) => decode<Contact>(r, ['fiscal'])),
    products: p.results.map((r) =>
      decode<Product>(r, ['photos', 'options', 'attributes']),
    ),
    orders: o.results.map((r) => ({
      ...obj(r),
      items: items.filter((item) => item.order_id === obj(r).id),
    })),
    movements: m.results,
    categories: cat.results.map((r) => decode<Category>(r, ['fields'])),
    partners: partners.results as Partner[],
    expenses: expenses.results as AccountExpense[],
    cashouts: cashouts.results as PartnerCashout[],
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
export async function product(b: Record<string, unknown>) {
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
  ];
  if (b.id) {
    const result = await stmt(
      'UPDATE products SET name=?,sku=?,category=?,supplier_id=?,cost=?,price=?,ff_discount=?,ff_price=?,promo_kind=?,promo_value=?,photos=?,options=?,attributes=?,version=? WHERE id=? AND archived=0',
      ...values,
      integer(b.version, 'Versión') + 1,
      id,
    ).run();
    if (!result.meta.changes) throw new Error('Producto no disponible.');
  } else
    await stmt(
      'INSERT INTO products(name,sku,category,supplier_id,cost,price,ff_discount,ff_price,promo_kind,promo_value,photos,options,attributes,id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      ...values,
      id,
    ).run();
  return { id };
}
export async function saveOrder(b: Record<string, unknown>) {
  const d = db();
  const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
  const existing = b.id
    ? await stmt(
        'SELECT * FROM orders WHERE id=? AND archived=0',
        id,
      ).first<Order>()
    : null;
  if (b.id && !existing) throw new Error('Pedido no disponible.');
  if (existing?.status === 'cerrado')
    throw new Error('Reabrí el pedido antes de editarlo.');
  const customer = str(b.customer_id, 'Cliente', true);
  if (
    !(await stmt(
      "SELECT id FROM contacts WHERE id=? AND kind='customer' AND archived=0",
      customer,
    ).first())
  )
    throw new Error('Seleccioná un cliente activo.');
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
      snapshot = old;
    } else {
      const row = await stmt(
        'SELECT * FROM products WHERE id=? AND archived=0',
        str(input.product_id, 'Producto', true),
      ).first();
      if (!row) throw new Error('Producto no disponible.');
      const p = decode<Product>(row, ['options', 'attributes', 'photos']);
      if (p.attributes.Costo === 'Pendiente de definir')
        throw new Error(`Completá el costo de ${p.name} antes de venderlo.`);
      if (p.attributes['Precio de lista'] === 'Pendiente de definir')
        throw new Error(
          `Completá el precio de lista de ${p.name} antes de venderlo.`,
        );
      const ids = list(input.option_ids || [], 30).map((v) =>
        str(v, 'Opción', true),
      );
      if (new Set(ids).size !== ids.length) throw new Error('Opción repetida.');
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
        selections: { options, attributes: selected },
        unit_price: integer(base + options.reduce((s, o) => s + o.price, 0)),
        unit_cost: integer(p.cost + options.reduce((s, o) => s + o.cost, 0)),
      };
    }
    const itemId = old?.id || crypto.randomUUID();
    if (used.has(itemId)) throw new Error('Ítem duplicado.');
    used.add(itemId);
    const quantity = integer(input.quantity, 'Cantidad', 10000);
    const discount = integer(input.discount, 'Descuento', 10000);
    const totals = lineTotals(
      snapshot.unit_price,
      snapshot.unit_cost,
      quantity,
      discount,
    );
    items.push({
      ...snapshot,
      id: itemId,
      order_id: id,
      quantity,
      discount,
      total: totals.total,
      cost: totals.cost,
    });
  }
  const total = integer(items.reduce((s, i) => s + i.total, 0));
  const cost = integer(items.reduce((s, i) => s + i.cost, 0));
  const paid = integer(b.paid, 'Cobrado');
  if (paid > total) throw new Error('El cobro no puede superar el total.');
  const orderDate = date(b.date, true);
  const delivery = date(b.delivery);
  if (delivery && delivery < orderDate)
    throw new Error('La entrega no puede ser anterior al pedido.');
  const status = choice(
    b.status,
    ['nuevo', 'abierto', 'en producción', 'cerrado'],
    'Estado',
  );
  const invoice = integer(b.invoice, 'Facturación', 1);
  const notes = str(b.notes, 'Notas', false, 2000);
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
        'UPDATE orders SET customer_id=?,date=?,delivery=?,paid=?,invoice=?,notes=?,total=?,cost=?,version=? WHERE id=?',
        customer,
        orderDate,
        delivery,
        paid,
        invoice,
        notes,
        total,
        cost,
        integer(b.version, 'Versión') + 1,
        id,
      ),
    );
    statements.push(stmt('DELETE FROM order_items WHERE order_id=?', id));
  } else
    statements.push(
      stmt(
        "INSERT INTO orders(id,number,customer_id,date,delivery,status,paid,invoice,notes,currency,total,cost) VALUES (?,?,?,?,?,'nuevo',?,?,?,?,?,?)",
        id,
        number,
        customer,
        orderDate,
        delivery,
        paid,
        invoice,
        notes,
        currency,
        total,
        cost,
      ),
    );
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
  if (status !== (existing?.status || 'nuevo'))
    statements.push(
      stmt(
        'UPDATE orders SET status=?,version=version+1 WHERE id=?',
        status,
        id,
      ),
    );
  await d.batch(statements);
  return { id, number };
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
export async function mutate(b: Record<string, unknown>) {
  switch (b.action) {
    case 'contact':
      return contact(b);
    case 'product':
      return product(b);
    case 'order':
      return saveOrder(b);
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
      if (
        !(await stmt(
          'SELECT id FROM products WHERE id=? AND archived=0',
          id,
        ).first())
      )
        throw new Error('Producto no disponible.');
      await stmt(
        'INSERT INTO stock_movements (id,product_id,quantity,reason,created_at) VALUES (?,?,?,?,?)',
        crypto.randomUUID(),
        id,
        q,
        str(b.reason, 'Motivo', true, 500),
        new Date().toISOString(),
      ).run();
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
        if (row && (row.status === 'cerrado' || row.paid > 0))
          throw new Error(
            'No se puede archivar un pedido cerrado o con cobros.',
          );
      }
      const r = await stmt(
        `UPDATE ${table} SET archived=?,version=? WHERE id=?`,
        integer(b.archived, 'Archivo', 1),
        integer(b.version, 'Versión') + 1,
        id,
      ).run();
      if (!r.meta.changes) throw new Error('Registro no disponible.');
      return { ok: true };
    }
    case 'reopen': {
      const r = await stmt(
        "UPDATE orders SET status='abierto',version=? WHERE id=? AND status='cerrado' AND archived=0",
        integer(b.version, 'Versión') + 1,
        str(b.id, 'ID', true),
      ).run();
      if (!r.meta.changes) throw new Error('Pedido no disponible.');
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
    case 'partner': {
      await ensureAccountTables();
      const name = str(b.name, 'Socio', true, 80);
      const id = b.id ? str(b.id, 'ID', true) : crypto.randomUUID();
      if (b.id) {
        const r = await stmt(
          'UPDATE partners SET name=?,version=? WHERE id=? AND archived=0',
          name,
          integer(b.version, 'Versión') + 1,
          id,
        ).run();
        if (!r.meta.changes) throw new Error('Socio no disponible.');
      } else {
        await stmt('INSERT INTO partners(id,name) VALUES(?,?)', id, name).run();
      }
      return { ok: true };
    }
    case 'expense': {
      await ensureAccountTables();
      const amount = integer(b.amount, 'Importe');
      if (!amount) throw new Error('Importe: debe ser mayor a cero.');
      await stmt(
        'INSERT INTO account_expenses(id,kind,amount,date,notes,created_at) VALUES(?,?,?,?,?,?)',
        crypto.randomUUID(),
        choice(b.kind, ['mkt', 'comisiones'], 'Tipo'),
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
      await stmt(
        'INSERT INTO partner_cashouts(id,partner_id,amount,date,notes,created_at) VALUES(?,?,?,?,?,?)',
        crypto.randomUUID(),
        partnerId,
        amount,
        date(b.date, true),
        str(b.notes || '', 'Notas'),
        new Date().toISOString(),
      ).run();
      return { ok: true };
    }
    default:
      throw new Error('Acción desconocida.');
  }
}
