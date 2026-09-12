import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  currency: text('currency').notNull().default('ARS'),
});
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  fields: text('fields').notNull().default('[]'),
});
export const contacts = sqliteTable(
  'contacts',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    contact: text('contact').notNull().default(''),
    title: text('title').notNull().default(''),
    address: text('address').notNull().default(''),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    website: text('website').notNull().default(''),
    whatsappGroup: text('whatsapp_group').notNull().default(''),
    notes: text('notes').notNull().default(''),
    fiscal: text('fiscal').notNull().default('{}'),
    archived: integer('archived').notNull().default(0),
    version: integer('version').notNull().default(1),
  },
  (t) => [index('idx_contacts_kind').on(t.kind, t.archived)],
);
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    sku: text('sku').notNull().unique(),
    category: text('category')
      .notNull()
      .references(() => categories.id),
    supplierId: text('supplier_id').references(() => contacts.id),
    cost: integer('cost').notNull(),
    price: integer('price').notNull(),
    ffDiscount: integer('ff_discount').notNull().default(0),
    ffPrice: integer('ff_price'),
    promoKind: text('promo_kind').notNull().default('none'),
    promoValue: integer('promo_value').notNull().default(0),
    photos: text('photos').notNull().default('[]'),
    options: text('options').notNull().default('[]'),
    attributes: text('attributes').notNull().default('{}'),
    pricing: text('pricing').notNull().default('{}'),
    kind: text('kind').notNull().default('sku'),
    archived: integer('archived').notNull().default(0),
    version: integer('version').notNull().default(1),
  },
  (t) => [index('idx_products_supplier').on(t.supplierId)],
);
export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    number: text('number').notNull().unique(),
    customerId: text('customer_id')
      .notNull()
      .references(() => contacts.id),
    date: text('date').notNull(),
    delivery: text('delivery').notNull().default(''),
    status: text('status').notNull().default('nuevo'),
    paid: integer('paid').notNull().default(0),
    invoice: integer('invoice').notNull().default(0),
    notes: text('notes').notNull().default(''),
    currency: text('currency').notNull().default('ARS'),
    total: integer('total').notNull(),
    cost: integer('cost').notNull(),
    archived: integer('archived').notNull().default(0),
    version: integer('version').notNull().default(1),
  },
  (t) => [index('idx_orders_customer_date').on(t.customerId, t.date)],
);
export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    name: text('name').notNull(),
    sku: text('sku').notNull(),
    selections: text('selections').notNull(),
    unitPrice: integer('unit_price').notNull(),
    unitCost: integer('unit_cost').notNull(),
    quantity: integer('quantity').notNull(),
    discount: integer('discount').notNull(),
    total: integer('total').notNull(),
    cost: integer('cost').notNull(),
  },
  (t) => [index('idx_items_order').on(t.orderId)],
);
export const stockMovements = sqliteTable(
  'stock_movements',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    orderId: text('order_id').references(() => orders.id),
    quantity: integer('quantity').notNull(),
    reason: text('reason').notNull(),
    createdAt: text('created_at').notNull(),
    config: text('config').notNull().default('{}'),
    configKey: text('config_key').notNull().default(''),
    location: text('location').notNull().default(''),
    supplierId: text('supplier_id').notNull().default(''),
  },
  (t) => [
    index('idx_stock_product').on(t.productId),
    index('idx_stock_product_config').on(t.productId, t.configKey),
  ],
);
export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
});
export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  archived: integer('archived').notNull().default(0),
  version: integer('version').notNull().default(1),
});
export const accountExpenses = sqliteTable(
  'account_expenses',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    amount: integer('amount').notNull(),
    date: text('date').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('idx_expenses_date').on(t.date)],
);
export const partnerCashouts = sqliteTable(
  'partner_cashouts',
  {
    id: text('id').primaryKey(),
    partnerId: text('partner_id')
      .notNull()
      .references(() => partners.id),
    amount: integer('amount').notNull(),
    date: text('date').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('idx_cashouts_partner_date').on(t.partnerId, t.date)],
);
