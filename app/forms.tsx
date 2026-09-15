'use client';
/* eslint-disable react/react-compiler -- Compiler analysis crashes on dynamic order snapshots (Invariant phi predecessor); React Compiler is not enabled. */
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ORDER_STATUSES,
  actorName,
  orderIsLocked,
  type Contact,
  type Product,
  type Order,
  type Data,
  type Option,
  type Item,
  type Movement,
  type Partner,
} from '@/lib/types';
import {
  decimal,
  parseDecimal,
  parsePercent,
  percent,
  formatMoney,
  margin,
  markup,
  lineTotals,
  promoPrice,
  friendsPrice,
} from '@/lib/money';
import {
  SHARE_TOTAL,
  parseShare,
  shareInput,
  shareLabel,
  sharesTotal,
} from '@/lib/account';
import { closedFields, findVariantProduct, skuFields } from '@/lib/variants';
import {
  configuredKindOf,
  defaultConfig,
  configLabels,
  extraTotals,
  isConfiguredCategory,
  isConfiguredProduct,
  parseConfig,
  STOCK_PLACES,
  itemStockHold,
  reservedHolds,
  stockAvailability,
  stockKey,
  stockForConfig,
  stockAtPlace,
  stockPlaceLabel,
  summarizeConfig,
  describeConfigured,
  selectedReferenceIds,
  type ProductConfig,
  type StockHold,
} from '@/lib/configure';
import { Configurator } from './configure-form';
import { OrderProductPicker } from './order-product-picker';
import {
  Field,
  Pick,
  Check,
  Photos,
  ErrorBox,
  Status,
  StatusMenu,
  OrderPayMenu,
  OrderDeliveryMenu,
  ProductPhoto,
} from './ui';
import {
  Plus,
  Trash2,
  MessageCircle,
  ArrowUpRight,
  Pencil,
} from 'lucide-react';
import { whatsapp, whatsappGroup } from '@/lib/whatsapp';
export type Save = (body: Record<string, unknown>) => Promise<void>;
export { whatsapp, whatsappGroup };
const options = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
function snapshotConfig(config?: ProductConfig) {
  return JSON.stringify(config ?? null);
}
const NEW_CUSTOMER = '__new__';
const today = () =>
  new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
function Footer({
  busy,
  label = 'Guardar cambios',
}: {
  busy: boolean;
  label?: string;
}) {
  return (
    <div className="form-footer">
      <span>Los campos con * son obligatorios.</span>
      <button className="primary" disabled={busy}>
        {busy ? 'Guardando…' : label}
      </button>
    </div>
  );
}
export function ProductBulkBar({
  count,
  categories,
  suppliers,
  busy,
  onClear,
  onApply,
}: {
  count: number;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  busy: boolean;
  onClear: () => void;
  onApply: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [kind, K] = useState<'category' | 'price' | 'supplier' | null>(null),
    [category, C] = useState(categories[0]?.id || ''),
    [supplier, S] = useState(suppliers[0]?.id || ''),
    [percent, P] = useState('10'),
    [error, E] = useState('');
  return (
    <section
      className="bulk-bar"
      aria-label="Acciones sobre productos seleccionados"
    >
      <div className="bulk-summary">
        <strong>
          {count} {count === 1 ? 'producto' : 'productos'}
        </strong>
        <span>Seleccionados para editar en lote</span>
      </div>
      <div className="bulk-actions">
        <button
          className={`secondary ${kind === 'category' ? 'selected' : ''}`}
          type="button"
          onClick={() => K(kind === 'category' ? null : 'category')}
        >
          Categoría
        </button>
        <button
          className={`secondary ${kind === 'price' ? 'selected' : ''}`}
          type="button"
          onClick={() => K(kind === 'price' ? null : 'price')}
        >
          Aumentar precio
        </button>
        <button
          className={`secondary ${kind === 'supplier' ? 'selected' : ''}`}
          type="button"
          onClick={() => K(kind === 'supplier' ? null : 'supplier')}
        >
          Proveedor
        </button>
        <button className="ghost" type="button" onClick={onClear}>
          Quitar selección
        </button>
      </div>
      {kind ? (
        <form
          className="bulk-form"
          onSubmit={async (e) => {
            e.preventDefault();
            E('');
            try {
              if (kind === 'category') {
                if (!category) throw new Error('Elegí una categoría.');
                await onApply({ kind: 'category', category });
              } else if (kind === 'supplier') {
                if (!supplier) throw new Error('Elegí un proveedor.');
                await onApply({ kind: 'supplier', supplier_id: supplier });
              } else {
                await onApply({
                  kind: 'price',
                  price_increase_bp: parseDecimal(percent),
                });
              }
              K(null);
            } catch (err) {
              E((err as Error).message);
            }
          }}
        >
          {kind === 'category' ? (
            <Field label="Nueva categoría *">
              <Pick
                label="Nueva categoría"
                value={category}
                onChange={C}
                options={categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </Field>
          ) : null}
          {kind === 'supplier' ? (
            <Field label="Proveedor *">
              <Pick
                label="Proveedor"
                value={supplier}
                onChange={S}
                options={suppliers.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </Field>
          ) : null}
          {kind === 'price' ? (
            <Field label="Aumento sobre precio de lista (%) *">
              <input
                required
                inputMode="decimal"
                value={percent}
                onChange={(e) => P(e.target.value)}
                placeholder="10"
              />
            </Field>
          ) : null}
          {kind === 'price' ? (
            <p className="hint">
              Se aplica el mismo porcentaje al precio de lista, al F&amp;F
              exacto y al precio promocional manual. El costo no cambia. Los
              productos con precio de lista pendiente se omiten.
            </p>
          ) : null}
          {kind === 'supplier' && !suppliers.length ? (
            <p className="hint">
              Todavía no hay proveedores. Cargá uno en Proveedores para
              asignarlo.
            </p>
          ) : null}
          <ErrorBox message={error} />
          <button
            className="primary"
            disabled={busy || (kind === 'supplier' && !suppliers.length)}
          >
            {busy ? 'Aplicando…' : 'Aplicar a la selección'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
export function ContactForm({
  record,
  kind,
  data,
  save,
}: {
  record?: Contact;
  kind: 'supplier' | 'customer';
  data: Data;
  save: Save;
}) {
  const [f, set] = useState({
    name: record?.name || '',
    contact: record?.contact || '',
    title: record?.title || '',
    address: record?.address || '',
    phone: record?.phone || '',
    email: record?.email || '',
    website: record?.website || '',
    whatsapp_group: record?.whatsapp_group || '',
    notes: record?.notes || '',
    fiscal: {
      name: record?.fiscal.name || '',
      taxId: record?.fiscal.taxId || '',
      address: record?.fiscal.address || '',
      vat: record?.fiscal.vat || 'Consumidor final',
    },
  });
  const [busy, B] = useState(false);
  const [error, E] = useState('');
  const purchased = data.orders.filter(
    (o) => o.customer_id === record?.id && orderIsLocked(o.status),
  );
  const bought = new Set(
    purchased.flatMap((o) => o.items.map((i) => i.product_id)),
  );
  const supplied = data.products.filter(
    (p) => p.supplier_id === record?.id && !p.archived,
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        E('');
        try {
          await save({
            action: 'contact',
            ...f,
            kind,
            id: record?.id,
            version: record?.version,
          });
        } catch (e) {
          E((e as Error).message);
        } finally {
          B(false);
        }
      }}
    >
      <ErrorBox message={error} />
      <div className="form-grid">
        {(kind === 'supplier'
          ? ([
              ['name', 'Nombre / empresa *'],
              ['contact', 'Persona de contacto'],
              ['title', 'Título'],
              ['phone', 'Teléfono internacional (ej. 54911…)'],
              ['whatsapp_group', 'Grupo WhatsApp'],
              ['email', 'Email'],
              ['address', 'Dirección'],
              ['website', 'Página web (https://…)'],
            ] as const)
          : ([
              ['name', 'Nombre / empresa *'],
              ['contact', 'Persona de contacto'],
              ['phone', 'Teléfono internacional (ej. 54911…)'],
              ['email', 'Email'],
              ['address', 'Dirección'],
              ['website', 'Página web (https://…)'],
            ] as const)
        ).map(([key, label]) => (
          <Field key={key} label={label} wide={key === 'whatsapp_group'}>
            <input
              required={key === 'name'}
              type={
                key === 'email'
                  ? 'email'
                  : key === 'website' || key === 'whatsapp_group'
                    ? 'url'
                    : 'text'
              }
              placeholder={
                key === 'whatsapp_group'
                  ? 'https://chat.whatsapp.com/…'
                  : undefined
              }
              value={f[key]}
              onChange={(e) => set({ ...f, [key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label="Notas comerciales" wide>
          <textarea
            value={f.notes}
            onChange={(e) => set({ ...f, notes: e.target.value })}
          />
        </Field>
      </div>
      {kind === 'supplier' && whatsappGroup(f.whatsapp_group) ? (
        <a
          className="text-action"
          href={whatsappGroup(f.whatsapp_group) || '#'}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={17} /> Abrir grupo de WhatsApp{' '}
          <ArrowUpRight size={15} />
        </a>
      ) : null}
      {kind === 'customer' && (
        <section className="form-section">
          <h3>Datos de facturación</h3>
          <div className="form-grid">
            {(['name', 'taxId', 'address'] as const).map((k, i) => (
              <Field
                key={k}
                label={['Razón social', 'CUIT / CUIL', 'Domicilio fiscal'][i]}
              >
                <input
                  value={f.fiscal[k]}
                  onChange={(e) =>
                    set({ ...f, fiscal: { ...f.fiscal, [k]: e.target.value } })
                  }
                />
              </Field>
            ))}
            <Field label="Condición frente al IVA">
              <Pick
                label="Condición IVA"
                value={f.fiscal.vat}
                onChange={(v) => set({ ...f, fiscal: { ...f.fiscal, vat: v } })}
                options={options([
                  'Consumidor final',
                  'Responsable inscripto',
                  'Monotributista',
                  'Exento',
                  'No informado',
                ])}
              />
            </Field>
          </div>
        </section>
      )}
      {record && (
        <section className="form-section">
          <h3>
            {kind === 'supplier'
              ? 'Productos de este proveedor'
              : 'Historial y seguimiento'}
          </h3>
          {kind === 'supplier' ? (
            supplied.length ? (
              supplied.map((p) => (
                <p className="history-line" key={p.id}>
                  {p.name}
                  <span>
                    {p.sku} · {p.stock} unidades
                  </span>
                </p>
              ))
            ) : (
              <p className="hint">Todavía no hay productos asociados.</p>
            )
          ) : (
            <>
              <div className="insight">
                <span>
                  Última compra
                  <strong>
                    {purchased[0]?.date || 'Sin compras cerradas'}
                  </strong>
                </span>
                <span>
                  Productos comprados<strong>{bought.size}</strong>
                </span>
                <span>
                  Total comprado
                  <strong>
                    {formatMoney(
                      purchased.reduce((s, o) => s + o.total, 0),
                      data.currency,
                    )}
                  </strong>
                </span>
              </div>
              {data.orders
                .filter((o) => o.customer_id === record.id)
                .map((o) => (
                  <div className="history-line" key={o.id}>
                    <div>
                      <b>{o.number}</b>
                      <p>
                        {o.items
                          .map((i) => `${i.name} × ${i.quantity}`)
                          .join(' · ')}
                      </p>
                    </div>
                    <span>
                      {o.date}
                      <br />
                      <Status value={o.status} />
                    </span>
                  </div>
                ))}
              <div className="note">
                <b>Próxima conversación</b>
                <p>
                  {purchased.length
                    ? 'Consultar estado del equipo y próximas necesidades.'
                    : 'Conocer disciplina, talles y preferencias del cliente.'}{' '}
                  {data.products
                    .filter((p) => !p.archived && !bought.has(p.id))
                    .slice(0, 2)
                    .map((p) => p.name).length
                    ? `Productos aún no comprados: ${data.products
                        .filter((p) => !p.archived && !bought.has(p.id))
                        .slice(0, 2)
                        .map((p) => p.name)
                        .join(', ')}.`
                    : ''}
                </p>
              </div>
              {record.phone && (
                <a
                  className="text-action"
                  href={whatsapp(record.phone) || '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={17} /> Abrir WhatsApp{' '}
                  <ArrowUpRight size={15} />
                </a>
              )}
            </>
          )}
        </section>
      )}
      <Footer busy={busy} />
    </form>
  );
}
export function ProductForm({
  record,
  data,
  save,
  onCancel,
}: {
  record?: Product;
  data: Data;
  save: Save;
  onCancel?: () => void;
}) {
  const [f, set] = useState({
    name: record?.name || '',
    sku: record?.sku || '',
    category:
      record?.category ||
      data.categories.find((c) => c.id !== 'monturas' && c.id !== 'cascos')
        ?.id ||
      '',
    supplier_id: record?.supplier_id || '',
    cost: decimal(record?.cost || 0),
    price: decimal(record?.price || 0),
    ff_discount: percent(record?.ff_discount ?? 1500),
    ff_price: record?.ff_price == null ? '' : decimal(record.ff_price),
    promo_kind: record?.promo_kind || 'none',
    promo_value: decimal(record?.promo_value || 0),
    photos: record?.photos || [],
    options: record?.options || [],
    attributes: record?.attributes || {},
  });
  const [busy, B] = useState(false);
  const [uploading, U] = useState(false);
  const [error, E] = useState('');
  const [newOption, N] = useState({
    name: '',
    price: '0.00',
    cost: '0.00',
    photo: '',
  });
  let calc: { cost: number; price: number; ff: number; promo: number } | null =
    null;
  try {
    const price = parseDecimal(f.price),
      cost = parseDecimal(f.cost);
    calc = {
      cost,
      price,
      ff: f.ff_price.trim()
        ? parseDecimal(f.ff_price)
        : friendsPrice({ price, ff_discount: parsePercent(f.ff_discount, 'F&F') }),
      promo: promoPrice({
        price,
        promo_kind: f.promo_kind,
        promo_value: parseDecimal(f.promo_value),
      }),
    };
  } catch {
    /* Incomplete values while editing. */
  }
  function addOption() {
    try {
      if (!newOption.name.trim())
        throw new Error('Poné un nombre a la característica.');
      const option: Option = {
        id: crypto.randomUUID(),
        name: newOption.name.trim(),
        price: parseDecimal(newOption.price),
        cost: parseDecimal(newOption.cost),
        photo: newOption.photo,
      };
      set({ ...f, options: [...f.options, option] });
      N({ name: '', price: '0.00', cost: '0.00', photo: '' });
      E('');
    } catch (e) {
      E((e as Error).message);
    }
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        E('');
        try {
          await save({
            action: 'product',
            ...f,
            cost: parseDecimal(f.cost),
            price: parseDecimal(f.price),
            ff_discount: parsePercent(f.ff_discount, 'F&F'),
            ff_price: f.ff_price.trim() ? parseDecimal(f.ff_price) : null,
            promo_value: parseDecimal(f.promo_value),
            id: record?.id,
            version: record?.version,
          });
        } catch (e) {
          E((e as Error).message);
        } finally {
          B(false);
        }
      }}
    >
      <ErrorBox message={error} />
      <div className="form-grid">
        <Field label="Nombre del producto *">
          <input
            required
            value={f.name}
            onChange={(e) => set({ ...f, name: e.target.value })}
          />
        </Field>
        <Field
          label={
            f.category === 'monturas' || f.category === 'cascos'
              ? 'Código interno *'
              : 'SKU único *'
          }
        >
          <input
            required
            value={f.sku}
            onChange={(e) => set({ ...f, sku: e.target.value })}
          />
        </Field>
        <Field label="Categoría *">
          <Pick
            label="Categoría"
            value={f.category}
            onChange={(v) => set({ ...f, category: v, attributes: {} })}
            options={data.categories
              .filter((c) => !isConfiguredCategory(c.id))
              .map((c) => ({
                value: c.id,
                label: c.name,
              }))}
          />
        </Field>
        {isConfiguredCategory(f.category) ? (
          <p className="hint" style={{ gridColumn: '1 / -1' }}>
            Monturas, cascos, rodilleras y botas se configuran desde las cards
            de Productos.
          </p>
        ) : null}
        <Field
          label="Proveedor"
          pending={!f.supplier_id}
          pendingLabel="Pendiente de asignar"
        >
          <Pick
            label="Proveedor"
            value={f.supplier_id}
            onChange={(v) => set({ ...f, supplier_id: v })}
            options={[
              { value: '', label: 'Sin asignar' },
              ...data.contacts
                .filter((c) => c.kind === 'supplier' && !c.archived)
                .map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </Field>
      </div>
      <section className="form-section">
        <h3>Fotos del producto</h3>
        <Photos
          value={f.photos}
          onChange={(v) => set({ ...f, photos: v })}
          onError={E}
          onBusy={U}
        />
      </section>
      <section className="form-section">
        <h3>Precios y rentabilidad · {data.currency}</h3>
        <div className="form-grid">
          <Field
            label="Costo unitario *"
            pending={
              f.attributes.Costo === 'Pendiente de definir' &&
              (f.cost === '' || f.cost === '0' || f.cost === '0.00')
            }
          >
            <input
              required
              inputMode="decimal"
              value={f.cost}
              onChange={(e) => set({ ...f, cost: e.target.value })}
            />
          </Field>
          <Field
            label="Precio de lista *"
            pending={
              f.attributes['Precio de lista'] === 'Pendiente de definir' &&
              (f.price === '' || f.price === '0' || f.price === '0.00')
            }
          >
            <input
              required
              inputMode="decimal"
              value={f.price}
              onChange={(e) => set({ ...f, price: e.target.value })}
            />
          </Field>
          <Field label="Descuento Friends & Family (%)">
            <input
              required
              inputMode="numeric"
              value={f.ff_discount}
              onChange={(e) => set({ ...f, ff_discount: e.target.value })}
            />
          </Field>
          <Field
            label="Precio Friends & Family exacto"
            pending={
              f.attributes['Precio F&F'] === 'Pendiente de definir' &&
              !f.ff_price.trim()
            }
          >
            <input
              inputMode="decimal"
              placeholder={
                f.attributes['Precio F&F'] === 'Pendiente de definir'
                  ? 'Pendiente'
                  : 'Opcional'
              }
              value={f.ff_price}
              onChange={(e) => set({ ...f, ff_price: e.target.value })}
            />
          </Field>
          <Field label="Precio promocional">
            <Pick
              label="Tipo de promoción"
              value={f.promo_kind}
              onChange={(v) =>
                set({ ...f, promo_kind: v, promo_value: '0.00' })
              }
              options={[
                { value: 'none', label: 'Sin promoción' },
                { value: 'percent', label: 'Descuento porcentual' },
                { value: 'manual', label: 'Precio manual' },
              ]}
            />
          </Field>
          {f.promo_kind !== 'none' && (
            <Field
              label={
                f.promo_kind === 'percent'
                  ? 'Descuento promocional (%)'
                  : 'Precio promocional'
              }
            >
              <input
                inputMode="decimal"
                value={f.promo_value}
                onChange={(e) => set({ ...f, promo_value: e.target.value })}
              />
            </Field>
          )}
        </div>
        {calc && (
          <div className="price-preview">
            {[
              ['Lista', calc.price],
              ['Friends & Family', calc.ff],
              ...(f.promo_kind === 'none' ? [] : [['Promoción', calc.promo]]),
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{formatMoney(Number(value), data.currency)}</strong>
                <p>
                  Ganancia{' '}
                  {formatMoney(Number(value) - calc!.cost, data.currency)}
                </p>
                <p>
                  Margen sobre venta {margin(Number(value), calc!.cost) ?? '—'}%
                </p>
                <small>
                  Rentabilidad sobre costo{' '}
                  {markup(Number(value), calc!.cost) ?? '—'}%
                </small>
              </article>
            ))}
          </div>
        )}
        <p className="hint">
          El margen es ganancia ÷ precio de venta. Importes comerciales sin
          desglose de IVA.
        </p>
      </section>
      <section className="form-section">
        <h3>
          Características de{' '}
          {data.categories.find((c) => c.id === f.category)?.name}
        </h3>
        <div className="form-grid">
          {data.categories
            .find((c) => c.id === f.category)
            ?.fields.map((field) => (
              <Field key={field.name} label={field.name}>
                {field.values.length ? (
                  <Pick
                    label={field.name}
                    value={f.attributes[field.name] || ''}
                    onChange={(v) =>
                      set({
                        ...f,
                        attributes: { ...f.attributes, [field.name]: v },
                      })
                    }
                    options={[
                      { value: '', label: 'Sin definir' },
                      ...options(field.values),
                    ]}
                  />
                ) : (
                  <input
                    value={f.attributes[field.name] || ''}
                    onChange={(e) =>
                      set({
                        ...f,
                        attributes: {
                          ...f.attributes,
                          [field.name]: e.target.value,
                        },
                      })
                    }
                  />
                )}
              </Field>
            ))}
        </div>
        {!data.categories.find((c) => c.id === f.category)?.fields.length && (
          <p className="hint">
            Podés definir características por categoría desde Configuración.
          </p>
        )}
      </section>
      <section className="form-section">
        <h3>Accesorios y personalizaciones</h3>
        <p className="hint">
          Un adicional en cero no modifica el precio. Las opciones se
          seleccionan en el pedido.
        </p>
        {f.options.map((o) => (
          <div className="option-row" key={o.id}>
            {o.photo && (
              <Image
                unoptimized
                width={46}
                height={46}
                src={o.photo}
                alt={o.name}
              />
            )}
            <span>
              <b>{o.name}</b>
              <small>
                Precio +{formatMoney(o.price, data.currency)} · costo +
                {formatMoney(o.cost, data.currency)}
              </small>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label={`Quitar ${o.name}`}
              onClick={() =>
                set({ ...f, options: f.options.filter((x) => x.id !== o.id) })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <div className="form-grid">
          <Field label="Nombre de la opción">
            <input
              value={newOption.name}
              onChange={(e) => N({ ...newOption, name: e.target.value })}
            />
          </Field>
          <Field label="Adicional al precio">
            <input
              inputMode="decimal"
              value={newOption.price}
              onChange={(e) => N({ ...newOption, price: e.target.value })}
            />
          </Field>
          <Field label="Costo adicional">
            <input
              inputMode="decimal"
              value={newOption.cost}
              onChange={(e) => N({ ...newOption, cost: e.target.value })}
            />
          </Field>
          <Photos
            value={newOption.photo ? [newOption.photo] : []}
            max={1}
            onChange={(v) => N({ ...newOption, photo: v[0] || '' })}
            onBusy={U}
            onError={E}
          />
        </div>
        <button type="button" className="secondary" onClick={addOption}>
          <Plus size={16} /> Agregar opción
        </button>
      </section>
      {record && (
        <section className="form-section">
          <h3>Movimientos de stock · {record.stock} disponibles</h3>
          {data.movements
            .filter((m) => m.product_id === record.id)
            .map((m) => (
              <div key={m.id} className="history-line">
                <div>
                  {m.reason || (m.quantity > 0 ? 'Stock' : 'Devolución')}
                  {m.location ? (
                    <small>{stockPlaceLabel(m.location)}</small>
                  ) : null}
                  <small>
                    {movementWhen(data.partners, m)}
                  </small>
                </div>
                <strong className={m.quantity > 0 ? 'positive' : 'negative'}>
                  {m.quantity > 0 ? '+' : ''}
                  {m.quantity}
                </strong>
              </div>
            ))}
          {!data.movements.some((m) => m.product_id === record.id) && (
            <p className="hint">
              Sin movimientos. Registrá un ingreso desde Productos / Stock.
            </p>
          )}
        </section>
      )}
      {onCancel && (
        <div className="form-footer" style={{ borderTop: 0, marginTop: 0 }}>
          <button type="button" className="secondary" onClick={onCancel}>
            Volver al detalle
          </button>
        </div>
      )}
      <Footer busy={busy || uploading} />
    </form>
  );
}
function Fact({
  label,
  value,
  pending = false,
}: {
  label: string;
  value: ReactNode;
  pending?: boolean;
}) {
  return (
    <div className="pdp-fact">
      <span>{label}</span>
      <strong className={pending ? 'pending-text' : undefined}>{value}</strong>
    </div>
  );
}
function ActorNote({
  partners,
  createdBy,
  archivedBy,
  archived,
  deletedBy,
  deleted,
}: {
  partners: Partner[];
  createdBy?: string;
  archivedBy?: string;
  archived?: number;
  deletedBy?: string;
  deleted?: number;
}) {
  const created = actorName(partners, createdBy);
  const archivedName = archived ? actorName(partners, archivedBy) : '';
  const deletedName = deleted ? actorName(partners, deletedBy) : '';
  if (!created && !archivedName && !deletedName) return null;
  return (
    <p className="hint actor-note">
      {created ? `Creado por ${created}` : null}
      {created && (archivedName || deletedName) ? ' · ' : null}
      {archivedName ? `Archivado por ${archivedName}` : null}
      {archivedName && deletedName ? ' · ' : null}
      {deletedName ? `Borrado por ${deletedName}` : null}
    </p>
  );
}
function movementWhen(partners: Partner[], movement: Movement) {
  const who = actorName(partners, movement.created_by);
  const when = new Date(movement.created_at).toLocaleString('es-AR');
  return who ? `${when} · ${who}` : when;
}
export function ProductDetail({
  record,
  data,
  onEdit,
  onStock,
}: {
  record: Product;
  data: Data;
  onEdit: () => void;
  onStock: () => void;
}) {
  const category = data.categories.find((c) => c.id === record.category);
  const supplier = data.contacts.find((c) => c.id === record.supplier_id);
  const costPending = record.attributes.Costo === 'Pendiente de definir';
  const pricePending =
    record.attributes['Precio de lista'] === 'Pendiente de definir';
  const ffPending = record.attributes['Precio F&F'] === 'Pendiente de definir';
  const promo =
    record.promo_kind === 'percent'
      ? `${(record.promo_value / 100).toFixed(2)}% de descuento`
      : record.promo_kind === 'manual'
        ? formatMoney(record.promo_value, data.currency)
        : 'Sin promoción';
  const listProfit = record.price - record.cost;
  const movements = data.movements.filter((m) => m.product_id === record.id);
  const extraAttributes = Object.entries(record.attributes).filter(
    ([key]) =>
      key !== 'Costo' &&
      key !== 'Precio de lista' &&
      key !== 'Precio F&F' &&
      !(category?.fields.some((field) => field.name === key) ?? false),
  );
  return (
    <div className="pdp">
      <div className="pdp-actions">
        <button className="primary" type="button" onClick={onEdit}>
          <Pencil size={16} /> Editar
        </button>
        <button className="secondary" type="button" onClick={onStock}>
          Registrar stock
        </button>
      </div>
      <ActorNote
        partners={data.partners}
        createdBy={record.created_by}
        archivedBy={record.archived_by}
        archived={record.archived}
      />
      {isConfiguredProduct(record) ? (
        Object.values(record.pricing.photos || {}).length ? (
          <section className="form-section" style={{ borderTop: 0, marginTop: 0 }}>
            <h3>Fotos de referencia</h3>
            <div className="pdp-photos">
              {Object.entries(record.pricing.photos).map(([id, url]) => (
                <ProductPhoto key={id} name={record.name} url={url} />
              ))}
            </div>
          </section>
        ) : null
      ) : (
        <section className="form-section" style={{ borderTop: 0, marginTop: 0 }}>
          <h3>Fotos</h3>
          <div className="pdp-photos">
            {(record.photos.length ? record.photos : ['']).map((url, i) => (
              <ProductPhoto
                key={url || i}
                name={record.name}
                url={url || undefined}
              />
            ))}
          </div>
        </section>
      )}
      <section className="form-section">
        <h3>Identificación</h3>
        <div className="pdp-facts">
          <Fact
            label={isConfiguredProduct(record) ? 'Tipo' : 'SKU'}
            value={
              isConfiguredProduct(record)
                ? 'Configurable por pedido'
                : record.sku
            }
          />
          <Fact label="Categoría" value={category?.name || record.category} />
          <Fact
            label="Proveedor"
            value={supplier?.name || 'Sin proveedor'}
            pending={!supplier}
          />
          <Fact label="Stock" value={`${record.stock} uds.`} />
        </div>
      </section>
      <section className="form-section">
        <h3>Precios y rentabilidad · {data.currency}</h3>
        <div className="pdp-facts">
          <Fact
            label="Costo unitario"
            value={
              costPending
                ? 'Pendiente'
                : formatMoney(record.cost, data.currency)
            }
            pending={costPending}
          />
          <Fact
            label="Precio de lista"
            value={
              pricePending
                ? 'Pendiente'
                : formatMoney(record.price, data.currency)
            }
            pending={pricePending}
          />
          <Fact
            label="Friends & Family"
            value={
              ffPending
                ? 'Pendiente'
                : formatMoney(friendsPrice(record), data.currency)
            }
            pending={ffPending}
          />
          <Fact label="Promoción" value={promo} />
          <Fact
            label="Ganancia de lista"
            value={
              costPending || pricePending
                ? 'Pendiente'
                : formatMoney(listProfit, data.currency)
            }
            pending={costPending || pricePending}
          />
          <Fact
            label="Margen sobre venta"
            value={
              costPending || pricePending
                ? 'Pendiente'
                : `${margin(record.price, record.cost) ?? '—'}%`
            }
            pending={costPending || pricePending}
          />
        </div>
        <p className="hint">
          El margen es ganancia ÷ precio de venta. Importes comerciales sin
          desglose de IVA.
        </p>
      </section>
      <section className="form-section">
        <h3>Características de {category?.name}</h3>
        {category?.fields.length || extraAttributes.length ? (
          <div className="pdp-facts">
            {category?.fields.map((field) => (
              <Fact
                key={field.name}
                label={field.name}
                value={record.attributes[field.name] || 'Sin definir'}
                pending={!record.attributes[field.name]}
              />
            ))}
            {extraAttributes.map(([key, value]) => (
              <Fact
                key={key}
                label={key}
                value={value}
                pending={value === 'Pendiente de definir'}
              />
            ))}
          </div>
        ) : (
          <p className="hint">
            Este producto todavía no tiene características cargadas.
          </p>
        )}
      </section>
      <section className="form-section">
        <h3>Accesorios y personalizaciones</h3>
        {record.options.length ? (
          record.options.map((o) => (
            <div className="option-row" key={o.id}>
              {o.photo && (
                <Image
                  unoptimized
                  width={46}
                  height={46}
                  src={o.photo}
                  alt={o.name}
                />
              )}
              <span>
                <b>{o.name}</b>
                <small>
                  Precio +{formatMoney(o.price, data.currency)} · costo +
                  {formatMoney(o.cost, data.currency)}
                </small>
              </span>
            </div>
          ))
        ) : (
          <p className="hint">Sin adicionales.</p>
        )}
      </section>
      <section className="form-section">
        <h3>Movimientos de stock · {record.stock} disponibles</h3>
        {isConfiguredProduct(record) ? (
          <p className="hint">
            El stock se guarda por combinación. Ingresá unidades eligiendo las
            mismas variantes que en un pedido, sin cliente.
          </p>
        ) : null}
        {movements.map((m) => {
          const kind = configuredKindOf(record);
          const detail =
            kind && m.config && Object.keys(m.config).length
              ? summarizeConfig(kind, m.config as ProductConfig)
              : '';
          return (
            <div key={m.id} className="history-line">
              {m.photos?.[0] ? (
                <ProductPhoto name={record.name} url={m.photos[0]} />
              ) : null}
              <div>
                {m.reason || (m.quantity > 0 ? 'Stock' : 'Devolución')}
                {m.location || m.supplier_id ? (
                  <small>
                    {[
                      m.location ? stockPlaceLabel(m.location) : '',
                      data.contacts.find((c) => c.id === m.supplier_id)?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                ) : null}
                {detail ? (
                  <small className="snapshot-copy">{detail}</small>
                ) : null}
                <small>{movementWhen(data.partners, m)}</small>
              </div>
              <strong className={m.quantity > 0 ? 'positive' : 'negative'}>
                {m.quantity > 0 ? '+' : ''}
                {m.quantity}
              </strong>
            </div>
          );
        })}
        {!movements.length && (
          <p className="hint">Sin movimientos registrados.</p>
        )}
      </section>
    </div>
  );
}
type DraftItem = {
  key: string;
  id?: string;
  product_id: string;
  quantity: string;
  discount: string;
  price_mode: string;
  manual_price: string;
  option_ids: string[];
  attributes: Record<string, string>;
  config?: ProductConfig;
  supplier_id?: string;
  from_stock?: boolean;
  stock_qty?: number;
  location?: string;
  snapshot?: Item;
};
function productFieldValues(
  product: Product | undefined,
  fields: { name: string; values: string[] }[],
) {
  if (!product) return {};
  return Object.fromEntries(
    fields
      .filter((field) => product.attributes[field.name])
      .map((field) => [field.name, product.attributes[field.name]]),
  );
}
function formatOrderDate(value: string) {
  if (!value) return 'Sin definir';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function itemDescription(item: Item, product?: Product) {
  const configured = product
    ? describeConfigured(product, item.selections.config)
    : '';
  if (configured) return configured;
  const extras = item.selections.options.map((option) => option.name);
  return extras.length ? [item.name, ...extras].join('\n') : item.name;
}

function itemPhoto(
  item: Item,
  product?: Product,
  movements: Movement[] = [],
) {
  if (!product) return undefined;
  if (item.selections.from_stock) {
    const hold = itemStockHold(item, configuredKindOf(product), {
      id: item.order_id,
      number: '',
    });
    if (hold) {
      const stockUrl = uniquePhotoUrls(
        movements
          .filter(
            (movement) =>
              movement.product_id === item.product_id &&
              movement.quantity > 0 &&
              (movement.config_key || '') === hold.configKey &&
              (movement.location || '') === hold.location,
          )
          .flatMap((movement) => movement.photos || []),
      )[0];
      if (stockUrl) return stockUrl;
    }
  }
  const kind = configuredKindOf(product);
  if (kind && item.selections.config) {
    try {
      const config = parseConfig(kind, item.selections.config);
      const url = selectedReferenceIds(kind, config)
        .map((id) => product.pricing.photos[id])
        .find(Boolean);
      if (url) return url;
    } catch {
      /* use product photo */
    }
  }
  return product.photos[0];
}

export function OrderDetail({
  record,
  data,
  onEdit,
  onPatch,
  save,
}: {
  record: Order;
  data: Data;
  onEdit: () => void;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  save: Save;
}) {
  const [error, E] = useState('');
  const closed = orderIsLocked(record.status);
  const units = record.items.reduce((total, item) => total + item.quantity, 0);
  const due = Math.max(0, record.total - record.paid);
  return (
    <div className="pdp">
      <ErrorBox message={error} />
      {closed ? (
        <p className="hint">
          {record.status === 'entregado'
            ? 'El pedido está entregado y el stock reservado ya se descontó. Reabrí para modificarlo y devolver las unidades.'
            : 'El pedido está cerrado. El stock sigue reservado hasta que se entregue. Reabrí para modificarlo.'}
        </p>
      ) : null}
      <section className="form-section" style={{ borderTop: 0, marginTop: 0 }}>
        <article className="record-card order-detail-card">
          <div className="record-card-top">
            <div className="record-card-id">
              <span className="order-detail-number">
                Pedido Nro: {record.number}
              </span>
              <time className="order-detail-date" dateTime={record.date}>
                {formatOrderDate(record.date)}
              </time>
            </div>
          </div>
          <div className="record-card-status">
            <StatusMenu
              value={record.status}
              title="Estado del pedido"
              description="El stock reservado se descuenta cuando el pedido está entregado."
              options={[...ORDER_STATUSES]}
              onPick={(status) => onPatch({ status })}
            />
            <OrderPayMenu
              order={record}
              onChange={(pay, paid) => onPatch({ pay, paid })}
            />
            <OrderDeliveryMenu
              delivery={record.delivery}
              onChange={(delivery) => onPatch({ delivery })}
            />
            <StatusMenu
              value={record.invoice ? 'factura emitida' : 'sin factura'}
              title="Facturación"
              description="Marcá si este pedido ya tiene factura."
              options={['sin factura', 'factura emitida']}
              onPick={(value) =>
                onPatch({ invoice: value === 'factura emitida' ? 1 : 0 })
              }
            />
          </div>
          <ActorNote
            partners={data.partners}
            createdBy={record.created_by}
            archivedBy={record.archived_by}
            archived={record.archived}
            deletedBy={record.deleted_by}
            deleted={record.deleted}
          />
          <dl className="record-card-facts">
            <div>
              <dt>Productos</dt>
              <dd>{units === 1 ? '1 ud.' : `${units} uds.`}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="amount">
                {formatMoney(record.total, data.currency)}
              </dd>
            </div>
            <div>
              <dt>Cobrado</dt>
              <dd className="amount">
                {formatMoney(record.paid, data.currency)}
              </dd>
            </div>
            <div>
              <dt>Saldo</dt>
              <dd className={`amount${due > 0 ? ' money-neg' : ''}`}>
                {formatMoney(due, data.currency)}
              </dd>
            </div>
          </dl>
        </article>
      </section>
      <section className="form-section">
        <div className="section-heading">
          <h3>Productos</h3>
          <span>
            {record.items.length}{' '}
            {record.items.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>
        {record.items.length ? (
          record.items.map((item) => {
            const product = data.products.find((p) => p.id === item.product_id);
            const supplier = data.contacts.find(
              (c) => c.id === item.selections.supplier_id,
            );
            return (
              <div className="stock-item" key={item.id}>
                <div className="stock-item-copy">
                  <div className="stock-item-photo">
                    <ProductPhoto
                      name={item.name}
                      url={itemPhoto(item, product, data.movements)}
                    />
                    <span className="stock-item-qty">{item.quantity}</span>
                  </div>
                  <div>
                    <div className="stock-item-heading">
                      <b>{itemDescription(item, product)}</b>
                      <span className="discount-badge">
                        {`${(item.discount / 100).toLocaleString('es-AR')}% dto.`}
                      </span>
                    </div>
                    <small>
                      {[
                        supplier?.name,
                        item.selections.from_stock ? 'De stock' : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                  </div>
                </div>
                <div className="stock-item-side order-detail-money">
                  <strong>
                    {formatMoney(item.total, data.currency)}
                  </strong>
                  <small>
                    {formatMoney(item.unit_price, data.currency)}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </small>
                </div>
              </div>
            );
          })
        ) : (
          <p className="hint">Este pedido no tiene productos.</p>
        )}
      </section>
      <section className="form-section">
        <h3>Totales · {data.currency}</h3>
        <div className="order-detail-totals">
          <div className="order-detail-totals-row three">
            <Fact
              label="Total"
              value={formatMoney(record.total, data.currency)}
            />
            <Fact
              label="Costo"
              value={formatMoney(record.cost, data.currency)}
            />
            <Fact
              label="Ganancia"
              value={formatMoney(record.total - record.cost, data.currency)}
            />
          </div>
        </div>
      </section>
      {record.notes.trim() ? (
        <section className="form-section">
          <h3>Notas</h3>
          <p className="order-detail-notes">{record.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

export function OrderForm({
  record,
  data,
  save,
  onCancel,
  onConfigDirtyChange,
}: {
  record?: Order;
  data: Data;
  save: Save;
  onCancel?: () => void;
  onConfigDirtyChange?: (dirty: boolean) => void;
}) {
  const [f, set] = useState({
    customer_id: record?.customer_id || '',
    date: record?.date || today(),
    delivery: record?.delivery || '',
    status: record?.status || 'nuevo',
    paid: decimal(record?.paid || 0),
    invoice: !!record?.invoice,
    notes: record?.notes || '',
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [items, I] = useState<DraftItem[]>(
    record?.items.map((i) => ({
      key: i.id,
      id: i.id,
      product_id: i.product_id,
      quantity: String(i.quantity),
      discount: decimal(i.discount),
      price_mode: 'list',
      manual_price: '0.00',
      option_ids: i.selections.options.map((o) => o.id),
      attributes: i.selections.attributes,
      config: i.selections.config as ProductConfig | undefined,
      supplier_id:
        i.selections.supplier_id ||
        data.products.find((p) => p.id === i.product_id)?.supplier_id ||
        undefined,
      from_stock: !!i.selections.from_stock,
      stock_qty: i.selections.stock_qty,
      location: i.selections.location,
      snapshot: i,
    })) || [],
  );
  const [busy, B] = useState(false);
  const [error, E] = useState('');
  const [picking, setPicking] = useState<null | 'new' | string>(null);
  const closed = orderIsLocked(record?.status || '');
  const configBaselines = useRef<Record<string, string>>({});
  useEffect(() => {
    let dirty = false;
    for (const item of items) {
      const snap = snapshotConfig(item.config);
      if (!(item.key in configBaselines.current)) {
        configBaselines.current[item.key] = snap;
      } else if (snap !== configBaselines.current[item.key]) {
        dirty = true;
      }
    }
    onConfigDirtyChange?.(dirty);
  }, [items, onConfigDirtyChange]);
  function update(key: string, change: Partial<DraftItem>) {
    I(items.map((i) => (i.key === key ? { ...i, ...change } : i)));
  }
  function draftHolds(exceptKey?: string): StockHold[] {
    const holds: StockHold[] = [];
    for (const item of items) {
      if (exceptKey && item.key === exceptKey) continue;
      const product = data.products.find((p) => p.id === item.product_id);
      const hold = itemStockHold(
        {
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
          selections: {
            from_stock: item.from_stock,
            config: item.config,
            location: item.location,
          },
        },
        product ? configuredKindOf(product) : null,
        { id: record?.id || 'draft', number: record?.number || 'borrador' },
      );
      if (hold) holds.push(hold);
    }
    return holds;
  }
  function supplierName(item: DraftItem, product?: Product) {
    const id =
      item.supplier_id ||
      item.snapshot?.selections.supplier_id ||
      product?.supplier_id ||
      '';
    return data.contacts.find((c) => c.id === id)?.name || '';
  }
  function applyProduct(
    product: Product,
    key?: string,
    config?: ProductConfig,
    supplierId?: string,
    fromStock = false,
    stockQty?: number,
    location?: string,
  ) {
    const fields =
      data.categories.find((c) => c.id === product.category)?.fields || [];
    const kind = configuredKindOf(product);
    const available = fromStock
      ? Math.max(1, Math.floor(Number(stockQty) || 1))
      : undefined;
    const next = {
      product_id: product.id,
      option_ids: [] as string[],
      attributes: productFieldValues(product, fields),
      config: kind
        ? config
          ? parseConfig(kind, config)
          : defaultConfig(kind)
        : undefined,
      supplier_id: supplierId || product.supplier_id || '',
      from_stock: fromStock,
      stock_qty: available,
      location: fromStock ? location || '' : undefined,
      ...(fromStock ? { quantity: '1' } : {}),
    };
    if (key && items.some((i) => i.key === key)) {
      update(key, next);
    } else {
      I([
        ...items,
        {
          key: crypto.randomUUID(),
          quantity: '1',
          discount: '0.00',
          price_mode: 'list',
          manual_price: '0.00',
          ...next,
        },
      ]);
    }
    setPicking(null);
  }
  function itemTotals(i: DraftItem) {
    const p = data.products.find((p) => p.id === i.product_id);
    if (!p) throw new Error('Elegí un producto.');
    const configured = configuredKindOf(p);
    if (configured) {
      const config = parseConfig(
        configured,
        i.config || defaultConfig(configured),
      );
      const extras = extraTotals(configured, config, p.pricing);
      const base =
        i.price_mode === 'manual'
          ? parseDecimal(i.manual_price)
          : i.price_mode === 'ff'
            ? friendsPrice(p)
            : i.price_mode === 'promo'
              ? promoPrice(p)
              : p.price;
      const price = i.snapshot?.unit_price ?? base + extras.price;
      const cost = i.snapshot?.unit_cost ?? p.cost + extras.cost;
      return {
        ...lineTotals(
          price,
          cost,
          Number(i.quantity),
          parseDecimal(i.discount),
        ),
        price,
        unitCost: cost,
        sku: p.sku,
        available: stockForConfig(
          data.movements,
          p.id,
          stockKey(configured, config),
        ),
      };
    }
    const category = data.categories.find((c) => c.id === p.category);
    const fields = category?.fields || [];
    for (const field of closedFields(fields)) {
      if (!i.attributes[field.name]) throw new Error(`Elegí ${field.name}.`);
    }
    const keys = skuFields(fields, data.products, p.category);
    const match = findVariantProduct(
      data.products,
      p.category,
      i.attributes,
      fields,
    );
    if (
      keys.length &&
      keys.every((field) => i.attributes[field.name]) &&
      !match
    )
      throw new Error('No hay un SKU para esa combinación.');
    const product = match || p;
    const selected = product.options.filter((o) => i.option_ids.includes(o.id));
    const base =
      i.price_mode === 'manual'
        ? parseDecimal(i.manual_price)
        : i.price_mode === 'ff'
          ? friendsPrice(product)
          : i.price_mode === 'promo'
            ? promoPrice(product)
            : product.price;
    const price =
      i.snapshot?.unit_price ??
      base + selected.reduce((s, o) => s + o.price, 0);
    const cost =
      i.snapshot?.unit_cost ??
      product.cost + selected.reduce((s, o) => s + o.cost, 0);
    return {
      ...lineTotals(price, cost, Number(i.quantity), parseDecimal(i.discount)),
      price,
      unitCost: cost,
      sku: product.sku,
    };
  }
  let total = 0,
    cost = 0;
  for (const i of items) {
    try {
      const t = itemTotals(i);
      total += t.total;
      cost += t.cost;
    } catch {
      /* Draft line incomplete. */
    }
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        E('');
        try {
          const creatingCustomer = f.customer_id === NEW_CUSTOMER;
          if (creatingCustomer && !newCustomer.name.trim())
            throw new Error('Escribí el nombre del cliente.');
          if (items.some((item) => !item.supplier_id))
            throw new Error('Elegí el proveedor de cada producto.');
          if (
            items.some(
              (item) =>
                item.from_stock &&
                item.stock_qty &&
                Number(item.quantity) > item.stock_qty,
            )
          )
            throw new Error(
              'La cantidad no puede superar el stock de esa unidad.',
            );
          const otherHolds = reservedHolds(
            data.orders,
            data.products,
            record?.id,
          );
          const used = new Map<string, number>();
          for (const item of items) {
            if (!item.from_stock) continue;
            const product = data.products.find((p) => p.id === item.product_id);
            const hold = itemStockHold(
              {
                product_id: item.product_id,
                quantity: Number(item.quantity) || 0,
                selections: {
                  from_stock: true,
                  config: item.config,
                  location: item.location,
                },
              },
              product ? configuredKindOf(product) : null,
              { id: record?.id || 'draft', number: record?.number || '' },
            );
            if (!hold) continue;
            const row = stockAvailability(
              data.movements,
              otherHolds,
              item.product_id,
            ).find(
              (candidate) =>
                candidate.config_key === hold.configKey &&
                (!hold.location || candidate.location === hold.location),
            );
            const key = `${hold.productId}\t${hold.configKey}\t${hold.location}`;
            const taken = used.get(key) || 0;
            if (hold.quantity > (row?.available || 0) - taken)
              throw new Error(
                `Esa unidad de ${product?.name || 'stock'} ya está reservada para otro pedido.`,
              );
            used.set(key, taken + hold.quantity);
          }
          await save({
            action: 'order',
            ...f,
            customer_id: creatingCustomer ? undefined : f.customer_id,
            customer: creatingCustomer ? newCustomer : undefined,
            invoice: Number(f.invoice),
            paid: parseDecimal(f.paid),
            id: record?.id,
            version: record?.version,
            items: items.map((i) => ({
              id: i.id,
              product_id: i.product_id,
              quantity: Number(i.quantity),
              discount: parseDecimal(i.discount),
              price_mode: i.price_mode,
              manual_price: parseDecimal(i.manual_price),
              option_ids: i.option_ids,
              attributes: i.attributes,
              config: i.config,
              supplier_id: i.supplier_id,
              from_stock: i.from_stock,
              stock_qty: i.stock_qty,
              location: i.location,
            })),
          });
        } catch (e) {
          E((e as Error).message);
        } finally {
          B(false);
        }
      }}
    >
      <ErrorBox message={error} />
      {closed && (
        <div className="note">
          <b>
            {record?.status === 'entregado'
              ? 'Pedido entregado'
              : 'Pedido cerrado'}
          </b>
          <p>
            {record?.status === 'entregado'
              ? 'El stock reservado ya se descontó. Reabrí el pedido para modificarlo y devolver las unidades.'
              : 'El stock sigue reservado hasta que el pedido esté entregado. Reabrí para modificarlo.'}
          </p>
          <button
            type="button"
            disabled={busy}
            className="secondary"
            onClick={async () => {
              B(true);
              try {
                await save({
                  action: 'reopen',
                  id: record.id,
                  version: record.version,
                });
              } catch (e) {
                E((e as Error).message);
              } finally {
                B(false);
              }
            }}
          >
            Reabrir pedido
          </button>
        </div>
      )}
      <fieldset disabled={closed || busy}>
        <div className="form-grid">
          <Field label="Cliente *">
            <Pick
              disabled={closed}
              label="Cliente"
              value={f.customer_id}
              onChange={(v) => set({ ...f, customer_id: v })}
              options={[
                { value: NEW_CUSTOMER, label: 'Nuevo cliente…' },
                ...data.contacts
                  .filter(
                    (c) =>
                      c.kind === 'customer' &&
                      (!c.archived || c.id === record?.customer_id),
                  )
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </Field>
          <Field label="Estado">
            <Pick
              disabled={closed}
              label="Estado"
              value={f.status}
              onChange={(v) => set({ ...f, status: v })}
              options={options([...ORDER_STATUSES])}
            />
          </Field>
          <Field label="Fecha del pedido *">
            <input
              type="date"
              required
              value={f.date}
              onChange={(e) => set({ ...f, date: e.target.value })}
            />
          </Field>
          <Field label="Fecha de entrega">
            <input
              type="date"
              min={f.date}
              value={f.delivery}
              onChange={(e) => set({ ...f, delivery: e.target.value })}
            />
          </Field>
        </div>
        {f.customer_id === NEW_CUSTOMER ? (
          <section className="form-section">
            <h3>Datos del cliente nuevo</h3>
            <p className="hint">
              Se crea el cliente al guardar el pedido y queda asociado a esta
              persona.
            </p>
            <div className="form-grid">
              <Field label="Nombre / empresa *">
                <input
                  required
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="Nombre"
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  placeholder="54911…"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Dirección">
                <input
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      address: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </section>
        ) : null}
        <section className="form-section">
          <div className="section-heading">
            <h3>Productos del pedido</h3>
            <span>{items.length} ítems</span>
          </div>
          {items.map((i, index) => {
            const p = data.products.find((p) => p.id === i.product_id);
            const category = data.categories.find((c) => c.id === p?.category);
            const variantMatch = p
              ? findVariantProduct(
                  data.products,
                  p.category,
                  i.attributes,
                  category?.fields || [],
                )
              : undefined;
            let t;
            let lineError = '';
            try {
              t = itemTotals(i);
            } catch (e) {
              lineError = (e as Error).message;
            }
            const shown = variantMatch || p;
            const skuKeys = p
              ? skuFields(category?.fields || [], data.products, p.category)
              : [];
            const selecting = !i.snapshot && (picking === i.key || !i.product_id);
            return (
              <div className="order-line" key={i.key}>
                <div className="section-heading">
                  <b>Ítem {index + 1}</b>
                  {!closed && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Quitar ítem ${index + 1}`}
                      onClick={() => I(items.filter((x) => x.key !== i.key))}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {i.snapshot ? (
                  <div className="snapshot">
                    <b>{itemDescription(i.snapshot, p)}</b>
                    <small>
                      {i.snapshot.sku} · precio y costo guardados en este pedido
                    </small>
                    {supplierName(i, p) ? (
                      <span>Proveedor: {supplierName(i, p)}</span>
                    ) : null}
                    {!configuredKindOf(p) &&
                      i.snapshot.selections.options.map((o) => (
                        <span key={o.id}>
                          {o.name} · +{formatMoney(o.price, data.currency)}
                        </span>
                      ))}
                    {!configuredKindOf(p) &&
                      Object.entries(i.attributes).map(([k, v]) => (
                        <span key={k}>
                          {k}: {v}
                        </span>
                      ))}
                  </div>
                ) : selecting ? (
                  <OrderProductPicker
                    data={data}
                    exceptOrderId={record?.id}
                    held={draftHolds(i.key)}
                    onPick={(
                      product,
                      config,
                      supplierId,
                      fromStock,
                      stockQty,
                      location,
                    ) =>
                      applyProduct(
                        product,
                        i.key,
                        config,
                        supplierId,
                        fromStock,
                        stockQty,
                        location,
                      )
                    }
                    onCancel={() => {
                      if (!i.product_id)
                        I(items.filter((x) => x.key !== i.key));
                      setPicking(null);
                    }}
                  />
                ) : (
                  <div className="order-picked">
                    <ProductPhoto name={p?.name || ''} url={p?.photos[0]} />
                    <div className="order-picked-copy">
                      <b>{p?.name || 'Producto'}</b>
                      <small>
                        {p
                          ? i.from_stock
                            ? `Unidad de stock${
                                i.stock_qty != null
                                  ? ` · ${i.stock_qty} uds.`
                                  : ''
                              }`
                            : isConfiguredProduct(p)
                              ? `A configurar · ${p.stock} uds.`
                              : `${p.sku} · ${p.stock} uds.`
                          : 'Producto no disponible'}
                      </small>
                      {supplierName(i, p) ? (
                        <small>Proveedor: {supplierName(i, p)}</small>
                      ) : null}
                    </div>
                    {!closed && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setPicking(i.key)}
                      >
                        Cambiar
                      </button>
                    )}
                  </div>
                )}
                {!selecting && (
                <>
                <div className="form-grid line-fields">
                  <Field
                    label={
                      i.from_stock && (i.stock_qty || 1) > 1
                        ? `Cantidad * · máx. ${i.stock_qty}`
                        : 'Cantidad *'
                    }
                  >
                    {i.from_stock && (i.stock_qty || 1) > 1 ? (
                      <Pick
                        label="Cantidad"
                        value={i.quantity}
                        onChange={(v) => update(i.key, { quantity: v })}
                        options={Array.from(
                          { length: i.stock_qty || 1 },
                          (_, n) => ({
                            value: String(n + 1),
                            label: String(n + 1),
                          }),
                        )}
                      />
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max={i.from_stock ? 1 : 10000}
                        required
                        readOnly={!!i.from_stock}
                        disabled={!!i.from_stock}
                        value={i.quantity}
                        onChange={(e) =>
                          update(i.key, { quantity: e.target.value })
                        }
                      />
                    )}
                  </Field>
                  <Field label="Descuento del ítem (%)">
                    <input
                      inputMode="decimal"
                      value={i.discount}
                      onChange={(e) =>
                        update(i.key, { discount: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Proveedor *" pending={!i.supplier_id}>
                    <Pick
                      label="Proveedor"
                      value={i.supplier_id || ''}
                      disabled={!!i.from_stock}
                      onChange={(v) => update(i.key, { supplier_id: v })}
                      options={[
                        { value: '', label: 'Elegí un proveedor' },
                        ...data.contacts
                          .filter(
                            (c) =>
                              c.kind === 'supplier' &&
                              (!c.archived || c.id === i.supplier_id),
                          )
                          .map((c) => ({ value: c.id, label: c.name })),
                      ]}
                    />
                  </Field>
                  {!i.snapshot && (
                    <>
                      <Field label="Precio base">
                        <Pick
                          label="Precio base"
                          value={i.price_mode}
                          onChange={(v) => update(i.key, { price_mode: v })}
                          options={[
                            { value: 'list', label: 'Lista' },
                            ...(p?.attributes['Precio F&F'] ===
                            'Pendiente de definir'
                              ? []
                              : [
                                  {
                                    value: 'ff',
                                    label: 'Friends & Family',
                                  },
                                ]),
                            { value: 'promo', label: 'Promoción' },
                            { value: 'manual', label: 'Manual' },
                          ]}
                        />
                      </Field>
                      {i.price_mode === 'manual' && (
                        <Field label="Precio manual sin adicionales">
                          <input
                            inputMode="decimal"
                            value={i.manual_price}
                            onChange={(e) =>
                              update(i.key, { manual_price: e.target.value })
                            }
                          />
                        </Field>
                      )}
                    </>
                  )}
                </div>
                {!i.snapshot && p ? (
                  i.from_stock ? (
                  <div className="snapshot">
                    <small>
                      Esta unidad ya está en stock. La combinación y el
                      proveedor no se modifican.
                    </small>
                    {configuredKindOf(p) && i.config ? (
                      <b>{configLine(p, i.config)}</b>
                    ) : (
                      Object.entries(i.attributes).map(([k, v]) => (
                        <span key={k}>
                          {k}: {v}
                        </span>
                      ))
                    )}
                  </div>
                  ) : (
                  <>
                    {configuredKindOf(p) ? (
                      <Configurator
                        kind={configuredKindOf(p)!}
                        value={i.config || defaultConfig(configuredKindOf(p)!)}
                        onChange={(config) => update(i.key, { config })}
                        movements={data.movements}
                        productId={p.id}
                        pricing={p.pricing}
                        currency={data.currency}
                      />
                    ) : (
                      <>
                        <div className="option-checks">
                          {p.options.map((o) => (
                            <div key={o.id}>
                              {o.photo && (
                                <Image
                                  unoptimized
                                  width={46}
                                  height={46}
                                  src={o.photo}
                                  alt={o.name}
                                />
                              )}
                              <Check
                                label={`${o.name} (+${formatMoney(o.price, data.currency)})`}
                                checked={i.option_ids.includes(o.id)}
                                onChange={(v) =>
                                  update(i.key, {
                                    option_ids: v
                                      ? [...i.option_ids, o.id]
                                      : i.option_ids.filter(
                                          (id) => id !== o.id,
                                        ),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                        <div className="form-grid">
                          {data.categories
                            .find((c) => c.id === p.category)
                            ?.fields.map((field) => (
                              <Field
                                key={field.name}
                                label={
                                  field.values.length
                                    ? `${field.name} *`
                                    : field.name
                                }
                              >
                                {field.values.length ? (
                                  <Pick
                                    label={field.name}
                                    value={i.attributes[field.name] || ''}
                                    onChange={(v) => {
                                      const fields =
                                        data.categories.find(
                                          (c) => c.id === p.category,
                                        )?.fields || [];
                                      const attributes = {
                                        ...i.attributes,
                                        [field.name]: v,
                                      };
                                      const match = findVariantProduct(
                                        data.products,
                                        p.category,
                                        attributes,
                                        fields,
                                      );
                                      update(i.key, {
                                        attributes,
                                        product_id: match?.id || i.product_id,
                                        option_ids:
                                          match && match.id !== i.product_id
                                            ? []
                                            : i.option_ids,
                                      });
                                    }}
                                    options={options(field.values)}
                                  />
                                ) : (
                                  <input
                                    value={i.attributes[field.name] || ''}
                                    onChange={(e) =>
                                      update(i.key, {
                                        attributes: {
                                          ...i.attributes,
                                          [field.name]: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                )}
                              </Field>
                            ))}
                        </div>
                        {skuKeys.length && shown ? (
                          <p className="sku-line">
                            SKU <strong>{shown.sku}</strong>
                            {` · ${shown.stock} uds. disponibles`}
                          </p>
                        ) : null}
                        {lineError === 'No hay un SKU para esa combinación.' ? (
                          <p className="pending-text">{lineError}</p>
                        ) : null}
                      </>
                    )}
                  </>
                  )
                ) : null}
                {t && (
                  <div className="line-summary">
                    <span>Unitario {formatMoney(t.price, data.currency)}</span>
                    <span>Costo {formatMoney(t.cost, data.currency)}</span>
                    <span>Ganancia {formatMoney(t.profit, data.currency)}</span>
                    <b>{formatMoney(t.total, data.currency)}</b>
                  </div>
                )}
                </>
                )}
              </div>
            );
          })}
          {!closed && picking === 'new' && (
            <OrderProductPicker
              data={data}
              exceptOrderId={record?.id}
              held={draftHolds()}
              onPick={(
                product,
                config,
                supplierId,
                fromStock,
                stockQty,
                location,
              ) =>
                applyProduct(
                  product,
                  undefined,
                  config,
                  supplierId,
                  fromStock,
                  stockQty,
                  location,
                )
              }
              onCancel={() => setPicking(null)}
            />
          )}
          {!closed && !picking && (
            <button
              type="button"
              className="secondary"
              onClick={() => setPicking('new')}
            >
              <Plus size={17} /> Agregar producto
            </button>
          )}
        </section>
        <div className="form-grid">
          <Field label="Importe cobrado">
            <input
              inputMode="decimal"
              value={f.paid}
              onChange={(e) => set({ ...f, paid: e.target.value })}
            />
          </Field>
          <div className="field">
            <span>Facturación</span>
            <Check
              label="Este pedido se factura"
              checked={f.invoice}
              onChange={(v) => set({ ...f, invoice: v })}
            />
          </div>
          <Field label="Notas del pedido" wide>
            <textarea
              value={f.notes}
              onChange={(e) => set({ ...f, notes: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>
      <div className="order-totals">
        <span>
          Costo total <b>{formatMoney(cost, data.currency)}</b>
        </span>
        <span>
          Ganancia de Iconic <b>{formatMoney(total - cost, data.currency)}</b>
        </span>
        <span>
          Total del pedido <strong>{formatMoney(total, data.currency)}</strong>
        </span>
      </div>
      <p className="hint">
        El descuento del ítem se aplica después del precio elegido y sus
        adicionales. Una unidad de stock queda reservada al asignarla a un
        pedido. Se descuenta cuando el pedido está entregado.
      </p>
      {onCancel ? (
        <div className="form-footer" style={{ borderTop: 0, marginTop: 0 }}>
          <button type="button" className="secondary" onClick={onCancel}>
            Volver al detalle
          </button>
        </div>
      ) : null}
      {!closed && (
        <Footer
          busy={busy}
          label={record ? 'Guardar pedido' : 'Crear pedido'}
        />
      )}
    </form>
  );
}
function configLine(record: Product, config: Record<string, unknown>) {
  return (
    describeConfigured(record, config) || 'Combinación sin detalle'
  );
}
function inboundForStockRow(
  movements: Movement[],
  productId: string,
  row: { config_key: string; location: string },
) {
  return movements.find(
    (movement) =>
      movement.product_id === productId &&
      movement.quantity > 0 &&
      (movement.config_key || '') === row.config_key &&
      (movement.location || '') === row.location,
  );
}
function uniquePhotoUrls(urls: (string | undefined)[]) {
  const seen = new Set<string>();
  const photos: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    photos.push(url);
  }
  return photos;
}
function stockItemHeading(
  record: Product,
  config: Record<string, unknown>,
) {
  if (!configuredKindOf(record)) return record.name;
  return configLine(record, config).split('\n')[0] || record.name;
}
function inventoryItemContext(
  data: Data,
  record: Product,
  itemKey: string,
) {
  const row = stockAvailability(
    data.movements,
    reservedHolds(data.orders, data.products),
    record.id,
  ).find((item) => item.key === itemKey);
  if (!row) return null;
  return {
    row,
    inbound: inboundForStockRow(data.movements, record.id, row),
    title: stockItemHeading(record, row.config),
  };
}
function StockItemPhotos({ urls, name }: { urls: string[]; name: string }) {
  return (
    <div className={`stock-item-hero${urls.length > 1 ? ' has-many' : ''}`}>
      {(urls.length ? urls : ['']).map((url, i) => (
        <div className="stock-item-hero-slide" key={url || i}>
          <ProductPhoto name={name} url={url || undefined} />
        </div>
      ))}
    </div>
  );
}
export function StockItemDetail({
  record,
  data,
  itemKey,
  onOpenOrder,
  onDelete,
}: {
  record: Product;
  data: Data;
  itemKey: string;
  onOpenOrder?: (order: Order) => void;
  onDelete?: (movement: Movement, name: string) => void;
}) {
  const item = inventoryItemContext(data, record, itemKey);
  if (!item) {
    return <p className="hint">Esta unidad ya no está en stock.</p>;
  }
  const { row, inbound } = item;
  const unitPhotos = uniquePhotoUrls(
    data.movements
      .filter(
        (movement) =>
          movement.product_id === record.id &&
          movement.quantity > 0 &&
          (movement.config_key || '') === row.config_key &&
          (movement.location || '') === row.location,
      )
      .flatMap((movement) => movement.photos || []),
  );
  const photos = unitPhotos.length
    ? unitPhotos
    : uniquePhotoUrls(record.photos);
  const kind = configuredKindOf(record);
  let labels: Record<string, string> = {};
  if (kind && Object.keys(row.config).length) {
    try {
      labels = configLabels(kind, parseConfig(kind, row.config));
    } catch {
      labels = {};
    }
  }
  const supplier = data.contacts.find((c) => c.id === row.supplier_id);
  const heading = stockItemHeading(record, row.config);
  return (
    <div className="pdp stock-item-detail">
      <StockItemPhotos urls={photos} name={record.name} />
      {inbound && onDelete ? (
        <div className="pdp-actions">
          <button
            type="button"
            className="secondary danger"
            disabled={!!row.reserved}
            title={
              row.reserved
                ? 'No se puede borrar: hay pedidos que reservan esta unidad.'
                : 'Borrar del stock'
            }
            onClick={() => onDelete(inbound, heading)}
          >
            <Trash2 size={16} /> Borrar
          </button>
        </div>
      ) : null}
      <section
        className="form-section"
        style={{ borderTop: 0, marginTop: 0, paddingTop: 8 }}
      >
        <div className="pdp-facts stock-item-facts">
          <Fact label="Cantidad" value={`${row.quantity} uds.`} />
          {row.reserved ? (
            <Fact
              label="Disponible"
              value={`${row.available} uds. · ${row.reserved} reservada${row.reserved === 1 ? '' : 's'}`}
            />
          ) : null}
          <Fact
            label="Dónde está"
            value={stockPlaceLabel(row.location) || 'Sin ubicación'}
          />
          <Fact
            label="Proveedor"
            value={supplier?.name || 'Sin proveedor'}
            pending={!supplier}
          />
          {inbound?.reason ? (
            <Fact label="Motivo" value={inbound.reason} />
          ) : null}
          {inbound?.created_at ? (
            <Fact
              label="Ingreso"
              value={movementWhen(data.partners, inbound)}
            />
          ) : null}
          {Object.keys(labels).length ? (
            <>
              <h3 className="stock-item-facts-heading">Características</h3>
              {Object.entries(labels).map(([label, value]) => (
                <Fact key={label} label={label} value={value} />
              ))}
            </>
          ) : null}
        </div>
      </section>
      {row.reservations.length ? (
        <section className="form-section">
          <h3>Reservas</h3>
          <div className="stock-reserve-actions">
            <span className="reserved-badge">Reservado ({row.reserved})</span>
            {row.reservations.map((reservation) => {
              const order = data.orders.find(
                (entry) => entry.id === reservation.orderId,
              );
              return (
                <button
                  key={reservation.orderId}
                  type="button"
                  className="secondary stock-order-link"
                  disabled={!order || !onOpenOrder}
                  onClick={() => order && onOpenOrder?.(order)}
                >
                  Ver {reservation.orderNumber}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
export function StockOverview({
  record,
  data,
  onEdit,
  onOpen,
  onOpenOrder,
  onDelete,
}: {
  record: Product;
  data: Data;
  onEdit: (movement: Movement) => void;
  onOpen: (itemKey: string) => void;
  onOpenOrder?: (order: Order) => void;
  onDelete?: (movement: Movement, name: string) => void;
}) {
  const rows = stockAvailability(
    data.movements,
    reservedHolds(data.orders, data.products),
    record.id,
  );
  const available = rows.reduce((sum, row) => sum + row.available, 0);
  const reserved = rows.reduce((sum, row) => sum + row.reserved, 0);
  return (
    <div className="stock-overview">
      <div className="stock-current stock-summary">
        <div>
          <span>Disponible</span>
          <strong>
            {available} <small>unidades</small>
          </strong>
          {reserved ? (
            <small className="stock-reserved-total">
              {reserved} reservada{reserved === 1 ? '' : 's'}
            </small>
          ) : null}
        </div>
        <div className="stock-places">
          {STOCK_PLACES.map((place) => (
            <span key={place.id}>
              {place.label}
              <b>{stockAtPlace(data.movements, record.id, place.id)}</b>
            </span>
          ))}
        </div>
      </div>
      {rows.length ? (
        rows.map((row) => {
          const inbound = inboundForStockRow(
            data.movements,
            record.id,
            row,
          );
          const title = configuredKindOf(record)
            ? configLine(record, row.config)
            : record.name;
          return (
            <div
              className={`stock-item clickable-row${row.reserved ? ' is-reserved' : ''}`}
              key={row.key}
            >
              <button
                type="button"
                className="row-hit"
                aria-label={`Ver detalle de ${title.replace(/\n/g, ' ')}`}
                onClick={() => onOpen(row.key)}
              />
              <div className="stock-item-copy">
                <ProductPhoto
                  name={record.name}
                  url={inbound?.photos?.[0] || record.photos[0]}
                />
                <div>
                  <b>{title}</b>
                  <small>
                    {[
                      stockPlaceLabel(row.location),
                      data.contacts.find((c) => c.id === row.supplier_id)?.name,
                      inbound
                        ? actorName(data.partners, inbound.created_by)
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                  {row.reservations.length ? (
                    <div className="stock-reserve-actions">
                      <span className="reserved-badge">
                        Reservado ({row.reserved})
                      </span>
                      {row.reservations.map((reservation) => {
                        const order = data.orders.find(
                          (item) => item.id === reservation.orderId,
                        );
                        return (
                          <button
                            key={reservation.orderId}
                            type="button"
                            className="secondary stock-order-link"
                            disabled={!order || !onOpenOrder}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order) onOpenOrder?.(order);
                            }}
                          >
                            Ver {reservation.orderNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="stock-item-side row-actions">
                <strong>
                  {row.quantity} <small>uds.</small>
                </strong>
                {inbound ? (
                  <button
                    type="button"
                    className="icon-button"
                    title="Editar registro"
                    aria-label="Editar registro"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(inbound);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                ) : null}
                {inbound && onDelete ? (
                  <button
                    type="button"
                    className="icon-button danger"
                    title={
                      row.reserved
                        ? 'No se puede borrar: hay pedidos que reservan esta unidad.'
                        : 'Borrar del stock'
                    }
                    aria-label={`Borrar ${title.replace(/\n/g, ' ')}`}
                    disabled={!!row.reserved}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(inbound, title.replace(/\n/g, ' · '));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      ) : (
        <p className="hint">Todavía no hay unidades cargadas.</p>
      )}
    </div>
  );
}
export function StockForm({
  record,
  data,
  save,
  movement,
  onConfigDirtyChange,
  onCancel,
}: {
  record: Product;
  data: Data;
  save: Save;
  movement?: Movement;
  onConfigDirtyChange?: (dirty: boolean) => void;
  onCancel?: () => void;
}) {
  const configured = configuredKindOf(record);
  const editing = !!movement;
  const [q, Q] = useState(
      movement ? String(Math.abs(movement.quantity)) : '1',
    ),
    [kind, K] = useState(movement && movement.quantity < 0 ? 'out' : 'in'),
    [place, setPlace] = useState(movement?.location || ''),
    [supplier, setSupplier] = useState(
      movement?.supplier_id || record.supplier_id || '',
    ),
    [reason, R] = useState(movement?.reason || ''),
    [photos, setPhotos] = useState<string[]>(movement?.photos || []),
    [uploading, U] = useState(false),
    [config, setConfig] = useState<ProductConfig>(() => {
      if (!configured) return defaultConfig('montura');
      if (movement?.config && Object.keys(movement.config).length) {
        try {
          return parseConfig(configured, movement.config);
        } catch {
          return defaultConfig(configured);
        }
      }
      return defaultConfig(configured);
    }),
    [error, E] = useState(''),
    [busy, B] = useState(false);
  const configBaseline = useRef(snapshotConfig(config));
  useEffect(() => {
    onConfigDirtyChange?.(
      !!configured && snapshotConfig(config) !== configBaseline.current,
    );
  }, [configured, config, onConfigDirtyChange]);
  const configKey = configured ? stockKey(configured, config) : '';
  const available = stockForConfig(
    data.movements,
    record.id,
    configKey,
    place || undefined,
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        try {
          if (configured) parseConfig(configured, config);
          if (!place) throw new Error('Elegí si el stock está en Ivan o Kriko.');
          if (!supplier) throw new Error('Elegí el proveedor.');
          await save(
            editing
              ? {
                  action: 'stock_update',
                  id: movement.id,
                  product_id: record.id,
                  quantity: Number(q),
                  reason,
                  location: place,
                  supplier_id: supplier,
                  config: configured ? config : undefined,
                  photos,
                }
              : {
                  action: 'stock',
                  product_id: record.id,
                  quantity: Number(q) * (kind === 'in' ? 1 : -1),
                  reason,
                  location: place,
                  supplier_id: supplier,
                  config: configured ? config : undefined,
                  photos,
                },
          );
        } catch (e) {
          E((e as Error).message);
        } finally {
          B(false);
        }
      }}
    >
      <ErrorBox message={error} />
      <div className="stock-current">
        <span>
          {configured ? 'Esta combinación' : 'Disponible'}
          {place ? ` · ${stockPlaceLabel(place)}` : ''}
        </span>
        <strong>
          {available} <small>unidades</small>
        </strong>
      </div>
      {configured ? (
        <>
          <p className="hint">
            Elegí las variantes como en un pedido. Este movimiento no se asocia
            a un cliente.
          </p>
          <Configurator
            kind={configured}
            value={config}
            onChange={setConfig}
            movements={data.movements}
            productId={record.id}
            pricing={record.pricing}
            currency={data.currency}
            onError={E}
            onBusy={B}
          />
        </>
      ) : null}
      <div className="form-grid">
        {editing ? null : (
          <Field label="Movimiento">
            <Pick
              label="Movimiento"
              value={kind}
              onChange={K}
              options={[
                { value: 'in', label: 'Stock' },
                { value: 'out', label: 'Devolución' },
              ]}
            />
          </Field>
        )}
        <Field label="Cantidad *">
          <input
            type="number"
            min="1"
            max="100000"
            required
            value={q}
            onChange={(e) => Q(e.target.value)}
          />
        </Field>
        <Field label="Dónde está *">
          <Pick
            label="Dónde está"
            value={place}
            onChange={setPlace}
            options={STOCK_PLACES.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </Field>
        <Field label="Proveedor *">
          <Pick
            label="Proveedor"
            value={supplier}
            onChange={setSupplier}
            options={[
              { value: '', label: 'Elegí un proveedor' },
              ...data.contacts
                .filter(
                  (c) =>
                    c.kind === 'supplier' &&
                    (!c.archived || c.id === supplier),
                )
                .map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </Field>
        <Field label="Motivo" wide>
          <input
            value={reason}
            onChange={(e) => R(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Foto de la unidad" wide>
          <Photos
            value={photos}
            max={4}
            camera
            onChange={setPhotos}
            onBusy={U}
            onError={E}
          />
        </Field>
      </div>
      {editing ? null : (
        <p className="hint">
          El movimiento queda registrado. Las correcciones se realizan editando
          el registro o con un movimiento inverso.
        </p>
      )}
      {editing ? null : (
        <>
          <h3 className="form-section">Últimos movimientos</h3>
          {data.movements
            .filter((m) => m.product_id === record.id)
            .slice(0, 8)
            .map((m) => (
              <div className="history-line" key={m.id}>
                {m.photos?.[0] ? (
                  <ProductPhoto name={record.name} url={m.photos[0]} />
                ) : null}
                <span>
                  {m.reason || (m.quantity > 0 ? 'Stock' : 'Devolución')}
                  <small>
                    {[
                      stockPlaceLabel(m.location),
                      data.contacts.find((c) => c.id === m.supplier_id)?.name,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                  <small>{movementWhen(data.partners, m)}</small>
                </span>
                <b>
                  {m.quantity > 0 ? '+' : ''}
                  {m.quantity}
                </b>
              </div>
            ))}
        </>
      )}
      {onCancel ? (
        <div className="form-footer" style={{ borderTop: 0, marginTop: 0 }}>
          <button type="button" className="secondary" onClick={onCancel}>
            Volver al detalle
          </button>
        </div>
      ) : null}
      <Footer
        busy={busy || uploading}
        label={editing ? 'Guardar cambios' : 'Registrar movimiento'}
      />
    </form>
  );
}
export function SettingsForm({
  data,
  save,
  user,
  onLogout,
}: {
  data: Data;
  save: Save;
  user?: { name: string; email: string };
  onLogout?: () => Promise<void>;
}) {
  const [currency, C] = useState(data.currency),
    [cat, S] = useState(data.categories[0]?.id || ''),
    [fields, F] = useState(
      JSON.stringify(data.categories[0]?.fields || [], null, 2),
    ),
    [partnerName, setPartnerName] = useState(''),
    [partnerShare, setPartnerShare] = useState(''),
    [shares, setShares] = useState(() =>
      Object.fromEntries(
        data.partners
          .filter((partner) => !partner.archived)
          .map((partner) => [partner.id, shareInput(partner.share)]),
      ),
    ),
    [emails, setEmails] = useState(() =>
      Object.fromEntries(
        data.partners
          .filter((partner) => !partner.archived)
          .map((partner) => [partner.id, partner.email || '']),
      ),
    ),
    [passwords, setPasswords] = useState<Record<string, string>>({}),
    [error, E] = useState(''),
    [busy, B] = useState(false);
  const partners = data.partners.filter((partner) => !partner.archived);
  useEffect(() => {
    setShares(
      Object.fromEntries(
        data.partners
          .filter((partner) => !partner.archived)
          .map((partner) => [partner.id, shareInput(partner.share)]),
      ),
    );
    setEmails(
      Object.fromEntries(
        data.partners
          .filter((partner) => !partner.archived)
          .map((partner) => [partner.id, partner.email || '']),
      ),
    );
  }, [data.partners]);
  function draftShare(value: string) {
    try {
      return parseShare(value);
    } catch {
      return null;
    }
  }
  const draftPartners = partners.map((partner) => ({
    ...partner,
    share: draftShare(shares[partner.id] ?? '') ?? 0,
  }));
  const newShare = draftShare(partnerShare);
  const draftTotal =
    sharesTotal(draftPartners) +
    (partnerName.trim() && newShare != null ? newShare : 0);
  const sharesReady =
    partners.every((partner) => draftShare(shares[partner.id] ?? '') != null) &&
    (!partnerName.trim() || newShare != null) &&
    (partners.length || partnerName.trim()) &&
    draftTotal === SHARE_TOTAL;
  async function run(body: Record<string, unknown>) {
    B(true);
    E('');
    try {
      await save(body);
      return true;
    } catch (e) {
      E((e as Error).message);
      return false;
    } finally {
      B(false);
    }
  }
  return (
    <div>
      <ErrorBox message={error} />
      {user ? (
        <div className="settings-session">
          <p className="hint">
            Sesión de {user.name}
            {user.email ? ` · ${user.email}` : ''}
          </p>
          {onLogout ? (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void onLogout()}
            >
              Cerrar sesión
            </button>
          ) : null}
        </div>
      ) : null}
      <h3>Moneda comercial</h3>
      <p className="hint">
        Inicialmente ARS. Sólo puede cambiarse antes de cargar productos o
        pedidos; no realiza conversiones.
      </p>
      <div className="toolbar">
        <Pick
          label="Moneda"
          value={currency}
          onChange={C}
          options={options(['ARS', 'USD', 'EUR'])}
        />
        <button
          className="secondary"
          disabled={busy || data.products.length > 0 || data.orders.length > 0}
          onClick={() => run({ action: 'currency', currency })}
        >
          Guardar moneda
        </button>
      </div>
      <section className="form-section">
        <h3>Socios</h3>
        <p className="hint">
          Cada socio tiene un % de la ganancia. Los porcentajes deben sumar
          100%.
        </p>
        {partners.length ? (
          <ul className="settings-partners">
            {partners.map((partner) => (
              <li key={partner.id}>
                <span>{partner.name}</span>
                <label className="settings-partner-share">
                  <input
                    inputMode="decimal"
                    aria-label={`Porcentaje de ${partner.name}`}
                    value={shares[partner.id] ?? ''}
                    onChange={(e) =>
                      setShares({ ...shares, [partner.id]: e.target.value })
                    }
                  />
                  <span>%</span>
                </label>
              </li>
            ))}
            <li
              className={`settings-partners-total${
                draftTotal === SHARE_TOTAL ? '' : ' is-invalid'
              }`}
            >
              <span>Total</span>
              <strong>{shareLabel(draftTotal)}</strong>
            </li>
          </ul>
        ) : (
          <p className="hint">Todavía no hay socios.</p>
        )}
        <form
          className="settings-partner-form"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const next = [
                ...partners.map((partner) => ({
                  id: partner.id,
                  name: partner.name,
                  share: parseShare(shares[partner.id] ?? ''),
                })),
                ...(partnerName.trim()
                  ? [
                      {
                        name: partnerName.trim(),
                        share: parseShare(partnerShare),
                      },
                    ]
                  : []),
              ];
              void run({ action: 'partner_shares', partners: next }).then(
                (ok) => {
                  if (ok) {
                    setPartnerName('');
                    setPartnerShare('');
                  }
                },
              );
            } catch (err) {
              E((err as Error).message);
            }
          }}
        >
          <div className="settings-partner-fields">
            <Field label="Nombre">
              <input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
              />
            </Field>
            <Field label="%">
              <input
                inputMode="decimal"
                value={partnerShare}
                onChange={(e) => setPartnerShare(e.target.value)}
              />
            </Field>
          </div>
          <button className="secondary" disabled={busy || !sharesReady}>
            {busy
              ? 'Guardando…'
              : partnerName.trim()
                ? 'Agregar socio'
                : 'Guardar porcentajes'}
          </button>
        </form>
      </section>
      <section className="form-section">
        <h3>Acceso de socios</h3>
        <p className="hint">
          Cada socio ingresa con email y contraseña. Dejá la contraseña en
          blanco para no cambiarla.
        </p>
        {partners.length ? (
          partners.map((partner) => (
            <form
              className="settings-partner-access"
              key={partner.id}
              onSubmit={(e) => {
                e.preventDefault();
                void run({
                  action: 'partner_access',
                  id: partner.id,
                  email: emails[partner.id] || '',
                  password: passwords[partner.id] || undefined,
                }).then((ok) => {
                  if (ok)
                    setPasswords({ ...passwords, [partner.id]: '' });
                });
              }}
            >
              <div className="settings-partner-access-head">
                <b>{partner.name}</b>
                <small>
                  {partner.has_password ? 'Acceso activo' : 'Sin contraseña'}
                </small>
              </div>
              <div className="settings-partner-fields settings-partner-access-fields">
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={emails[partner.id] || ''}
                    onChange={(e) =>
                      setEmails({ ...emails, [partner.id]: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label={
                    partner.has_password
                      ? 'Nueva contraseña'
                      : 'Contraseña'
                  }
                >
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      partner.has_password
                        ? 'Dejá en blanco para no cambiar'
                        : 'Mínimo 8 caracteres'
                    }
                    value={passwords[partner.id] || ''}
                    onChange={(e) =>
                      setPasswords({
                        ...passwords,
                        [partner.id]: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <button className="secondary" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar acceso'}
              </button>
            </form>
          ))
        ) : (
          <p className="hint">Todavía no hay socios.</p>
        )}
      </section>
      <section className="form-section">
        <h3>Características por categoría</h3>
        <p className="hint">
          Definí campos y valores permitidos. Una lista vacía permite texto
          libre. Los pedidos anteriores conservan sus características.
        </p>
        <Pick
          label="Categoría a configurar"
          value={cat}
          onChange={(v) => {
            S(v);
            F(
              JSON.stringify(
                data.categories.find((c) => c.id === v)?.fields || [],
                null,
                2,
              ),
            );
          }}
          options={data.categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="category-fields">
          {(() => {
            try {
              const current = JSON.parse(fields) as {
                name: string;
                values: string[];
              }[];
              return current.map((field, i) => (
                <div className="category-field" key={i}>
                  <Field label="Característica">
                    <input
                      value={field.name}
                      onChange={(e) =>
                        F(
                          JSON.stringify(
                            current.map((f, n) =>
                              n === i ? { ...f, name: e.target.value } : f,
                            ),
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Valores separados por coma">
                    <input
                      value={field.values.join(',')}
                      onChange={(e) =>
                        F(
                          JSON.stringify(
                            current.map((f, n) =>
                              n === i
                                ? {
                                    ...f,
                                    values: e.target.value
                                      ? e.target.value.split(',')
                                      : [],
                                  }
                                : f,
                            ),
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    className="icon-button"
                    aria-label="Quitar característica"
                    onClick={() =>
                      F(JSON.stringify(current.filter((_, n) => n !== i)))
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ));
            } catch {
              return null;
            }
          })()}
        </div>
        <button
          className="secondary"
          onClick={() =>
            F(JSON.stringify([...JSON.parse(fields), { name: '', values: [] }]))
          }
        >
          <Plus size={16} /> Agregar característica
        </button>
        <div className="form-footer">
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              run({
                action: 'category',
                id: cat,
                fields: JSON.parse(fields).map(
                  (f: { name: string; values: string[] }) => ({
                    ...f,
                    values: f.values.map((v) => v.trim()).filter(Boolean),
                  }),
                ),
              })
            }
          >
            Guardar características
          </button>
        </div>
      </section>
    </div>
  );
}
