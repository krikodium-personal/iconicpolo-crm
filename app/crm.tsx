'use client';
import Image from 'next/image';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ListTodo,
  Package,
  Users,
  Truck,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  Search,
  Settings,
  Archive,
  RotateCcw,
  ArrowDownUp,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  CircleDollarSign,
  Landmark,
  Check,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ContactForm,
  ProductForm,
  ProductDetail,
  ProductBulkBar,
  OrderForm,
  StockForm,
  StockOverview,
  SettingsForm,
  whatsapp,
  whatsappGroup,
} from './forms';
import { AccountBoard } from './account';
import { Status, ProductPhoto, Pick, ErrorBox, SelectCheck } from './ui';
import { formatMoney, friendsPrice, margin } from '@/lib/money';
import { isConfiguredCategory, isConfiguredProduct } from '@/lib/configure';
import { TypeCards, TypeConfigForm } from './type-config';
import type { Data, Contact, Product, Order, Movement } from '@/lib/types';

const nav: { id: string; title: string; short: string; icon: LucideIcon }[] = [
  {
    id: 'dashboard',
    title: 'Vista general',
    short: 'Inicio',
    icon: LayoutDashboard,
  },
  {
    id: 'tablero',
    title: 'Estado de cuenta',
    short: 'Tablero',
    icon: Landmark,
  },
  { id: 'pedidos', title: 'Pedidos', short: 'Pedidos', icon: ShoppingBag },
  { id: 'tareas', title: 'Tareas', short: 'Tareas', icon: ListTodo },
  {
    id: 'productos',
    title: 'Productos / Stock',
    short: 'Productos',
    icon: Package,
  },
  { id: 'clientes', title: 'Clientes', short: 'Clientes', icon: Users },
  {
    id: 'proveedores',
    title: 'Proveedores',
    short: 'Proveedores',
    icon: Truck,
  },
];
type Panel =
  | { type: 'supplier' | 'customer'; record?: Contact }
  | { type: 'product'; record?: Product; editing?: boolean }
  | { type: 'order'; record?: Order }
  | { type: 'stock'; record: Product; movement?: Movement; back?: 'inventory' }
  | { type: 'inventory'; record: Product }
  | { type: 'settings' };
type Archived = {
  entity: 'products' | 'orders' | 'contacts';
  record: Product | Order | Contact;
};
const PENDING = 'Pendiente de definir';
function isPending(value: string | undefined) {
  return value === PENDING;
}
function ProductCard({
  product,
  categoryName,
  supplierName,
  selected,
  archived,
  money,
  onOpen,
  onToggle,
  onStock,
  archiveButton,
}: {
  product: Product;
  categoryName?: string;
  supplierName?: string;
  selected: boolean;
  archived: boolean;
  money: (n: number) => string;
  onOpen: () => void;
  onToggle: (checked: boolean) => void;
  onStock: () => void;
  archiveButton: ReactNode;
}) {
  const costPending = isPending(product.attributes.Costo);
  const pricePending = isPending(product.attributes['Precio de lista']);
  const ffPending = isPending(product.attributes['Precio F&F']);
  const ff = friendsPrice(product);
  const listMargin =
    costPending || pricePending ? null : margin(product.price, product.cost);
  const ffDiscount =
    !ffPending && product.price
      ? Math.round((1 - ff / product.price) * 10000) / 100
      : null;
  return (
    <article
      className={`record-card clickable-row${selected ? ' is-selected' : ''}`}
    >
      <button
        type="button"
        className="row-hit"
        aria-label={`Ver ficha de ${product.name}`}
        onClick={onOpen}
      />
      <div className="record-card-top">
        <div className="row-select">
          <SelectCheck
            label={`Seleccionar ${product.name}`}
            checked={selected}
            onChange={onToggle}
          />
        </div>
        <ProductPhoto name={product.name} url={product.photos[0]} />
        <div className="record-card-id">
          <span className="record-link">{product.name}</span>
          <small>
            {isConfiguredProduct(product) ? 'Configurable' : product.sku}
          </small>
          <small className={supplierName ? undefined : 'pending-text'}>
            {[categoryName, supplierName || 'Sin proveedor']
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
      </div>
      <div className="record-card-meta">
        <span className={`stock-pill ${product.stock <= 2 ? 'low' : ''}`}>
          {product.stock} uds.
        </span>
        <div className="row-actions">
          {!archived && (
            <button
              type="button"
              className="icon-button"
              title="Registrar movimiento"
              aria-label={`Registrar stock de ${product.name}`}
              onClick={onStock}
            >
              <ArrowDownUp size={17} />
            </button>
          )}
          {archiveButton}
        </div>
      </div>
      <dl className="record-card-facts">
        <div>
          <dt>Costo</dt>
          <dd className="amount">
            {costPending ? (
              <span className="pending-text">Pendiente</span>
            ) : (
              money(product.cost)
            )}
          </dd>
        </div>
        <div>
          <dt>Lista</dt>
          <dd className="amount">
            {pricePending ? (
              <span className="pending-text">Pendiente</span>
            ) : (
              money(product.price)
            )}
          </dd>
        </div>
        <div>
          <dt>F&F</dt>
          <dd className="amount">
            {ffPending ? (
              <span className="pending-text">Pendiente</span>
            ) : (
              money(ff)
            )}
            {ffDiscount != null ? <small>{ffDiscount}% dto.</small> : null}
          </dd>
        </div>
        <div>
          <dt>Margen</dt>
          <dd className="amount">
            {listMargin == null ? (
              <span className="pending-text">Pendiente</span>
            ) : (
              `${listMargin}%`
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
}
function ContactCard({
  contact,
  productCount,
  lastPurchase,
  orderCount,
  archiveButton,
  onOpen,
}: {
  contact: Contact;
  productCount?: number;
  lastPurchase?: string;
  orderCount?: number;
  archiveButton: ReactNode;
  onOpen: () => void;
}) {
  const supplier = contact.kind === 'supplier';
  return (
    <article className="record-card clickable-row">
      <button
        type="button"
        className="row-hit"
        aria-label={`Ver ficha de ${contact.name}`}
        onClick={onOpen}
      />
      <div className="record-card-top">
        <span className="avatar">{initials(contact.name)}</span>
        <div className="record-card-id">
          <span className="record-link">{contact.name}</span>
          <small>
            {contact.contact || 'Sin persona de contacto'}
            {supplier && contact.title ? ` · ${contact.title}` : ''}
          </small>
        </div>
        <div className="record-card-meta record-card-meta-inline">
          <div className="row-actions">{archiveButton}</div>
        </div>
      </div>
      <div className="record-card-links">
        {contact.phone ? (
          <a
            className="contact-phone"
            href={whatsapp(contact.phone) || '#'}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={15} />
            {contact.phone}
          </a>
        ) : null}
        {supplier && whatsappGroup(contact.whatsapp_group) ? (
          <a
            className="contact-phone"
            href={whatsappGroup(contact.whatsapp_group) || '#'}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={15} />
            Grupo WhatsApp
          </a>
        ) : null}
        {contact.email ? (
          <a className="email" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        ) : (
          <small>Sin email</small>
        )}
        {contact.website ? (
          <a
            className="email"
            href={contact.website}
            target="_blank"
            rel="noreferrer"
          >
            Página web ↗
          </a>
        ) : null}
      </div>
      <dl className="record-card-facts">
        <div>
          <dt>Ubicación</dt>
          <dd>{contact.address || 'Sin dirección'}</dd>
        </div>
        <div>
          <dt>{supplier ? 'Productos' : 'Última compra'}</dt>
          <dd>
            {supplier
              ? `${productCount ?? 0} productos`
              : lastPurchase || 'Sin compras'}
            {!supplier ? <small>{orderCount ?? 0} pedidos</small> : null}
          </dd>
        </div>
      </dl>
    </article>
  );
}
function OrderCard({
  order,
  customerName,
  money,
  compact = false,
  archiveButton,
  onOpen,
}: {
  order: Order;
  customerName: string;
  money: (n: number) => string;
  compact?: boolean;
  archiveButton: ReactNode;
  onOpen: () => void;
}) {
  return (
    <article className="record-card clickable-row">
      <button
        type="button"
        className="row-hit"
        aria-label={`Abrir ${order.number}`}
        onClick={onOpen}
      />
      <div className="record-card-top">
        <div className="record-card-id">
          <span className="record-link">{order.number}</span>
          <small>
            {customerName} · {order.date}
          </small>
        </div>
        <div className="record-card-meta record-card-meta-inline">
          <div className="row-actions">
            {compact ? (
              <button
                type="button"
                aria-label={`Abrir ${order.number}`}
                className="icon-button"
                onClick={onOpen}
              >
                <ChevronRight size={18} />
              </button>
            ) : (
              archiveButton
            )}
          </div>
        </div>
      </div>
      <div className="record-card-status">
        <Status value={order.status} />
        <Status value={payStatus(order)} />
      </div>
      <dl className={`record-card-facts${compact ? ' facts-compact' : ''}`}>
        {compact ? null : (
          <div>
            <dt>Entrega</dt>
            <dd>{order.delivery || 'Sin definir'}</dd>
          </div>
        )}
        <div>
          <dt>Total</dt>
          <dd className="amount">{money(order.total)}</dd>
          {compact ? null : <small>{money(order.paid)} cobrado</small>}
        </div>
        {compact ? null : (
          <div>
            <dt>Ganancia</dt>
            <dd className="amount">{money(order.total - order.cost)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
const payStatus = (o: Order) =>
  o.paid === 0 && o.total > 0
    ? 'no pagado'
    : o.paid < o.total
      ? 'pago parcial'
      : 'pagado';
async function post(body: Record<string, unknown>) {
  const r = await fetch('/api/crm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await r.json()) as {
    error?: string;
    updated?: number;
    skipped?: number;
  };
  if (!r.ok) throw new Error(result.error || 'No se pudo guardar.');
  return result;
}
export default function CRM({
  module,
  initialFilter = 'all',
}: {
  module: string;
  initialFilter?: string;
}) {
  const [data, D] = useState<Data | null>(null),
    [error, E] = useState(''),
    [notice, setNotice] = useState<{ id: number; text: string } | null>(null),
    [panel, P] = useState<Panel | null>(null),
    [query, Q] = useState(''),
    [filter, F] = useState(initialFilter),
    [archived, A] = useState(false),
    [confirm, C] = useState<Archived | null>(null),
    [busy, B] = useState(false),
    [selected, S] = useState<string[]>([]),
    [stocked, T] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch('/api/crm', { cache: 'no-store' });
    const next = (await response.json()) as Data & { error?: string };
    if (!response.ok) throw new Error(next.error);
    D(next);
    return next;
  }, []);
  const N = (text: string) => {
    setNotice(text ? { id: Date.now(), text } : null);
  };
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- The async refresh synchronizes this view with D1.
    void refresh().catch((e) => E(e.message));
  }, [refresh]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void;
        };
      }
    ).modelContext;
    if (!context) return;
    const life = new AbortController();
    try {
      context.registerTool(
        {
          name: 'start_crm_record',
          title: 'Abrir un formulario de Iconic CRM',
          description:
            'Abre el formulario para crear un cliente, proveedor, producto o pedido. No guarda datos.',
          inputSchema: {
            type: 'object',
            properties: {
              entity: {
                type: 'string',
                enum: ['customer', 'supplier', 'product', 'order'],
              },
            },
            required: ['entity'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            if (
              !input ||
              typeof input !== 'object' ||
              !('entity' in input) ||
              !['customer', 'supplier', 'product', 'order'].includes(
                String(input.entity),
              )
            )
              throw new Error('Entidad inválida.');
            P({
              type: input.entity as
                | 'customer'
                | 'supplier'
                | 'product'
                | 'order',
            });
            return { opened: input.entity, saved: false };
          },
        },
        { signal: life.signal },
      );
    } catch {
      /* Optional browser capability. */
    }
    return () => life.abort();
  }, []);
  async function save(body: Record<string, unknown>) {
    await post(body);
    N('Cambios guardados.');
    try {
      const next = await refresh();
      if (body.action === 'product' && typeof body.id === 'string') {
        const updated = next.products.find((p) => p.id === body.id);
        if (updated && !isConfiguredProduct(updated)) {
          P({ type: 'product', record: updated });
          return;
        }
      }
      if (
        (body.action === 'stock' || body.action === 'stock_update') &&
        typeof body.product_id === 'string' &&
        (panel?.type === 'inventory' ||
          (panel?.type === 'stock' && panel.back === 'inventory'))
      ) {
        const updated = next.products.find((p) => p.id === body.product_id);
        if (updated) {
          P({ type: 'inventory', record: updated });
          return;
        }
      }
      P(null);
    } catch {
      P(null);
      E(
        'Se guardó el cambio, pero no se pudo actualizar la vista. Usá Actualizar.',
      );
    }
  }
  async function applyBulk(body: Record<string, unknown>) {
    B(true);
    E('');
    try {
      const result = await post({
        action: 'products_bulk',
        ids: liveSelected,
        ...body,
      });
      const updated = result.updated || 0;
      const skipped = result.skipped || 0;
      N(
        skipped
          ? `${updated} productos actualizados. ${skipped} se omitieron.`
          : `${updated} productos actualizados.`,
      );
      S([]);
      await refresh();
    } finally {
      B(false);
    }
  }
  async function initialize(demo: boolean) {
    B(true);
    E('');
    try {
      await post({ action: 'initialize', demo });
      await refresh();
      N(demo ? 'Datos ficticios de ejemplo cargados.' : 'Tu CRM está listo.');
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  function create() {
    P({
      type:
        module === 'proveedores'
          ? 'supplier'
          : module === 'clientes'
            ? 'customer'
            : module === 'productos'
              ? 'product'
              : 'order',
    });
  }
  const title = nav.find((n) => n.id === module)?.title || 'Vista general';
  const currency = data?.currency || 'ARS';
  const money = (n: number) => formatMoney(n, currency);
  const search = (...values: (string | undefined)[]) =>
    values.join(' ').toLowerCase().includes(query.toLowerCase());
  const activeOrders = data?.orders.filter((o) => !o.archived) || [];
  const closed = activeOrders.filter((o) => o.status === 'cerrado');
  const open = activeOrders.filter((o) => o.status !== 'cerrado');
  const lowStock =
    data?.products.filter(
      (p) => !p.archived && !isConfiguredProduct(p) && p.stock <= 2,
    ) || [];
  const customer = (id: string) =>
    data?.contacts.find((c) => c.id === id)?.name || 'Cliente';
  const contacts =
    data?.contacts.filter(
      (c) =>
        c.kind === (module === 'proveedores' ? 'supplier' : 'customer') &&
        !!c.archived === archived &&
        search(c.name, c.contact, c.email, c.phone),
    ) || [];
  const products =
    data?.products.filter(
      (p) =>
        !isConfiguredProduct(p) &&
        !!p.archived === archived &&
        search(p.name, p.sku) &&
        (filter === 'all' || p.category === filter) &&
        (!stocked || p.stock > 0),
    ) || [];
  const liveSelected =
    module === 'productos'
      ? selected.filter((id) =>
          data?.products.some((product) => product.id === id),
        )
      : [];
  const visibleIds = products.map((p) => p.id);
  const selectedVisible = liveSelected.filter((id) => visibleIds.includes(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;
  function selectVisible(checked: boolean) {
    S(
      checked
        ? [...new Set([...liveSelected, ...visibleIds])]
        : liveSelected.filter((id) => !visibleIds.includes(id)),
    );
  }
  function toggleProduct(id: string, checked: boolean) {
    S(
      checked
        ? [...liveSelected, id]
        : liveSelected.filter((selectedId) => selectedId !== id),
    );
  }
  const orders =
    data?.orders.filter(
      (o) =>
        !!o.archived === archived &&
        search(o.number, customer(o.customer_id)) &&
        (filter === 'all' || o.status === filter),
    ) || [];
  function renderArchiveButton({ entity, record }: Archived) {
    return (
      <button
        className="icon-button"
        title={record.archived ? 'Restaurar' : 'Archivar'}
        aria-label={`${record.archived ? 'Restaurar' : 'Archivar'} ${'number' in record ? record.number : record.name}`}
        onClick={() => C({ entity, record })}
      >
        {record.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
      </button>
    );
  }
  function renderNoRows({ text }: { text: string }) {
    return (
      <Empty className="empty">
        <EmptyHeader>
          <EmptyTitle>{text}</EmptyTitle>
          <EmptyDescription>
            {query || filter !== 'all' || stocked
              ? 'Probá con otra búsqueda o filtro.'
              : archived
                ? 'Los registros archivados aparecerán aquí.'
                : 'Creá el primer registro para empezar.'}
          </EmptyDescription>
        </EmptyHeader>
        {!archived && !query && !stocked && (
          <button className="secondary" onClick={create}>
            <Plus size={16} /> Crear registro
          </button>
        )}
      </Empty>
    );
  }
  function renderOrderTable({
    rows,
    compact = false,
  }: {
    rows: Order[];
    compact?: boolean;
  }) {
    return (
      <>
        <div className="desktop-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido / cliente</TableHead>
                <TableHead>Estado</TableHead>
                {!compact && <TableHead>Entrega</TableHead>}
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {!compact && (
                  <TableHead className="text-right">Ganancia</TableHead>
                )}
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <button
                      className="record-link"
                      onClick={() => P({ type: 'order', record: o })}
                    >
                      {o.number}
                    </button>
                    <small>
                      {customer(o.customer_id)} · {o.date}
                    </small>
                  </TableCell>
                  <TableCell>
                    <Status value={o.status} />
                  </TableCell>
                  {!compact && (
                    <TableCell>{o.delivery || 'Sin definir'}</TableCell>
                  )}
                  <TableCell>
                    <Status value={payStatus(o)} />
                    {!compact && <small>{money(o.paid)} cobrado</small>}
                  </TableCell>
                  <TableCell className="text-right amount">
                    {money(o.total)}
                  </TableCell>
                  {!compact && (
                    <TableCell className="text-right amount">
                      {money(o.total - o.cost)}
                    </TableCell>
                  )}
                  <TableCell>
                    {compact ? (
                      <button
                        aria-label={`Abrir ${o.number}`}
                        className="icon-button"
                        onClick={() => P({ type: 'order', record: o })}
                      >
                        <ChevronRight size={18} />
                      </button>
                    ) : (
                      renderArchiveButton({ entity: 'orders', record: o })
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="record-card-list">
          {rows.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              customerName={customer(o.customer_id)}
              money={money}
              compact={compact}
              archiveButton={renderArchiveButton({
                entity: 'orders',
                record: o,
              })}
              onOpen={() => P({ type: 'order', record: o })}
            />
          ))}
        </div>
      </>
    );
  }
  const panelTitle =
    panel?.type === 'settings'
      ? 'Configuración'
      : panel?.type === 'stock' || panel?.type === 'inventory'
        ? `Stock · ${panel.record.name}`
        : panel?.type === 'order'
          ? panel.record?.number || 'Nuevo pedido'
          : panel?.type === 'product' &&
              panel.record &&
              isConfiguredProduct(panel.record)
            ? `Configurar ${panel.record.name}`
            : panel?.type === 'product'
              ? panel.record?.name || 'Nuevo producto'
            : panel?.type === 'supplier'
              ? panel.record?.name || 'Nuevo proveedor'
              : panel?.record?.name || 'Nuevo cliente';
  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <a className="brand" href="/" aria-label="Iconic CRM">
              <Image
                unoptimized
                src="/logo-iconic.png"
                alt="Iconic"
                width={89}
                height={100}
                priority
              />
            </a>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {nav.map(({ id, title, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={module === id}
                    render={
                      <a
                        aria-label={title}
                        href={id === 'dashboard' ? '/' : `/${id}`}
                      />
                    }
                  >
                    <Icon />
                    {title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <button
              className="settings-button"
              onClick={() => P({ type: 'settings' })}
            >
              <Settings size={17} /> Configuración
            </button>
            <div className="sidebar-foot">
              <span className="avatar">IC</span>
              <span>
                Iconic Equestrian<small>Gestión comercial · {currency}</small>
              </span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="topbar">
            <a className="topbar-logo" href="/" aria-label="Iconic CRM">
              <Image
                unoptimized
                src="/logo-iconic.png"
                alt="Iconic"
                width={225}
                height={253}
                priority
              />
            </a>
            <SidebarTrigger />
            <div className="topbar-end">
              <button
                className="icon-button topbar-settings"
                aria-label="Configuración"
                onClick={() => P({ type: 'settings' })}
              >
                <Settings size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Actualizar datos"
                onClick={() => {
                  E('');
                  void refresh()
                    .then(() => N('Datos actualizados.'))
                    .catch((e) => E(e.message));
                }}
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </header>
          <main className="workspace">
            <div className="page-title">
              <div>
                <p className="eyebrow">
                  {module === 'dashboard'
                    ? 'TU NEGOCIO, EN PERSPECTIVA'
                    : module === 'tablero'
                      ? 'RESULTADO Y CAJA'
                      : module === 'tareas'
                        ? 'SEGUIMIENTO OPERATIVO'
                        : 'ICONIC · GESTIÓN COMERCIAL'}
                </p>
                <h1>{title}</h1>
                <p>
                  {module === 'dashboard'
                    ? 'Una mirada a las ventas, los clientes y lo que viene.'
                    : module === 'tablero'
                      ? 'Facturación, costos, ganancia y cashouts de socios.'
                      : module === 'tareas'
                        ? 'Pendientes, responsables y avance de cada trabajo.'
                        : module === 'productos'
                          ? 'Tu catálogo, sus precios y cada movimiento de stock.'
                          : module === 'clientes'
                            ? 'Cada relación, con su historia y su próxima oportunidad.'
                            : module === 'proveedores'
                              ? 'Las personas y talleres detrás de tus productos.'
                              : 'De la primera consulta a la entrega.'}
                </p>
              </div>
              {module !== 'tareas' && module !== 'tablero' && (
                <button
                  className="primary"
                  disabled={!data?.categories.length}
                  onClick={create}
                >
                  <Plus size={18} />
                  {module === 'productos'
                    ? 'Nuevo producto'
                    : module === 'clientes'
                      ? 'Nuevo cliente'
                      : module === 'proveedores'
                        ? 'Nuevo proveedor'
                        : 'Nuevo pedido'}
                </button>
              )}
            </div>
            <ErrorBox message={error} />
            {!data ? (
              <div className="metrics">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : !data.categories.length ? (
              <section className="onboarding">
                <span className="onboarding-icon">
                  <Package size={32} />
                </span>
                <h2>Bienvenido a Iconic</h2>
                <p>
                  Tu espacio para gestionar productos de polo, equitación y
                  salto.
                </p>
                <div>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => initialize(true)}
                  >
                    Explorar con datos de ejemplo <ArrowRight size={17} />
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => initialize(false)}
                  >
                    Empezar con una base vacía
                  </button>
                </div>
                <small>
                  Los ejemplos incluyen productos, clientes y pedidos ficticios.
                </small>
              </section>
            ) : module === 'dashboard' ? (
              <>
                <div className="metrics">
                  {[
                    {
                      label: 'Ventas cerradas',
                      value: money(closed.reduce((s, o) => s + o.total, 0)),
                      hint: `${closed.length} pedidos cerrados`,
                      icon: CircleDollarSign,
                    },
                    {
                      label: 'Ganancia bruta',
                      value: money(
                        closed.reduce((s, o) => s + o.total - o.cost, 0),
                      ),
                      hint: 'Venta menos costo del producto',
                      icon: TrendingUp,
                    },
                    {
                      label: 'Pedidos en curso',
                      value: String(open.length).padStart(2, '0'),
                      hint: `${money(open.reduce((s, o) => s + o.total, 0))} en cartera`,
                      icon: ShoppingBag,
                    },
                    {
                      label: 'Clientes activos',
                      value: String(
                        data.contacts.filter(
                          (c) => c.kind === 'customer' && !c.archived,
                        ).length,
                      ).padStart(2, '0'),
                      hint: 'Relaciones para seguir creciendo',
                      icon: Users,
                    },
                  ].map(({ label, value, hint, icon: Icon }) => (
                    <article className="metric" key={label}>
                      <p>
                        {label}
                        <Icon size={18} />
                      </p>
                      <strong>{value}</strong>
                      <span>{hint}</span>
                    </article>
                  ))}
                </div>
                <div className="dashboard-grid">
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Pedidos recientes</h2>
                      <a href="/pedidos">
                        Ver todos <ArrowUpRight size={15} />
                      </a>
                    </div>
                    {activeOrders.length
                      ? renderOrderTable({
                          rows: activeOrders.slice(0, 6),
                          compact: true,
                        })
                      : renderNoRows({
                          text: 'Tu pr\u00f3ximo pedido empieza ac\u00e1',
                        })}
                  </section>
                  <section className="attention">
                    <div className="panel-heading">
                      <h2>Para tener en cuenta</h2>
                      <span className="count">{lowStock.length}</span>
                    </div>
                    <p className="hint">Productos con 2 unidades o menos</p>
                    {lowStock.length ? (
                      lowStock.slice(0, 5).map((p) => (
                        <button
                          className="attention-row"
                          key={p.id}
                          onClick={() => P({ type: 'stock', record: p })}
                        >
                          <ProductPhoto name={p.name} url={p.photos[0]} />
                          <span>
                            <b>{p.name}</b>
                            <small>
                              {isConfiguredProduct(p) ? 'Configurable' : p.sku}
                            </small>
                          </span>
                          <strong>
                            {p.stock}
                            <small>uds.</small>
                          </strong>
                        </button>
                      ))
                    ) : (
                      <p className="hint">No hay alertas de stock.</p>
                    )}
                    <div className="pending-money">
                      <span>Pendiente de cobro</span>
                      <strong>
                        {money(
                          activeOrders.reduce(
                            (s, o) => s + o.total - o.paid,
                            0,
                          ),
                        )}
                      </strong>
                      <p>De todos los pedidos activos</p>
                    </div>
                  </section>
                  <section className="panel flow-panel">
                    <div className="panel-heading">
                      <h2>El recorrido de tus pedidos</h2>
                      <span>Estado actual</span>
                    </div>
                    <div className="pipeline">
                      {['nuevo', 'abierto', 'en producción', 'cerrado'].map(
                        (s, i) => (
                          <a
                            href={`/pedidos?estado=${encodeURIComponent(s)}`}
                            key={s}
                          >
                            <span>
                              0{i + 1} / {s}
                            </span>
                            <strong>
                              {
                                activeOrders.filter((o) => o.status === s)
                                  .length
                              }
                            </strong>
                            <div className="pipeline-track">
                              <div
                                style={{
                                  width: `${activeOrders.length ? (activeOrders.filter((o) => o.status === s).length / activeOrders.length) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </a>
                        ),
                      )}
                    </div>
                  </section>
                  <section className="panel followup">
                    <div className="panel-heading">
                      <h2>Seguimiento comercial</h2>
                      <a href="/clientes" aria-label="Ver clientes">
                        <ArrowUpRight size={17} />
                      </a>
                    </div>
                    {data.contacts
                      .filter((c) => c.kind === 'customer' && !c.archived)
                      .slice(0, 3)
                      .map((c) => {
                        const last = closed.find((o) => o.customer_id === c.id);
                        return (
                          <button
                            key={c.id}
                            className="followup-row"
                            onClick={() => P({ type: 'customer', record: c })}
                          >
                            <span className="avatar">
                              {c.name
                                .split(' ')
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join('')}
                            </span>
                            <span>
                              <b>{c.name}</b>
                              <small>
                                {last
                                  ? `Última compra ${last.date}`
                                  : 'Primera compra por concretar'}
                              </small>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        );
                      })}
                    {!data.contacts.some(
                      (c) => c.kind === 'customer' && !c.archived,
                    ) && (
                      <p className="hint">
                        Agregá clientes para iniciar el seguimiento.
                      </p>
                    )}
                  </section>
                </div>
                <p className="report-note">
                  Acumulado de todos los períodos · Ganancia bruta sin
                  impuestos, comisiones ni gastos operativos.
                </p>
              </>
            ) : module === 'tablero' ? (
              <AccountBoard data={data} save={save} />
            ) : module === 'tareas' ? (
              <section className="panel records">
                <Empty className="empty">
                  <EmptyHeader>
                    <EmptyTitle>Seguimiento de tareas</EmptyTitle>
                    <EmptyDescription>
                      Esta sección va a concentrar pendientes, responsables y
                      avance. Todavía no hay un flujo definido: cuando lo
                      definamos, armamos estados, plazos y cómo se relaciona con
                      pedidos y clientes.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </section>
            ) : (
              <>
                {module === 'productos' && data && !archived ? (
                  <TypeCards
                    data={data}
                    onOpen={(product) => P({ type: 'product', record: product })}
                    onStock={(product) => P({ type: 'stock', record: product })}
                    onViewStock={(product) =>
                      P({ type: 'inventory', record: product })
                    }
                  />
                ) : null}
                <section className="panel records">
                <div className="toolbar">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar"
                      placeholder={
                        module === 'productos'
                          ? 'Buscar producto o SKU…'
                          : module === 'pedidos'
                            ? 'Buscar pedido o cliente…'
                            : 'Buscar nombre, email o teléfono…'
                      }
                      value={query}
                      onChange={(e) => Q(e.target.value)}
                    />
                  </label>
                  {module === 'productos' && (
                    <>
                      <Pick
                        label="Filtrar categoría"
                        value={filter}
                        onChange={F}
                        options={[
                          { value: 'all', label: 'Todas las categorías' },
                          ...data.categories
                            .filter((c) => !isConfiguredCategory(c.id))
                            .map((c) => ({
                              value: c.id,
                              label: c.name,
                            })),
                        ]}
                      />
                      <fieldset className="seg">
                        <legend className="sr-only">
                          Disponibilidad de stock
                        </legend>
                        <button
                          type="button"
                          className={stocked ? '' : 'selected'}
                          aria-pressed={!stocked}
                          onClick={() => T(false)}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          className={stocked ? 'selected' : ''}
                          aria-pressed={stocked}
                          onClick={() => T(true)}
                        >
                          Con stock
                        </button>
                      </fieldset>
                    </>
                  )}{' '}
                  {module === 'pedidos' && (
                    <Pick
                      label="Filtrar estado"
                      value={filter}
                      onChange={F}
                      options={[
                        'all',
                        'nuevo',
                        'abierto',
                        'en producción',
                        'cerrado',
                      ].map((value) => ({
                        value,
                        label: value === 'all' ? 'Todos los estados' : value,
                      }))}
                    />
                  )}
                  <button
                    className={`secondary ${archived ? 'selected' : ''}`}
                    onClick={() => A(!archived)}
                  >
                    <Archive size={16} />
                    {archived ? 'Ver activos' : 'Archivados'}
                  </button>
                  <span className="result-count">
                    {module === 'productos'
                      ? products.length
                      : module === 'pedidos'
                        ? orders.length
                        : contacts.length}{' '}
                    registros
                  </span>
                </div>
                {module === 'productos' && liveSelected.length ? (
                  <ProductBulkBar
                    count={liveSelected.length}
                    categories={data.categories}
                    suppliers={data.contacts
                      .filter(
                        (contact) =>
                          contact.kind === 'supplier' && !contact.archived,
                      )
                      .map((contact) => ({
                        id: contact.id,
                        name: contact.name,
                      }))}
                    busy={busy}
                    onClear={() => S([])}
                    onApply={applyBulk}
                  />
                ) : null}
                {module === 'productos' ? (
                  products.length ? (
                    <>
                      <div className="desktop-table">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="row-select">
                                <SelectCheck
                                  label={
                                    allVisibleSelected
                                      ? 'Quitar toda la selección visible'
                                      : 'Seleccionar todos los productos visibles'
                                  }
                                  checked={allVisibleSelected}
                                  mixed={someVisibleSelected}
                                  onChange={selectVisible}
                                />
                              </TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead>Categoría / proveedor</TableHead>
                              <TableHead className="text-right">
                                Precio de costo
                              </TableHead>
                              <TableHead className="text-right">
                                Precio lista
                              </TableHead>
                              <TableHead className="text-right">
                                Friends & Family
                              </TableHead>
                              <TableHead className="text-right">
                                Margen lista
                              </TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>
                                <span className="sr-only">Acciones</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((p) => {
                              const costPending =
                                p.attributes.Costo === 'Pendiente de definir';
                              const pricePending =
                                p.attributes['Precio de lista'] ===
                                'Pendiente de definir';
                              const ffPending =
                                p.attributes['Precio F&F'] ===
                                'Pendiente de definir';
                              const supplier = data.contacts.find(
                                (c) => c.id === p.supplier_id,
                              )?.name;
                              const openProduct = () =>
                                P({ type: 'product', record: p });
                              return (
                                <TableRow
                                  key={p.id}
                                  className={`clickable-row${liveSelected.includes(p.id) ? ' is-selected' : ''}`}
                                >
                                  <TableCell className="row-select">
                                    <SelectCheck
                                      label={`Seleccionar ${p.name}`}
                                      checked={liveSelected.includes(p.id)}
                                      onChange={(checked) =>
                                        toggleProduct(p.id, checked)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      className="row-hit"
                                      aria-label={`Ver ficha de ${p.name}`}
                                      onClick={openProduct}
                                    />
                                    <div className="product-cell">
                                      <ProductPhoto
                                        name={p.name}
                                        url={p.photos[0]}
                                      />
                                      <div>
                                        <span className="record-link">
                                          {p.name}
                                        </span>
                                        <small>
                                          {isConfiguredProduct(p)
                                            ? 'Configurable'
                                            : p.sku}
                                        </small>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {
                                      data.categories.find(
                                        (c) => c.id === p.category,
                                      )?.name
                                    }
                                    <small
                                      className={
                                        supplier ? undefined : 'pending-text'
                                      }
                                    >
                                      {supplier || 'Sin proveedor'}
                                    </small>
                                  </TableCell>
                                  <TableCell className="text-right amount">
                                    {costPending ? (
                                      <span className="pending-text">
                                        Pendiente
                                      </span>
                                    ) : (
                                      money(p.cost)
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right amount">
                                    {pricePending ? (
                                      <span className="pending-text">
                                        Pendiente
                                      </span>
                                    ) : (
                                      money(p.price)
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right amount">
                                    {ffPending || !p.price ? (
                                      <span className="pending-text">
                                        Pendiente
                                      </span>
                                    ) : (
                                      money(friendsPrice(p))
                                    )}
                                    <small
                                      className={
                                        ffPending || !p.price
                                          ? 'pending-text'
                                          : undefined
                                      }
                                    >
                                      {ffPending || !p.price
                                        ? 'Completar precio'
                                        : `${
                                            Math.round(
                                              (1 - friendsPrice(p) / p.price) *
                                                10000,
                                            ) / 100
                                          }% de descuento`}
                                    </small>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {costPending || pricePending ? (
                                      <span className="pending-text">
                                        Pendiente
                                      </span>
                                    ) : (
                                      `${margin(p.price, p.cost) ?? '—'}%`
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`stock-pill ${p.stock <= 2 ? 'low' : ''}`}
                                    >
                                      {p.stock} uds.
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="row-actions">
                                      {!archived && (
                                        <button
                                          className="icon-button"
                                          title="Registrar movimiento"
                                          aria-label={`Registrar stock de ${p.name}`}
                                          onClick={() =>
                                            P({ type: 'stock', record: p })
                                          }
                                        >
                                          <ArrowDownUp size={17} />
                                        </button>
                                      )}
                                      {renderArchiveButton({
                                        entity: 'products',
                                        record: p,
                                      })}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="record-card-list">
                        <div className="record-card-toolbar">
                          <SelectCheck
                            label={
                              allVisibleSelected
                                ? 'Quitar toda la selección visible'
                                : 'Seleccionar todos los productos visibles'
                            }
                            checked={allVisibleSelected}
                            mixed={someVisibleSelected}
                            onChange={selectVisible}
                          />
                          <span>
                            {allVisibleSelected
                              ? 'Quitar selección'
                              : 'Seleccionar visibles'}
                          </span>
                        </div>
                        {products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            categoryName={
                              data.categories.find((c) => c.id === p.category)
                                ?.name
                            }
                            supplierName={
                              data.contacts.find((c) => c.id === p.supplier_id)
                                ?.name
                            }
                            selected={liveSelected.includes(p.id)}
                            archived={archived}
                            money={money}
                            onOpen={() => P({ type: 'product', record: p })}
                            onToggle={(checked) => toggleProduct(p.id, checked)}
                            onStock={() => P({ type: 'stock', record: p })}
                            archiveButton={renderArchiveButton({
                              entity: 'products',
                              record: p,
                            })}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    renderNoRows({
                      text: stocked
                        ? 'No hay productos con stock'
                        : 'No hay productos para mostrar',
                    })
                  )
                ) : module === 'pedidos' ? (
                  orders.length ? (
                    renderOrderTable({ rows: orders })
                  ) : (
                    renderNoRows({ text: 'No hay pedidos para mostrar' })
                  )
                ) : contacts.length ? (
                  <>
                    <div className="desktop-table">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {module === 'proveedores'
                                ? 'Proveedor / contacto'
                                : 'Cliente / contacto'}
                            </TableHead>
                            <TableHead>Contacto directo</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>
                              {module === 'proveedores'
                                ? 'Productos'
                                : 'Última compra'}
                            </TableHead>
                            <TableHead>
                              <span className="sr-only">Acciones</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>
                                <div className="product-cell">
                                  <span className="avatar">
                                    {initials(c.name)}
                                  </span>
                                  <div>
                                    <button
                                      className="record-link"
                                      onClick={() =>
                                        P({ type: c.kind, record: c })
                                      }
                                    >
                                      {c.name}
                                    </button>
                                    <small>
                                      {c.contact || 'Sin persona de contacto'}
                                      {c.kind === 'supplier' && c.title
                                        ? ` · ${c.title}`
                                        : ''}
                                    </small>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {c.phone && (
                                  <a
                                    className="contact-phone"
                                    href={whatsapp(c.phone) || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <MessageCircle size={15} />
                                    {c.phone}
                                  </a>
                                )}
                                {c.kind === 'supplier' &&
                                whatsappGroup(c.whatsapp_group) ? (
                                  <a
                                    className="contact-phone"
                                    href={
                                      whatsappGroup(c.whatsapp_group) || '#'
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <MessageCircle size={15} />
                                    Grupo WhatsApp
                                  </a>
                                ) : null}
                                {c.email ? (
                                  <a
                                    className="email"
                                    href={`mailto:${c.email}`}
                                  >
                                    {c.email}
                                  </a>
                                ) : (
                                  <small>Sin email</small>
                                )}
                                {c.website && (
                                  <a
                                    className="email"
                                    href={c.website}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Página web ↗
                                  </a>
                                )}
                              </TableCell>
                              <TableCell>
                                {c.address || 'Sin dirección'}
                              </TableCell>
                              <TableCell>
                                {c.kind === 'supplier'
                                  ? `${data.products.filter((p) => p.supplier_id === c.id && !p.archived).length} productos`
                                  : closed.find((o) => o.customer_id === c.id)
                                      ?.date || 'Sin compras'}
                                {c.kind === 'customer' && (
                                  <small>
                                    {
                                      data.orders.filter(
                                        (o) => o.customer_id === c.id,
                                      ).length
                                    }{' '}
                                    pedidos
                                  </small>
                                )}
                              </TableCell>
                              <TableCell>
                                {renderArchiveButton({
                                  entity: 'contacts',
                                  record: c,
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="record-card-list">
                      {contacts.map((c) => (
                        <ContactCard
                          key={c.id}
                          contact={c}
                          productCount={
                            data.products.filter(
                              (p) => p.supplier_id === c.id && !p.archived,
                            ).length
                          }
                          lastPurchase={
                            closed.find((o) => o.customer_id === c.id)?.date
                          }
                          orderCount={
                            data.orders.filter((o) => o.customer_id === c.id)
                              .length
                          }
                          archiveButton={renderArchiveButton({
                            entity: 'contacts',
                            record: c,
                          })}
                          onOpen={() => P({ type: c.kind, record: c })}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  renderNoRows({ text: `No hay ${module} para mostrar` })
                )}
              </section>
              </>
            )}
          </main>
        </SidebarInset>
        <nav className="mobile-tabbar" aria-label="Navegación principal">
          {nav.map(({ id, short, icon: Icon }) => (
            <a
              key={id}
              href={id === 'dashboard' ? '/' : `/${id}`}
              className={`mobile-tab ${module === id ? 'active' : ''}`}
              aria-current={module === id ? 'page' : undefined}
            >
              <Icon size={22} />
              {short}
            </a>
          ))}
        </nav>
        <Dialog
          open={!!panel}
          onOpenChange={(open) => {
            if (!open) P(null);
          }}
        >
          <DialogContent
            className="crm-dialog"
            style={{
              maxWidth:
                panel?.type === 'stock' || panel?.type === 'inventory'
                  ? '640px'
                  : '950px',
            }}
          >
            <DialogHeader>
              {panel?.type === 'inventory' ? (
                <div className="stock-dialog-heading">
                  <div>
                    <DialogTitle>{panelTitle}</DialogTitle>
                    <DialogDescription>
                      Unidades disponibles.
                    </DialogDescription>
                  </div>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      const record =
                        data?.products.find((p) => p.id === panel.record.id) ??
                        panel.record;
                      P({
                        type: 'stock',
                        record,
                        back: 'inventory',
                      });
                    }}
                  >
                    <Plus size={16} />
                    Agregar stock
                  </button>
                </div>
              ) : (
                <>
                  <DialogTitle>{panelTitle}</DialogTitle>
                  <DialogDescription>
                    {panel?.type === 'stock'
                      ? panel.movement
                        ? 'Editá este registro de stock.'
                        : 'Cada ingreso y salida queda en el historial.'
                      : panel?.type === 'order'
                        ? 'Precios, costos y características se guardan con el pedido.'
                        : panel?.type === 'product' &&
                            panel.record &&
                            isConfiguredProduct(panel.record)
                          ? 'Definí el precio base y el de cada variante. El pedido usa estos valores.'
                          : panel?.type === 'product' &&
                              panel.record &&
                              !panel.editing
                            ? 'Ficha completa del producto.'
                            : panel?.type === 'product'
                              ? 'Editá precios, fotos y características.'
                              : 'Información de tu gestión comercial.'}
                  </DialogDescription>
                </>
              )}
            </DialogHeader>
            {panel &&
              data &&
              (panel.type === 'product' ? (
                panel.record &&
                isConfiguredProduct(
                  data.products.find((p) => p.id === panel.record?.id) ??
                    panel.record,
                ) ? (
                  <TypeConfigForm
                    key={
                      (
                        data.products.find((p) => p.id === panel.record?.id) ??
                        panel.record
                      ).version
                    }
                    record={
                      data.products.find((p) => p.id === panel.record?.id) ??
                      panel.record
                    }
                    data={data}
                    save={async (body) => {
                      await save(body);
                      P(null);
                    }}
                    onStock={() => {
                      const record =
                        data.products.find((p) => p.id === panel.record?.id) ??
                        panel.record;
                      if (record) P({ type: 'stock', record });
                    }}
                  />
                ) : panel.record && !panel.editing ? (
                  <ProductDetail
                    record={
                      data.products.find((p) => p.id === panel.record?.id) ??
                      panel.record
                    }
                    data={data}
                    onEdit={() => {
                      const record =
                        data.products.find((p) => p.id === panel.record?.id) ??
                        panel.record;
                      if (record) P({ type: 'product', record, editing: true });
                    }}
                    onStock={() => {
                      const record =
                        data.products.find((p) => p.id === panel.record?.id) ??
                        panel.record;
                      if (record) P({ type: 'stock', record });
                    }}
                  />
                ) : (
                  <ProductForm
                    record={panel.record}
                    data={data}
                    save={save}
                    onCancel={
                      panel.record
                        ? () =>
                            P({
                              type: 'product',
                              record: panel.record,
                            })
                        : undefined
                    }
                  />
                )
              ) : panel.type === 'order' ? (
                <OrderForm record={panel.record} data={data} save={save} />
              ) : panel.type === 'inventory' ? (
                <StockOverview
                  record={
                    data.products.find((p) => p.id === panel.record.id) ??
                    panel.record
                  }
                  data={data}
                  onEdit={(movement) =>
                    P({
                      type: 'stock',
                      record:
                        data.products.find((p) => p.id === panel.record.id) ??
                        panel.record,
                      movement,
                      back: 'inventory',
                    })
                  }
                />
              ) : panel.type === 'stock' ? (
                <StockForm
                  key={panel.movement?.id || 'new'}
                  record={panel.record}
                  data={data}
                  save={save}
                  movement={panel.movement}
                />
              ) : panel.type === 'settings' ? (
                <SettingsForm data={data} save={save} />
              ) : (
                <ContactForm
                  kind={panel.type}
                  record={panel.record}
                  data={data}
                  save={save}
                />
              ))}
          </DialogContent>
        </Dialog>
        <AlertDialog
          open={!!confirm}
          onOpenChange={(open) => {
            if (!open) C(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm?.record.archived
                  ? 'Restaurar registro'
                  : 'Archivar registro'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm?.record.archived
                  ? 'El registro volverá a estar disponible.'
                  : 'Se ocultará de los listados activos. Su historial se conserva y podés restaurarlo luego. Los pedidos cerrados o con cobros no se pueden archivar.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={async () => {
                  if (!confirm) return;
                  B(true);
                  try {
                    await post({
                      action: 'archive',
                      entity: confirm.entity,
                      id: confirm.record.id,
                      version: confirm.record.version,
                      archived: confirm.record.archived ? 0 : 1,
                    });
                    C(null);
                    await refresh();
                    N('Registro actualizado.');
                  } catch (e) {
                    E((e as Error).message);
                  } finally {
                    B(false);
                  }
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarProvider>
      {notice ? (
        <output key={notice.id} className="notice">
          <Check size={16} strokeWidth={2.5} aria-hidden />
          <span>{notice.text}</span>
          <button onClick={() => N('')} aria-label="Cerrar aviso">
            ×
          </button>
        </output>
      ) : null}
    </>
  );
}
