'use client';
/* eslint-disable react/react-compiler -- Compiler analysis crashes on dynamic order snapshots (Invariant phi predecessor); React Compiler is not enabled. */
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import type {
  Contact,
  Product,
  Order,
  Data,
  Option,
  Item,
  Movement,
} from '@/lib/types';
import {
  decimal,
  parseDecimal,
  formatMoney,
  margin,
  markup,
  lineTotals,
  promoPrice,
  friendsPrice,
} from '@/lib/money';
import { closedFields, findVariantProduct, skuFields } from '@/lib/variants';
import {
  configuredKindOf,
  defaultConfig,
  extraTotals,
  isConfiguredCategory,
  isConfiguredProduct,
  parseConfig,
  STOCK_PLACES,
  stockKey,
  stockForConfig,
  stockAtPlace,
  stockPlaceLabel,
  summarizeConfig,
  type ProductConfig,
} from '@/lib/configure';
import { Configurator } from './configure-form';
import {
  Field,
  Pick,
  Check,
  Photos,
  ErrorBox,
  Status,
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
    (o) => o.customer_id === record?.id && o.status === 'cerrado',
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
    ff_discount: decimal(record?.ff_discount ?? 1500),
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
        : friendsPrice({ price, ff_discount: parseDecimal(f.ff_discount) }),
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
            ff_discount: parseDecimal(f.ff_discount),
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
              inputMode="decimal"
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
                    {new Date(m.created_at).toLocaleString('es-AR')}
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
                {detail ? <small>{detail}</small> : null}
                <small>{new Date(m.created_at).toLocaleString('es-AR')}</small>
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
export function OrderForm({
  record,
  data,
  save,
}: {
  record?: Order;
  data: Data;
  save: Save;
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
      snapshot: i,
    })) || [],
  );
  const [busy, B] = useState(false);
  const [error, E] = useState('');
  const closed = record?.status === 'cerrado';
  function update(key: string, change: Partial<DraftItem>) {
    I(items.map((i) => (i.key === key ? { ...i, ...change } : i)));
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
          await save({
            action: 'order',
            ...f,
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
          <b>Pedido cerrado</b>
          <p>
            Los precios y el stock están confirmados. Reabrí el pedido para
            modificarlo; se devolverán las unidades al stock.
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
              options={data.contacts
                .filter(
                  (c) =>
                    c.kind === 'customer' &&
                    (!c.archived || c.id === record?.customer_id),
                )
                .map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Estado">
            <Pick
              disabled={closed}
              label="Estado"
              value={f.status}
              onChange={(v) => set({ ...f, status: v })}
              options={options([
                'nuevo',
                'abierto',
                'en producción',
                'cerrado',
              ])}
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
                    <b>{i.snapshot.name}</b>
                    <small>
                      {i.snapshot.sku} · precio y costo guardados en este pedido
                    </small>
                    {i.snapshot.selections.options.map((o) => (
                      <span key={o.id}>
                        {o.name} · +{formatMoney(o.price, data.currency)}
                      </span>
                    ))}
                    {Object.entries(i.attributes).map(([k, v]) => (
                      <span key={k}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Field label="Producto *">
                    <Pick
                      label={`Producto del ítem ${index + 1}`}
                      value={i.product_id}
                      onChange={(v) => {
                        const next = data.products.find((x) => x.id === v);
                        const fields =
                          data.categories.find((c) => c.id === next?.category)
                            ?.fields || [];
                        const kind = next ? configuredKindOf(next) : null;
                        update(i.key, {
                          product_id: v,
                          option_ids: [],
                          attributes: productFieldValues(next, fields),
                          config: kind ? defaultConfig(kind) : undefined,
                        });
                      }}
                      options={data.products
                        .filter((product) => !product.archived)
                        .map((product) => ({
                          value: product.id,
                          label: isConfiguredProduct(product)
                            ? `${product.name} · a configurar · ${product.stock} uds.`
                            : `${product.name} · ${product.sku} · ${product.stock} uds.`,
                        }))}
                    />
                  </Field>
                )}
                <div className="form-grid line-fields">
                  <Field label="Cantidad *">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={i.quantity}
                      onChange={(e) =>
                        update(i.key, { quantity: e.target.value })
                      }
                    />
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
                {!i.snapshot && p && (
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
                )}
                {t && (
                  <div className="line-summary">
                    <span>Unitario {formatMoney(t.price, data.currency)}</span>
                    <span>Costo {formatMoney(t.cost, data.currency)}</span>
                    <span>Ganancia {formatMoney(t.profit, data.currency)}</span>
                    <b>{formatMoney(t.total, data.currency)}</b>
                  </div>
                )}
              </div>
            );
          })}
          {!closed && (
            <button
              type="button"
              className="secondary"
              onClick={() =>
                I([
                  ...items,
                  {
                    key: crypto.randomUUID(),
                    product_id: '',
                    quantity: '1',
                    discount: '0.00',
                    price_mode: 'list',
                    manual_price: '0.00',
                    option_ids: [],
                    attributes: {},
                  },
                ])
              }
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
        adicionales. El cierre descuenta stock; no hay reservas previas.
      </p>
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
  const kind = configuredKindOf(record);
  if (!kind || !Object.keys(config || {}).length)
    return 'Combinación sin detalle';
  try {
    return summarizeConfig(kind, config as ProductConfig);
  } catch {
    return 'Combinación sin detalle';
  }
}
export function StockOverview({
  record,
  data,
  onEdit,
}: {
  record: Product;
  data: Data;
  onEdit: (movement: Movement) => void;
}) {
  const items = data.movements.filter(
    (m) => m.product_id === record.id && m.quantity > 0,
  );
  return (
    <div className="stock-overview">
      <div className="stock-current stock-summary">
        <div>
          <span>Disponible</span>
          <strong>
            {record.stock} <small>unidades</small>
          </strong>
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
      {items.length ? (
        items.map((m) => (
          <div className="stock-item" key={m.id}>
            <div>
              <b>
                {configuredKindOf(record)
                  ? configLine(record, m.config)
                  : record.name}
              </b>
              <small>
                {[
                  stockPlaceLabel(m.location),
                  data.contacts.find((c) => c.id === m.supplier_id)?.name,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </div>
            <div className="stock-item-side">
              <strong>
                {m.quantity} <small>uds.</small>
              </strong>
              <button
                type="button"
                className="icon-button"
                title="Editar registro"
                aria-label="Editar registro"
                onClick={() => onEdit(m)}
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>
        ))
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
}: {
  record: Product;
  data: Data;
  save: Save;
  movement?: Movement;
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
                }
              : {
                  action: 'stock',
                  product_id: record.id,
                  quantity: Number(q) * (kind === 'in' ? 1 : -1),
                  reason,
                  location: place,
                  supplier_id: supplier,
                  config: configured ? config : undefined,
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
                  <small>{new Date(m.created_at).toLocaleString('es-AR')}</small>
                </span>
                <b>
                  {m.quantity > 0 ? '+' : ''}
                  {m.quantity}
                </b>
              </div>
            ))}
        </>
      )}
      <Footer
        busy={busy}
        label={editing ? 'Guardar cambios' : 'Registrar movimiento'}
      />
    </form>
  );
}
export function SettingsForm({ data, save }: { data: Data; save: Save }) {
  const [currency, C] = useState(data.currency),
    [cat, S] = useState(data.categories[0]?.id || ''),
    [fields, F] = useState(
      JSON.stringify(data.categories[0]?.fields || [], null, 2),
    ),
    [error, E] = useState(''),
    [busy, B] = useState(false);
  async function run(body: Record<string, unknown>) {
    B(true);
    E('');
    try {
      await save(body);
    } catch (e) {
      E((e as Error).message);
    } finally {
      B(false);
    }
  }
  return (
    <div>
      <ErrorBox message={error} />
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
