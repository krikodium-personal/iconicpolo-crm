'use client';

import Image from 'next/image';

type PublicItem = {
  id: string;
  name: string;
  detail: string;
  sku: string;
  photo: string;
  listPrice: number;
  price: number;
  listPriceLabel: string;
  priceLabel: string;
  kind: string;
  addon: boolean;
};

type PublicGroup = {
  categoryId: string;
  categoryName: string;
  items: PublicItem[];
};

export type PublicListaViewModel = {
  id: string;
  name: string;
  discount: number;
  discountLabel: string;
  currency: string;
  groups: PublicGroup[];
  itemCount: number;
};

export function PublicListaView({ lista }: { lista: PublicListaViewModel }) {
  return (
    <main className="public-lista">
      <header className="public-lista-hero">
        <p className="public-lista-brand">Iconic Polo</p>
        <h1>{lista.name}</h1>
        <p className="public-lista-lead">
          {lista.discount > 0
            ? `Precios con ${lista.discountLabel}% de descuento sobre lista.`
            : 'Precios de lista.'}{' '}
          {lista.itemCount}{' '}
          {lista.itemCount === 1 ? 'ítem' : 'ítems'} · {lista.currency}
        </p>
      </header>

      {lista.groups.length ? (
        lista.groups.map((group) => (
          <section key={group.categoryId} className="public-lista-group">
            <h2>{group.categoryName}</h2>
            <ul className="public-lista-rows">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className={`public-lista-row${item.addon ? ' is-addon' : ''}`}
                >
                  <div className="public-lista-photo">
                    {item.photo ? (
                      <Image
                        unoptimized
                        src={item.photo}
                        alt=""
                        width={72}
                        height={72}
                      />
                    ) : (
                      <span aria-hidden />
                    )}
                  </div>
                  <div className="public-lista-copy">
                    <b>
                      {item.addon ? `+ ${item.name}` : item.name}
                    </b>
                    <small>
                      {[item.detail, item.sku].filter(Boolean).join(' · ')}
                    </small>
                  </div>
                  <div className="public-lista-prices">
                    {item.price !== item.listPrice ? (
                      <small className="public-lista-list">
                        {item.addon ? '+' : ''}
                        {item.listPriceLabel}
                      </small>
                    ) : null}
                    <strong>
                      {item.addon ? '+' : ''}
                      {item.priceLabel}
                    </strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="public-lista-empty">
          Todavía no hay productos con precio publicado en esta lista.
        </p>
      )}

      <footer className="public-lista-foot">
        Iconic Polo Equipment · Lista {lista.name}
      </footer>
    </main>
  );
}
