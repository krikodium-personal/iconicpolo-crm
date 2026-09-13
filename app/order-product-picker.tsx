'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  configuredKindOf,
  isConfiguredProduct,
  parseConfig,
  stockByConfig,
  stockPlaceLabel,
  summarizeConfig,
  type ProductConfig,
} from '@/lib/configure';
import { formatMoney, friendsPrice } from '@/lib/money';
import type { Data, Product } from '@/lib/types';
import { TypeCards } from './type-config';
import { ProductPhoto } from './ui';

const PENDING = 'Pendiente de definir';

function isPending(value: string | undefined) {
  return value === PENDING;
}

function stockLabel(product: Product, config: Record<string, unknown>) {
  const kind = configuredKindOf(product);
  if (!kind || !Object.keys(config || {}).length)
    return 'Combinación sin detalle';
  try {
    return summarizeConfig(kind, config as ProductConfig);
  } catch {
    return 'Combinación sin detalle';
  }
}

function OrderStockPicker({
  product,
  data,
  onPick,
  onBack,
  onCancel,
}: {
  product: Product;
  data: Data;
  onPick: (
    product: Product,
    config?: ProductConfig,
    supplierId?: string,
    fromStock?: boolean,
    stockQty?: number,
  ) => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const kind = configuredKindOf(product);
  const rows = stockByConfig(data.movements, product.id).filter(
    (row) => row.quantity > 0,
  );
  return (
    <div className="order-picker">
      <div className="section-heading">
        <h3>Stock de {product.name}</h3>
        <div className="order-picker-actions">
          <button type="button" className="secondary" onClick={onBack}>
            Volver
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
      <p className="hint">
        Elegí una unidad ya cargada. Queda en el pedido con esa combinación,
        proveedor y stock. No se puede personalizar.
      </p>
      {rows.length ? (
        <div className="order-stock-list">
          {rows.map((row) => {
            let config: ProductConfig | undefined;
            if (kind) {
              try {
                config = parseConfig(kind, row.config);
              } catch {
                config = undefined;
              }
            }
            return (
              <button
                key={row.key}
                type="button"
                className="stock-item order-stock-pick"
                onClick={() =>
                  onPick(
                    product,
                    config,
                    row.supplier_id,
                    true,
                    row.quantity,
                  )
                }
              >
                <div>
                  <b>{stockLabel(product, row.config)}</b>
                  <small>
                    {[
                      stockPlaceLabel(row.location),
                      data.contacts.find((c) => c.id === row.supplier_id)?.name,
                      `${row.quantity} uds.`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </div>
                <strong>
                  Elegir
                  <small>
                    {row.quantity} uds.
                  </small>
                </strong>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="hint">Todavía no hay unidades cargadas.</p>
      )}
    </div>
  );
}

export function OrderProductPicker({
  data,
  onPick,
  onCancel,
}: {
  data: Data;
  onPick: (
    product: Product,
    config?: ProductConfig,
    supplierId?: string,
    fromStock?: boolean,
    stockQty?: number,
  ) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [stockOf, setStockOf] = useState<Product | null>(null);
  const money = (n: number) => formatMoney(n, data.currency);
  const products = data.products.filter(
    (product) =>
      !product.archived &&
      !isConfiguredProduct(product) &&
      `${product.name} ${product.sku}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  if (stockOf) {
    return (
      <OrderStockPicker
        product={stockOf}
        data={data}
        onPick={onPick}
        onBack={() => setStockOf(null)}
        onCancel={onCancel}
      />
    );
  }
  return (
    <div className="order-picker">
      <div className="section-heading">
        <h3>Elegí un producto</h3>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      <p className="hint">
        Personalizá uno nuevo o mirá el stock para elegir una unidad ya
        cargada. También podés sumar un SKU del catálogo.
      </p>
      <label className="search">
        <Search size={17} />
        <input
          aria-label="Buscar producto"
          placeholder="Buscar producto o SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <TypeCards
        data={data}
        match={query}
        onPick={onPick}
        onViewStock={setStockOf}
      />
      {products.length ? (
        <div className="record-card-list order-picker-skus">
          {products.map((product) => {
            const categoryName = data.categories.find(
              (c) => c.id === product.category,
            )?.name;
            const costPending = isPending(product.attributes.Costo);
            const pricePending = isPending(
              product.attributes['Precio de lista'],
            );
            const ffPending = isPending(product.attributes['Precio F&F']);
            const ff = friendsPrice(product);
            return (
              <button
                key={product.id}
                type="button"
                className="record-card clickable-row order-pick-card"
                onClick={() =>
                  onPick(product, undefined, product.supplier_id || undefined)
                }
              >
                <div className="record-card-top">
                  <ProductPhoto name={product.name} url={product.photos[0]} />
                  <div className="record-card-id">
                    <span className="record-link">{product.name}</span>
                    <small>{product.sku}</small>
                    <small>{categoryName || product.category}</small>
                  </div>
                </div>
                <div className="record-card-meta">
                  <span
                    className={`stock-pill ${product.stock <= 2 ? 'low' : ''}`}
                  >
                    {product.stock} uds.
                  </span>
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
                    </dd>
                  </div>
                </dl>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="hint">No hay SKU que coincidan con la búsqueda.</p>
      )}
    </div>
  );
}
