import type { ConfiguredPricing } from './configure';
import type { TaskKind } from './tasks';

export type { TaskKind };

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
  deleted?: number;
  version: number;
};
export type Option = {
  id: string;
  name: string;
  price: number;
  cost: number;
  photo: string;
};
export type ProductUnit = 'unidad' | 'par' | 'juego';
const UNITS: Record<
  ProductUnit,
  {
    label: string;
    one: string;
    many: string;
    shortOne: string;
    shortMany: string;
    field: string;
    /** Terminación de género: `reservadas` / `reservados`. */
    ending: 'a' | 'o';
  }
> = {
  unidad: {
    label: 'Unidad',
    one: 'unidad',
    many: 'unidades',
    shortOne: 'ud.',
    shortMany: 'uds.',
    field: 'Cantidad',
    ending: 'a',
  },
  par: {
    label: 'Par',
    one: 'par',
    many: 'pares',
    shortOne: 'par',
    shortMany: 'pares',
    field: 'Pares',
    ending: 'o',
  },
  juego: {
    label: 'Juego',
    one: 'juego',
    many: 'juegos',
    shortOne: 'juego',
    shortMany: 'juegos',
    field: 'Juegos',
    ending: 'o',
  },
};
export const PRODUCT_UNITS = (Object.keys(UNITS) as ProductUnit[]).map(
  (id) => ({ id, label: UNITS[id].label }),
);
export function isProductUnit(value: unknown): value is ProductUnit {
  return typeof value === 'string' && value in UNITS;
}
export function unitInfo(unit?: ProductUnit) {
  return UNITS[unit && unit in UNITS ? unit : 'unidad'];
}
/** `3 uds.` / `1 par` / `3 juegos` según cómo se cuenta el producto. */
export function quantityLabel(quantity: number, unit?: ProductUnit) {
  return `${quantity} ${unitShort(unit, quantity)}`;
}
/** `ud.` / `uds.` / `par` / `pares` / `juego` / `juegos`. */
export function unitShort(unit?: ProductUnit, quantity = 2) {
  const info = unitInfo(unit);
  return quantity === 1 ? info.shortOne : info.shortMany;
}
/** `unidades` / `pares` / `juegos`. */
export function unitWord(unit?: ProductUnit, quantity = 2) {
  const info = unitInfo(unit);
  return quantity === 1 ? info.one : info.many;
}
/** Concuerda un participio con la unidad: `reservad` → `reservadas` / `reservados`. */
export function unitAgree(stem: string, unit?: ProductUnit, quantity = 2) {
  return `${stem}${unitInfo(unit).ending}${quantity === 1 ? '' : 's'}`;
}
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
  unit?: ProductUnit;
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
    /** Carga de stock elegida de la que sale el ítem al entregar. */
    stock_load_id?: string;
    /** percent = descuento en bp; fixed = unit_price es el precio de venta. */
    sale_mode?: 'percent' | 'fixed';
    /** Precio de lista unitario (sin dto. ni precio especial) al momento de la venta. */
    list_unit_price?: number;
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
  /** Socio que recupera el capital (costo de proveedor) de esta venta. */
  cost_partner_id: string;
  invoice: number;
  notes: string;
  currency: string;
  /** Vacío = sin cargos de envío en la cotización/pedido. */
  shipping_carrier: string;
  /** Costo de envío en centavos. */
  shipping_amount: number;
  total: number;
  cost: number;
  /** venta = se cobra; sponsoreo = se entrega sin cobro y solo cuenta el costo. */
  kind?: OrderKind;
  archived: number;
  deleted: number;
  version: number;
  created_by?: string;
  archived_by?: string;
  deleted_by?: string;
  items: Item[];
};
export type OrderKind = 'venta' | 'sponsoreo';
export const ORDER_KINDS: { id: OrderKind; label: string }[] = [
  { id: 'venta', label: 'Venta' },
  { id: 'sponsoreo', label: 'Sponsoreo' },
];
export function orderIsSponsor(order: { kind?: string }) {
  return order.kind === 'sponsoreo';
}
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
  cost_paid: number;
  paid_partner_id: string;
  created_by?: string;
  /** Costo unitario especial de la carga; 0 = costo de lista. */
  unit_cost?: number;
  /** Carga (ingreso) de la que salen/vuelven estas unidades; vacío en las cargas. */
  source_movement_id?: string;
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
  /** Ingreso de stock que originó este pago a proveedor. */
  stock_movement_id?: string;
  receipt?: string;
  amount: number;
  currency: 'ARS' | 'USD';
  fx_rate?: number;
  amount_ars?: number;
  amount_usd?: number;
  date: string;
  created_at: string;
  created_by?: string;
};
/** Cobro al cliente; `orders.paid` es la suma de los cobros del pedido. */
export type OrderPayment = {
  id: string;
  order_id: string;
  amount: number;
  partner_id: string;
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
export type Task = {
  id: string;
  created_at: string;
  due_date: string;
  partner_id: string;
  supplier_id: string;
  customer_id: string;
  kind: TaskKind;
  kind_other: string;
  description: string;
  done: number;
  created_by?: string;
  version: number;
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
  payments?: OrderPayment[];
  tasks: Task[];
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
/** `YYYY-MM-DD` (o ISO con hora) → `DD-MM-AAAA`. */
export function formatDate(value: string) {
  const [year, month, day] = (value || '').slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}
/** Timestamp ISO → `DD-MM-AAAA HH:mm` en hora de Buenos Aires. */
export function formatDateTime(iso: string) {
  const when = new Date(iso);
  if (!iso || Number.isNaN(when.getTime())) return formatDate(iso);
  const timeZone = 'America/Argentina/Buenos_Aires';
  const day = when.toLocaleDateString('en-CA', { timeZone });
  const time = when.toLocaleTimeString('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formatDate(day)} ${time}`;
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
export type AccountView = 'board' | 'resultados' | 'movimientos';
/** Más nuevo primero: por fecha y, dentro del mismo día, por hora de carga. */
export function newestFirst(
  a: { date: string; created_at?: string },
  b: { date: string; created_at?: string },
) {
  return (
    b.date.localeCompare(a.date) ||
    (b.created_at || '').localeCompare(a.created_at || '')
  );
}
export function accountViewOf(vista: string | undefined): AccountView {
  return vista === 'resultados' || vista === 'movimientos' ? vista : 'board';
}
