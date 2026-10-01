'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  configuredKindOf,
  isConfiguredProduct,
  parseConfig,
  reservedHolds,
  stockAvailability,
  stockPlaceLabel,
  summarizeConfig,
  type ProductConfig,
  type StockHold,
} from '@/lib/configure';
import {
  cabezadaRiendasLabel,
  isCabezadaProduct,
  tryParseCabezadaConfig,
  type CabezadaConfig,
} from '@/lib/cabezada';
import { formatMoney, friendsPrice } from '@/lib/money';
import {
  quantityLabel,
  unitAgree,
  unitWord,
  type Data,
  type Product,
} from '@/lib/types';
import { TypeCards } from './type-config';
import { ProductPhoto } from './ui';

const PENDING = 'Pendiente de definir';

type OrderPickConfig = ProductConfig | CabezadaConfig;

function isPending(value: string | undefined) {
  return value === PENDING;
}

function stockLabel(product: Product, config: Record<string, unknown>) {
  if (isCabezadaProduct(product)) {
    const riendas = tryParseCabezadaConfig(config);
    if (riendas) return cabezadaRiendasLabel(riendas);
  }
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
  held = [],
  exceptOrderId,
  onPick,
  onBack,
  onCancel,
}: {
  product: Product;
  data: Data;
  held?: StockHold[];
  exceptOrderId?: string;
  onPick: (
    product: Product,
    config?: OrderPickConfig,
    supplierId?: string,
    fromStock?: boolean,
    stockQty?: number,
    location?: string,
  ) => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const kind = configuredKindOf(product);
  const rows = stockAvailability(
    data.movements,
    [...reservedHolds(data.orders, data.products, exceptOrderId), ...held],
    product.id,
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
        Elegí {unitWord(product.unit)} disponibles. L
        {unitAgree('', product.unit)} {unitAgree('asignad', product.unit)} a un
        pedido abierto o cerrado quedan {unitAgree('reservad', product.unit)};
        solo se puede tomar el remanente
        sin asignar.
      </p>
      {rows.length ? (
        <div className="order-stock-list">
          {rows.map((row) => {
            let config: OrderPickConfig | undefined;
            if (kind) {
              try {
                config = parseConfig(kind, row.config);
              } catch {
                config = undefined;
              }
            } else if (isCabezadaProduct(product)) {
              config = tryParseCabezadaConfig(row.config) || undefined;
            }
            const copy = (
              <div>
                <b>{stockLabel(product, row.config)}</b>
                <small>
                  {[
                    stockPlaceLabel(row.location),
                    data.contacts.find((c) => c.id === row.supplier_id)?.name,
                    row.available > 0
                      ? `${quantityLabel(row.available, product.unit)} disponible${row.available === 1 ? '' : 's'}`
                      : 'Sin disponible',
                    row.reserved
                      ? `${quantityLabel(row.reserved, product.unit)} ${unitAgree('reservad', product.unit, row.reserved)}`
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
                    {row.reservations.map((reservation) => (
                      <span
                        key={reservation.orderId}
                        className="stock-order-link is-static"
                        title={`Pedido ${reservation.orderNumber}`}
                      >
                        {data.contacts.find(
                          (contact) =>
                            contact.id ===
                            data.orders.find(
                              (order) => order.id === reservation.orderId,
                            )?.customer_id,
                        )?.name || reservation.orderNumber}{' '}
                        ·{' '}
                        {quantityLabel(reservation.quantity, product.unit)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
            if (row.available <= 0) {
              return (
                <div
                  key={row.key}
                  className="stock-item order-stock-pick is-reserved"
                >
                  {copy}
                  <strong>
                    Agotado
                    <small>
                      {quantityLabel(row.quantity, product.unit)} en pedidos
                    </small>
                  </strong>
                </div>
              );
            }
            return (
              <button
                key={row.key}
                type="button"
                className={`stock-item order-stock-pick${row.reserved ? ' is-reserved' : ''}`}
                onClick={() =>
                  onPick(
                    product,
                    config,
                    row.supplier_id,
                    true,
                    row.available,
                    row.location,
                  )
                }
              >
                {copy}
                <strong>
                  Elegir
                  <small>
                    {quantityLabel(row.available, product.unit)} disponible
                    {row.available === 1 ? '' : 's'}
                  </small>
                </strong>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="hint">
          Todavía no hay {unitWord(product.unit)}{' '}
          {unitAgree('cargad', product.unit)}.
        </p>
      )}
    </div>
  );
}

export function OrderProductPicker({
  data,
  held,
  exceptOrderId,
  onPick,
  onCancel,
}: {
  data: Data;
  held?: StockHold[];
  exceptOrderId?: string;
  onPick: (
    product: Product,
    config?: OrderPickConfig,
    supplierId?: string,
    fromStock?: boolean,
    stockQty?: number,
    location?: string,
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
        held={held}
        exceptOrderId={exceptOrderId}
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
            const available = stockAvailability(
              data.movements,
              [...reservedHolds(data.orders, data.products, exceptOrderId), ...(held || [])],
              product.id,
            ).reduce((sum, row) => sum + row.available, 0);
            const takeFromStock = available > 0;
            return (
              <button
                key={product.id}
                type="button"
                className="record-card clickable-row order-pick-card"
                onClick={() =>
                  onPick(
                    product,
                    undefined,
                    product.supplier_id || undefined,
                    takeFromStock,
                    takeFromStock ? available : undefined,
                  )
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
                    className={`stock-pill ${available <= 2 ? 'low' : ''}`}
                  >
                    {available} disp.
                    {product.stock > available
                      ? ` · ${product.stock - available} res.`
                      : ''}
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
