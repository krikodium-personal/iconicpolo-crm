'use client';
import { useState } from 'react';
import { Package, Plus, Settings2 } from 'lucide-react';
import {
  BOTA_BASE_MODELO,
  BOTA_MODELOS,
  KIND_TITLES,
  PRICED_GROUPS,
  botaModeloPriceId,
  configuredKindOf,
  configuredProductOf,
  type ConfiguredKind,
  type ConfiguredPricing,
} from '@/lib/configure';
import { decimal, formatMoney, parseDecimal } from '@/lib/money';
import type { Data, Product } from '@/lib/types';
import { ErrorBox, Field, Photos } from './ui';
import type { Save } from './forms';

function moneyField(value: string) {
  return value.trim() ? parseDecimal(value) : 0;
}

function splitModelo(kind: ConfiguredKind | null) {
  if (kind === 'rodillera') {
    return { baseId: 'modelo_standard', extraIds: ['modelo_premium'] };
  }
  if (kind === 'casco') {
    return { baseId: 'modelo_standard', extraIds: ['modelo_h1'] };
  }
  if (kind === 'bota') {
    return {
      baseId: botaModeloPriceId(BOTA_BASE_MODELO),
      extraIds: BOTA_MODELOS.filter((modelo) => modelo.id !== BOTA_BASE_MODELO).map(
        (modelo) => botaModeloPriceId(modelo.id),
      ),
    };
  }
  return null;
}

export function TypeCards({
  data,
  onOpen,
  onStock,
  onViewStock,
}: {
  data: Data;
  onOpen: (product: Product) => void;
  onStock: (product: Product) => void;
  onViewStock: (product: Product) => void;
}) {
  return (
    <div className="type-card-grid">
      {(['montura', 'casco', 'rodillera', 'bota'] as ConfiguredKind[]).map((kind) => {
        const product = configuredProductOf(data.products, kind);
        if (!product) return null;
        const pending =
          product.attributes.Costo === 'Pendiente de definir' ||
          product.attributes['Precio de lista'] === 'Pendiente de definir';
        const extras = product.pricing?.extras || {};
        const premium = extras.modelo_premium;
        const h1 = extras.modelo_h1;
        const botaExtras = BOTA_MODELOS.filter(
          (modelo) => modelo.id !== BOTA_BASE_MODELO,
        ).map((modelo) => extras[botaModeloPriceId(modelo.id)]);
        const botaShort = {
          standard_doble_cuero: 'Standard DC',
          standard_triple_cuero: 'Standard TC',
          polo_argentino_doble_cuero: 'Polo DC',
          polo_argentino_triple_cuero: 'Polo TC',
          texanas: 'Texanas',
        } as const;
        return (
          <article key={kind} className="type-card">
            <div className="type-card-copy">
              <small>Producto configurable</small>
              <strong>{KIND_TITLES[kind]}</strong>
              <p>
                {pending
                  ? 'Falta definir el precio base y las variantes.'
                  : kind === 'rodillera' && premium
                    ? `Standard ${formatMoney(product.price, data.currency)} · Premium ${formatMoney(product.price + premium.price, data.currency)}`
                    : kind === 'casco' && h1
                      ? `Standard ${formatMoney(product.price, data.currency)} · H1 ${formatMoney(product.price + h1.price, data.currency)}`
                      : kind === 'bota' && botaExtras.some(Boolean)
                        ? BOTA_MODELOS.map((modelo) => {
                            const extra =
                              modelo.id === BOTA_BASE_MODELO
                                ? null
                                : extras[botaModeloPriceId(modelo.id)];
                            return `${botaShort[modelo.id]} ${formatMoney(product.price + (extra?.price || 0), data.currency)}`;
                          }).join(' · ')
                        : `${formatMoney(product.price, data.currency)} lista`}
              </p>
            </div>
            <div className="type-card-actions">
              <button
                type="button"
                className="primary"
                onClick={() => onOpen(product)}
              >
                <Settings2 size={16} />
                Configurar
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => onStock(product)}
              >
                <Plus size={16} />
                Agregar stock
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => onViewStock(product)}
              >
                <Package size={16} />
                Ver stock ({product.stock})
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function TypeConfigForm({
  record,
  data,
  save,
  onStock,
}: {
  record: Product;
  data: Data;
  save: Save;
  onStock: () => void;
}) {
  const kind = configuredKindOf(record);
  const split = splitModelo(kind);
  const [f, set] = useState({
    photos: record.photos,
    cost: record.cost ? decimal(record.cost) : '',
    price: record.price ? decimal(record.price) : '',
    ff_discount: decimal(record.ff_discount),
    ff_price: record.ff_price == null ? '' : decimal(record.ff_price),
    extras: Object.fromEntries(
      (kind ? PRICED_GROUPS[kind] : []).flatMap((group) =>
        group.options.map((option) => {
          if (split && option.id === split.baseId) {
            return [
              option.id,
              {
                cost: record.cost ? decimal(record.cost) : '',
                price: record.price ? decimal(record.price) : '',
              },
            ];
          }
          if (split && split.extraIds.includes(option.id)) {
            const extra = record.pricing?.extras[option.id];
            return [
              option.id,
              {
                cost: extra ? decimal(record.cost + extra.cost) : '',
                price: extra ? decimal(record.price + extra.price) : '',
              },
            ];
          }
          const extra = record.pricing?.extras[option.id];
          return [
            option.id,
            {
              cost: extra ? decimal(extra.cost) : '',
              price: extra ? decimal(extra.price) : '',
            },
          ];
        }),
      ),
    ) as Record<string, { cost: string; price: string }>,
  });
  const [error, E] = useState('');
  const [busy, B] = useState(false);
  const [uploading, U] = useState(false);
  if (!kind) return <p className="hint">Este producto no es configurable.</p>;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        try {
          let cost = f.cost.trim() ? parseDecimal(f.cost) : 0;
          let price = f.price.trim() ? parseDecimal(f.price) : 0;
          const ffPrice = f.ff_price.trim() ? parseDecimal(f.ff_price) : null;
          const extras = Object.fromEntries(
            Object.entries(f.extras).map(([id, extra]) => [
              id,
              {
                cost: moneyField(extra.cost),
                price: moneyField(extra.price),
              },
            ]),
          );
          if (split) {
            const baseCost = moneyField(f.extras[split.baseId]?.cost);
            const basePrice = moneyField(f.extras[split.baseId]?.price);
            cost = baseCost;
            price = basePrice;
            delete extras[split.baseId];
            for (const extraId of split.extraIds) {
              extras[extraId] = {
                cost: Math.max(
                  0,
                  moneyField(f.extras[extraId]?.cost) - baseCost,
                ),
                price: Math.max(
                  0,
                  moneyField(f.extras[extraId]?.price) - basePrice,
                ),
              };
            }
          }
          const pricing: ConfiguredPricing = { extras };
          await save({
            action: 'product',
            id: record.id,
            version: record.version,
            name: record.name,
            sku: record.sku,
            category: record.category,
            supplier_id: record.supplier_id,
            photos: f.photos,
            options: [],
            cost,
            price,
            ff_discount: parseDecimal(f.ff_discount || '0'),
            ff_price: ffPrice,
            promo_kind: record.promo_kind || 'none',
            promo_value: record.promo_value || 0,
            attributes: {
              ...record.attributes,
              ...(cost ? {} : { Costo: 'Pendiente de definir' }),
              ...(price ? {} : { 'Precio de lista': 'Pendiente de definir' }),
            },
            pricing,
          });
        } catch (err) {
          E((err as Error).message);
        } finally {
          B(false);
        }
      }}
    >
      <ErrorBox message={error} />
      <p className="hint">
        {kind === 'rodillera'
          ? 'Standard y Premium tienen su propio costo y precio de lista. Iniciales y bordado se suman a ese valor.'
          : kind === 'casco'
            ? 'H1 homologado y Standard sin homologar tienen su propio costo y precio de lista. El resto de las variantes se suma a ese valor.'
            : kind === 'bota'
              ? 'Cada modelo de bota tiene su propio costo y precio de lista. El resto de las variantes se suma a ese valor.'
              : 'Estos precios se usan en cada pedido. Las variantes se suman al precio base; dejá 0 si esa opción no cambia el valor.'}
      </p>
      <section className="form-section">
        <h3>Fotos</h3>
        <Photos
          value={f.photos}
          onChange={(photos) => set({ ...f, photos })}
          onError={E}
          onBusy={U}
        />
      </section>
      <section className="form-section">
        <h3>Opción base · {data.currency}</h3>
        {split ? (
          <div className="price-variant-list">
            {PRICED_GROUPS[kind]
              .find((group) => group.id === 'modelo')
              ?.options.map((option) => (
                <div key={option.id} className="price-variant-row">
                  <span>{option.label}</span>
                  <label>
                    Costo *
                    <input
                      required
                      inputMode="decimal"
                      placeholder="0.00"
                      value={f.extras[option.id]?.cost || ''}
                      onChange={(e) =>
                        set({
                          ...f,
                          extras: {
                            ...f.extras,
                            [option.id]: {
                              ...f.extras[option.id],
                              cost: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Precio lista *
                    <input
                      required
                      inputMode="decimal"
                      placeholder="0.00"
                      value={f.extras[option.id]?.price || ''}
                      onChange={(e) =>
                        set({
                          ...f,
                          extras: {
                            ...f.extras,
                            [option.id]: {
                              ...f.extras[option.id],
                              price: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              ))}
          </div>
        ) : (
          <div className="form-grid">
            <Field
              label="Costo base *"
              pending={!f.cost || f.cost === '0' || f.cost === '0.00'}
            >
              <input
                required
                inputMode="decimal"
                value={f.cost}
                onChange={(e) => set({ ...f, cost: e.target.value })}
              />
            </Field>
            <Field
              label="Precio lista base *"
              pending={!f.price || f.price === '0' || f.price === '0.00'}
            >
              <input
                required
                inputMode="decimal"
                value={f.price}
                onChange={(e) => set({ ...f, price: e.target.value })}
              />
            </Field>
          </div>
        )}
        <div className="form-grid" style={{ marginTop: 14 }}>
          <Field label="Descuento Friends & Family (%)">
            <input
              required
              inputMode="decimal"
              value={f.ff_discount}
              onChange={(e) => set({ ...f, ff_discount: e.target.value })}
            />
          </Field>
          <Field label="Precio Friends & Family exacto">
            <input
              inputMode="decimal"
              placeholder="Opcional"
              value={f.ff_price}
              onChange={(e) => set({ ...f, ff_price: e.target.value })}
            />
          </Field>
        </div>
      </section>
      {PRICED_GROUPS[kind]
        .filter((group) => !(split && group.id === 'modelo'))
        .map((group) => (
        <section key={group.id} className="form-section">
          <h3>{group.label}</h3>
          <div className="price-variant-list">
            {group.options.map((option) => (
              <div key={option.id} className="price-variant-row">
                <span>{option.label}</span>
                <label>
                  Costo extra
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={f.extras[option.id]?.cost || ''}
                    onChange={(e) =>
                      set({
                        ...f,
                        extras: {
                          ...f.extras,
                          [option.id]: {
                            ...f.extras[option.id],
                            cost: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Precio extra
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={f.extras[option.id]?.price || ''}
                    onChange={(e) =>
                      set({
                        ...f,
                        extras: {
                          ...f.extras,
                          [option.id]: {
                            ...f.extras[option.id],
                            price: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="form-footer">
        <button type="button" className="secondary" onClick={onStock}>
          Registrar stock
        </button>
        <button className="primary" disabled={busy || uploading}>
          {busy ? 'Guardando…' : 'Guardar precios'}
        </button>
      </div>
    </form>
  );
}
