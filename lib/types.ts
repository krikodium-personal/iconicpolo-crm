import type { ConfiguredPricing } from './configure';

export type Contact = {
  id: string;
  kind: 'supplier' | 'customer';
  name: string;
  contact: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  whatsapp_group: string;
  notes: string;
  fiscal: { name?: string; taxId?: string; address?: string; vat?: string };
  archived: number;
  version: number;
};
export type Option = {
  id: string;
  name: string;
  price: number;
  cost: number;
  photo: string;
};
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier_id: string | null;
  cost: number;
  price: number;
  ff_discount: number;
  ff_price: number | null;
  promo_kind: string;
  promo_value: number;
  photos: string[];
  options: Option[];
  attributes: Record<string, string>;
  pricing: ConfiguredPricing;
  kind: 'sku' | 'configured';
  stock: number;
  archived: number;
  version: number;
  created_by?: string;
  archived_by?: string;
};
export type Item = {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  sku: string;
  selections: {
    options: Option[];
    attributes: Record<string, string>;
    config?: Record<string, unknown>;
    supplier_id?: string;
    from_stock?: boolean;
    stock_qty?: number;
    location?: string;
  };
  unit_price: number;
  unit_cost: number;
  quantity: number;
  discount: number;
  total: number;
  cost: number;
};
export type Order = {
  id: string;
  number: string;
  customer_id: string;
  date: string;
  delivery: string;
  status: string;
  paid: number;
  /** Socio que recibió el cobro del cliente. Vacío si no hay cobro. */
  paid_partner_id: string;
  invoice: number;
  notes: string;
  currency: string;
  /** Vacío = sin cargos de envío en la cotización/pedido. */
  shipping_carrier: string;
  /** Costo de envío en centavos. */
  shipping_amount: number;
  total: number;
  cost: number;
  archived: number;
  deleted: number;
  version: number;
  created_by?: string;
  archived_by?: string;
  deleted_by?: string;
  items: Item[];
};
export function orderIsLive(order: {
  archived?: number | boolean;
  deleted?: number | boolean;
  status?: string;
}) {
  return !order.archived && !order.deleted && !orderIsQuote(order.status || '');
}
export type Category = {
  id: string;
  name: string;
  fields: { name: string; values: string[] }[];
};
export type Movement = {
  id: string;
  product_id: string;
  order_id: string | null;
  quantity: number;
  reason: string;
  created_at: string;
  config: Record<string, unknown>;
  config_key: string;
  location: string;
  supplier_id: string;
  photos: string[];
  created_by?: string;
};
export type Partner = {
  id: string;
  name: string;
  share: number;
  archived: number;
  version: number;
  email?: string;
  has_password?: number;
};
export function actorName(partners: Partner[], id?: string | null) {
  if (!id) return '';
  return partners.find((partner) => partner.id === id)?.name || '';
}
export type AccountExpense = {
  id: string;
  kind: 'mkt' | 'comisiones';
  amount: number;
  date: string;
  notes: string;
  created_at: string;
};
export type AccountEntryConcept =
  | 'pago_proveedor'
  | 'gasto_publicitario'
  | 'gastos_extras'
  | 'otros';
export type AccountEntry = {
  id: string;
  concept: AccountEntryConcept;
  detail: string;
  partner_id: string;
  supplier_id?: string;
  order_id?: string;
  receipt?: string;
  amount: number;
  currency: 'ARS' | 'USD';
  fx_rate?: number;
  amount_ars?: number;
  date: string;
  created_at: string;
  created_by?: string;
};
export type PartnerCashout = {
  id: string;
  partner_id: string;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
  created_by?: string;
};
export type Data = {
  contacts: Contact[];
  products: Product[];
  orders: Order[];
  categories: Category[];
  movements: Movement[];
  partners: Partner[];
  expenses: AccountExpense[];
  cashouts: PartnerCashout[];
  entries: AccountEntry[];
  currency: string;
};
export const ORDER_STATUSES = [
  'cotización',
  'nuevo',
  'abierto',
  'en producción',
  'cerrado',
  'entregado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export function orderIsQuote(status: string) {
  return status === 'cotización';
}
export function orderIsDelivered(status: string) {
  return status === 'entregado';
}
export function todayInBuenosAires() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}
export function orderPipelineStatus(
  order: { status: string; delivery?: string },
  today = todayInBuenosAires(),
) {
  if (orderIsQuote(order.status)) return order.status;
  return order.status === 'entregado' ||
    !!(order.delivery && order.delivery <= today)
    ? 'entregado'
    : order.status;
}
export function orderIsLocked(status: string) {
  return status === 'cerrado' || status === 'entregado';
}
export const modules = [
  'dashboard',
  'tablero',
  'proveedores',
  'productos',
  'clientes',
  'pedidos',
  'tareas',
] as const;
