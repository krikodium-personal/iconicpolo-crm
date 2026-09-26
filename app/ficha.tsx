'use client';
import { useState, type CSSProperties } from 'react';
import { FileDown, ImageIcon, MessageCircle } from 'lucide-react';
import {
  fichaFileName,
  jpegToPdf,
  fichaArtworkTitle,
  buildFichaProductDetail,
  type FichaData,
  type FichaArtwork,
  type FichaProductDetail,
} from '@/lib/ficha';
import { formatMoney, decimal, parseDecimal } from '@/lib/money';
import type { Order } from '@/lib/types';
import { ProductPhoto, Check, Pick, Field } from './ui';

function hexLuminance(hex: string) {
  const n = hex.replace('#', '');
  if (n.length < 6) return 0;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mixHex(hex: string, toward: [number, number, number], amount: number) {
  const n = hex.replace('#', '');
  if (n.length < 6) return hex;
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `#${rgb
    .map((c, i) =>
      Math.round(c + (toward[i] - c) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadImage(src: string) {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const image = await new Promise<HTMLImageElement | null>((resolve) => {
      const next = new Image();
      next.onload = () => resolve(next);
      next.onerror = () => resolve(null);
      next.src = url;
    });
    URL.revokeObjectURL(url);
    return image?.naturalWidth ? image : null;
  } catch {
    return null;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      const next = `${line} ${word}`;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function fitImage(
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
  };
}

function blobToBytes(blob: Blob) {
  return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('No se pudo generar la ficha.')),
      type,
      quality,
    );
  });
}

async function renderFichaCanvas(ficha: FichaData) {
  const pageW = 794;
  const pad = 36;
  const contentW = pageW - pad * 2;
  const scale = 2;
  const [
    brand,
    photo,
    leather,
    ...artwork
  ] = await Promise.all([
    loadImage('/logo-iconic.png'),
    ficha.photo ? loadImage(ficha.photo) : Promise.resolve(null),
    ficha.initials?.surfacePhoto
      ? loadImage(ficha.initials.surfacePhoto)
      : Promise.resolve(null),
    ...ficha.artwork.map((piece) => loadImage(piece.url)),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = pageW * scale;
  canvas.height = 4800 * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo generar la ficha.');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageW, 4800);
  let y = pad;

  if (brand) {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(pad, y, 54, 60, 10);
    ctx.fill();
    ctx.drawImage(brand, pad + 8, y + 8, 38, 44);
  }
  ctx.fillStyle = '#5e7268';
  ctx.font = '650 11px system-ui, sans-serif';
  ctx.fillText('FICHA TÉCNICA PARA PROVEEDOR', pad + 62, y + 14);
  ctx.fillStyle = '#17292b';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(ficha.productTitle, pad + 62, y + 40);
  ctx.fillStyle = '#5e7268';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText(`Pedido Nro: ${ficha.orderNumber}  ·  ${ficha.date}`, pad + 62, y + 58);
  y += 78;
  ctx.strokeStyle = '#134c45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(pageW - pad, y);
  ctx.stroke();
  y += 18;

  const meta = [
    ['Cantidad', `${ficha.quantity} ${ficha.quantity === 1 ? 'ud.' : 'uds.'}`],
    ficha.supplierName ? ['Proveedor', ficha.supplierName] : null,
    ficha.customerName ? ['Cliente', ficha.customerName] : null,
    ficha.sku ? ['SKU', ficha.sku] : null,
  ].filter((row): row is [string, string] => Boolean(row));
  meta.forEach((row, index) => {
    const col = index % 2;
    const rowY = y + Math.floor(index / 2) * 42;
    const x = pad + col * (contentW / 2);
    ctx.fillStyle = '#6d7f72';
    ctx.font = '650 10px system-ui, sans-serif';
    ctx.fillText(row[0].toUpperCase(), x, rowY);
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(row[1], x, rowY + 18);
  });
  y += Math.ceil(meta.length / 2) * 42 + 10;

  const heading = (title: string) => {
    ctx.fillStyle = '#134c45';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(title.toUpperCase(), pad, y);
    y += 18;
  };

  heading('Descripción');
  ctx.fillStyle = '#17292b';
  ctx.font = '400 15px system-ui, sans-serif';
  for (const line of wrapText(ctx, ficha.description, contentW)) {
    ctx.fillText(line, pad, y);
    y += 21;
  }
  y += 10;

  if (photo) {
    heading(ficha.photoLabel || 'Referencia');
    const size = fitImage(photo, contentW, 220);
    ctx.fillStyle = '#f4f6f4';
    ctx.fillRect(pad, y, size.width, size.height);
    ctx.drawImage(photo, pad, y, size.width, size.height);
    y += size.height + 16;
  }

  if (ficha.labels.length) {
    heading('Especificaciones');
    for (const row of ficha.labels) {
      ctx.fillStyle = '#f7faf6';
      ctx.fillRect(pad, y - 12, contentW, 26);
      ctx.fillStyle = '#6d7f72';
      ctx.font = '400 12px system-ui, sans-serif';
      ctx.fillText(row.label, pad + 10, y);
      ctx.fillStyle = '#17292b';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(row.value, pad + 210, y);
      y += 26;
    }
    y += 10;
  }

  if (ficha.swatches.length) {
    heading('Colores');
    ficha.swatches.forEach((swatch, index) => {
      const col = index % 2;
      const rowY = y + Math.floor(index / 2) * 48;
      const x = pad + col * (contentW / 2);
      ctx.beginPath();
      ctx.roundRect(x, rowY - 18, 34, 34, 8);
      ctx.fillStyle = swatch.hex;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#6d7f72';
      ctx.font = '400 11px system-ui, sans-serif';
      ctx.fillText(swatch.label, x + 44, rowY - 4);
      ctx.fillStyle = '#17292b';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.fillText(swatch.name, x + 44, rowY + 14);
    });
    y += Math.ceil(ficha.swatches.length / 2) * 48 + 8;
  }

  if (ficha.initials) {
    heading('Iniciales');
    const boxH = 150;
    ctx.fillStyle = ficha.initials.surfaceHex || '#1c1612';
    ctx.beginPath();
    ctx.roundRect(pad, y, contentW, boxH, 10);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, y, contentW, boxH, 10);
    ctx.clip();
    if (leather) ctx.drawImage(leather, pad, y, contentW, boxH);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(pad, y, contentW, boxH);
    ctx.fillStyle = ficha.initials.hex;
    ctx.font = `500 52px ${ficha.initials.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ficha.initials.text, pad + contentW / 2, y + boxH / 2);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    y += boxH + 18;
    ctx.fillStyle = '#5e7268';
    ctx.font = '400 13px system-ui, sans-serif';
    ctx.fillText(
      [
        ficha.initials.fontName,
        ficha.initials.colorName,
        ficha.initials.size,
        ficha.initials.place ? `Ubicación: ${ficha.initials.place}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      pad,
      y,
    );
    y += 18;
  }

  ficha.artwork.forEach((piece, index) => {
    heading(fichaArtworkTitle(piece.kind));
    const image = artwork[index];
    if (image) {
      const size = fitImage(image, contentW, 200);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7e0db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pad, y, size.width + 24, size.height + 24, 10);
      ctx.fill();
      ctx.stroke();
      ctx.drawImage(image, pad + 12, y + 12, size.width, size.height);
      y += size.height + 36;
    }
    ctx.fillStyle = '#5e7268';
    ctx.font = '400 13px system-ui, sans-serif';
    ctx.fillText(piece.caption, pad, y);
    y += 20;
  });

  if (ficha.notes) {
    heading('Notas del pedido');
    ctx.fillStyle = '#17292b';
    ctx.font = '400 15px system-ui, sans-serif';
    for (const line of wrapText(ctx, ficha.notes, contentW)) {
      ctx.fillText(line, pad, y);
      y += 21;
    }
  }

  const used = Math.min(4780, Math.ceil(y + pad));
  const output = document.createElement('canvas');
  output.width = pageW * scale;
  output.height = used * scale;
  const out = output.getContext('2d');
  if (!out) throw new Error('No se pudo generar la ficha.');
  out.drawImage(canvas, 0, 0);
  const jpegBlob = await canvasToBlob(output, 'image/jpeg', 0.92);
  const pngBlob = await canvasToBlob(output, 'image/png');
  return {
    jpeg: await blobToBytes(jpegBlob),
    png: await blobToBytes(pngBlob),
    width: output.width,
    height: output.height,
  };
}

function canShareFiles(file: File) {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

function FichaDetailSections({
  detail,
  labels,
  artworkTitle,
}: {
  detail: FichaProductDetail;
  labels: {
    description: string;
    specs: string;
    colors: string;
    initials: string;
    placePrefix: string;
  };
  artworkTitle: (kind: FichaArtwork['kind']) => string;
}) {
  const initials = detail.initials;
  const surface = initials?.surfaceHex || '#1c1612';
  const darkSurface = hexLuminance(surface) < 0.48;
  const leatherStyle = initials
    ? ({
        '--preview-leather': surface,
        '--preview-leather-hi': mixHex(surface, [255, 255, 255], 0.2),
        '--preview-leather-lo': mixHex(surface, [0, 0, 0], 0.22),
        '--preview-leather-edge': mixHex(surface, [0, 0, 0], 0.28),
      } as CSSProperties)
    : undefined;
  return (
    <>
      {detail.description ? (
        <section className="ficha-block">
          <h2>{labels.description}</h2>
          <p className="ficha-description">{detail.description}</p>
        </section>
      ) : null}
      {detail.photo ? (
        <section className="ficha-block">
          <h2>{detail.photoLabel || labels.description}</h2>
          <img
            className="ficha-photo"
            src={detail.photo}
            alt={detail.productTitle}
          />
        </section>
      ) : null}
      {detail.labels.length ? (
        <section className="ficha-block">
          <h2>{labels.specs}</h2>
          <ul className="ficha-specs">
            {detail.labels.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {detail.swatches.length ? (
        <section className="ficha-block">
          <h2>{labels.colors}</h2>
          <ul className="ficha-swatches">
            {detail.swatches.map((swatch) => (
              <li key={`${swatch.label}-${swatch.name}`}>
                <span
                  className="ficha-chip"
                  style={{ background: swatch.hex }}
                  title={swatch.name}
                />
                <div>
                  <small>{swatch.label}</small>
                  <b>{swatch.name}</b>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {initials ? (
        <section className="ficha-block">
          <h2>{labels.initials}</h2>
          <div
            className={`ficha-initials${darkSurface ? ' on-dark' : ''}${
              initials.surfacePhoto ? ' has-photo' : ''
            }`}
            style={
              initials.surfacePhoto
                ? {
                    ...leatherStyle,
                    '--preview-leather-photo': `url(${initials.surfacePhoto})`,
                  }
                : leatherStyle
            }
          >
            {initials.surfacePhoto ? (
              <img src={initials.surfacePhoto} alt="" />
            ) : null}
            <span
              className="ficha-initials-mark"
              style={{ fontFamily: initials.fontFamily, color: initials.hex }}
            >
              {initials.text}
            </span>
          </div>
          <p className="ficha-initials-meta">
            {[
              initials.fontName,
              initials.colorName,
              initials.size,
              initials.place
                ? `${labels.placePrefix}: ${initials.place}`
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </section>
      ) : null}
      {detail.artwork.map((piece) => (
        <section className="ficha-block" key={piece.url}>
          <h2>{artworkTitle(piece.kind)}</h2>
          <img className="ficha-artwork" src={piece.url} alt={piece.caption} />
          <p className="ficha-initials-meta">{piece.caption}</p>
        </section>
      ))}
    </>
  );
}

export function FichaSheet({ ficha }: { ficha: FichaData }) {
  return (
    <article className="ficha-sheet">
      <header className="ficha-head">
        <img src="/logo-iconic.png" alt="Iconic" width={64} height={72} />
        <div>
          <p>Ficha técnica para proveedor</p>
          <h1>{ficha.productTitle}</h1>
          <small>
            Pedido Nro: {ficha.orderNumber} · {ficha.date}
          </small>
        </div>
      </header>
      <dl className="ficha-meta">
        <div>
          <dt>Cantidad</dt>
          <dd>
            {ficha.quantity} {ficha.quantity === 1 ? 'ud.' : 'uds.'}
          </dd>
        </div>
        {ficha.supplierName ? (
          <div>
            <dt>Proveedor</dt>
            <dd>{ficha.supplierName}</dd>
          </div>
        ) : null}
        {ficha.customerName ? (
          <div>
            <dt>Cliente</dt>
            <dd>{ficha.customerName}</dd>
          </div>
        ) : null}
        {ficha.sku ? (
          <div>
            <dt>SKU</dt>
            <dd>{ficha.sku}</dd>
          </div>
        ) : null}
      </dl>
      <FichaDetailSections
        detail={{
          productTitle: ficha.productTitle,
          description: ficha.description,
          photo: ficha.photo,
          photoLabel: ficha.photoLabel,
          labels: ficha.labels,
          swatches: ficha.swatches,
          initials: ficha.initials,
          artwork: ficha.artwork,
        }}
        labels={{
          description: 'Descripción',
          specs: 'Especificaciones',
          colors: 'Colores',
          initials: 'Iniciales',
          placePrefix: 'Ubicación',
        }}
        artworkTitle={(kind) => fichaArtworkTitle(kind)}
      />
      {ficha.notes ? (
        <section className="ficha-block">
          <h2>Notas del pedido</h2>
          <p className="ficha-description">{ficha.notes}</p>
        </section>
      ) : null}
    </article>
  );
}

export function FichaView({
  ficha,
  onBack,
}: {
  ficha: FichaData;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function files() {
    const captured = await renderFichaCanvas(ficha);
    const pdf = jpegToPdf(captured.jpeg, captured.width, captured.height);
    return {
      pdf: new File([new Uint8Array(pdf)], fichaFileName(ficha, 'pdf'), {
        type: 'application/pdf',
      }),
      image: new File(
        [new Uint8Array(captured.png)],
        fichaFileName(ficha, 'png'),
        { type: 'image/png' },
      ),
    };
  }

  async function run(label: string, work: () => Promise<void>) {
    setError('');
    setBusy(label);
    try {
      await work();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo generar la ficha.',
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="ficha-view">
      <button type="button" className="dialog-kicker" onClick={onBack}>
        ← Volver al pedido
      </button>
      <div className="ficha-toolbar">
        <h3>Ficha técnica</h3>
        <div className="ficha-actions">
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() =>
              void run('pdf', async () => {
                const next = await files();
                downloadBlob(next.pdf, next.pdf.name);
              })
            }
          >
            <FileDown size={16} />
            {busy === 'pdf' ? 'Generando…' : 'Descargar PDF'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() =>
              void run('image', async () => {
                const next = await files();
                downloadBlob(next.image, next.image.name);
              })
            }
          >
            <ImageIcon size={16} />
            {busy === 'image' ? 'Generando…' : 'Descargar imagen'}
          </button>
          <button
            type="button"
            className="primary"
            disabled={!!busy}
            onClick={() =>
              void run('share', async () => {
                const next = await files();
                if (canShareFiles(next.pdf)) {
                  try {
                    await navigator.share({
                      files: [next.pdf],
                    });
                  } catch (caught) {
                    if (
                      caught instanceof DOMException &&
                      caught.name === 'AbortError'
                    )
                      return;
                    throw caught;
                  }
                  return;
                }
                downloadBlob(next.pdf, next.pdf.name);
                window.open(
                  ficha.supplierWhatsapp || 'https://wa.me/',
                  '_blank',
                  'noopener,noreferrer',
                );
              })
            }
          >
            <MessageCircle size={16} />
            {busy === 'share' ? 'Generando…' : 'WhatsApp'}
          </button>
        </div>
      </div>
      {error ? <p className="hint ficha-error">{error}</p> : null}
      <p className="hint">
        El PDF incluye la descripción, las muestras de color, las iniciales y el
        logo o bordado adjunto. En el celular, WhatsApp abre un mensaje nuevo
        solo con el PDF; en la computadora se descarga para adjuntarlo vos.
      </p>
      <div className="ficha-preview">
        <FichaSheet ficha={ficha} />
      </div>
    </div>
  );
}

export type CotizacionLine = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount: number;
  photo?: string;
  detail: FichaProductDetail;
};

export type CotizacionData = {
  number: string;
  date: string;
  customerName: string;
  currency: string;
  units: number;
  total: number;
  notes: string;
  lines: CotizacionLine[];
};

export type QuoteLang = 'es' | 'en';
export type QuoteCarrier = 'DHL' | 'FedEx';

export type CotizacionOptions = {
  lang: QuoteLang;
  shipping: null | { carrier: QuoteCarrier; amount: number };
};

const QUOTE_COPY = {
  es: {
    kicker: 'Cotización para el cliente',
    number: (n: string) => `Nro: ${n}`,
    noCustomer: 'Sin cliente',
    products: 'Productos',
    units: (n: number) => (n === 1 ? '1 ud.' : `${n} uds.`),
    unitsLabel: 'Cantidad',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    totals: 'Totales',
    total: 'Total',
    notes: 'Notas',
    empty: 'Sin productos.',
    description: 'Descripción',
    specs: 'Especificaciones',
    colors: 'Colores',
    initials: 'Iniciales',
    placePrefix: 'Ubicación',
    discount: (value: string) => `${value}% dto.`,
    footer:
      'No se consideran impuestos de importación y tasas aduaneras.',
    back: '← Volver al pedido',
    heading: 'Ficha cotización',
    downloadPdf: 'Descargar PDF',
    downloadImage: 'Descargar imagen',
    generating: 'Generando…',
    share: 'WhatsApp',
    hint: 'El PDF incluye productos con diseño, especificaciones, colores, iniciales y logos, más precios y envío. En el celular, WhatsApp abre un mensaje nuevo solo con el PDF; en la computadora se descarga para adjuntarlo vos.',
    langLabel: 'Idioma',
    shippingToggle: 'Incluir cargos de envío',
    carrierLabel: 'Carrier',
    shippingCostLabel: 'Costo del envío',
    error: 'No se pudo generar la cotización.',
  },
  en: {
    kicker: 'Customer quotation',
    number: (n: string) => `No.: ${n}`,
    noCustomer: 'No customer',
    products: 'Products',
    units: (n: number) => (n === 1 ? '1 pc.' : `${n} pcs.`),
    unitsLabel: 'Quantity',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    totals: 'Totals',
    total: 'Total',
    notes: 'Notes',
    empty: 'No products.',
    description: 'Description',
    specs: 'Specifications',
    colors: 'Colors',
    initials: 'Initials',
    placePrefix: 'Placement',
    discount: (value: string) => `${value}% off`,
    footer: 'Import taxes and customs fees are not included.',
    back: '← Back to order',
    heading: 'Quotation sheet',
    downloadPdf: 'Download PDF',
    downloadImage: 'Download image',
    generating: 'Generating…',
    share: 'WhatsApp',
    hint: 'The PDF includes products with design, specifications, colors, initials and logos, plus prices and shipping. On mobile, WhatsApp opens a new message with only the PDF; on desktop it downloads so you can attach it.',
    langLabel: 'Language',
    shippingToggle: 'Include shipping charges',
    carrierLabel: 'Carrier',
    shippingCostLabel: 'Shipping cost',
    error: 'Could not generate the quotation.',
  },
} as const;

function quoteDateLabel(iso: string, lang: QuoteLang) {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso || (lang === 'en' ? 'No date' : 'Sin fecha');
  return lang === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

function quoteGrandTotal(quote: CotizacionData, options: CotizacionOptions) {
  return quote.total + (options.shipping?.amount || 0);
}

function discountLabel(discount: number, lang: QuoteLang) {
  const value = (discount / 100).toLocaleString(
    lang === 'en' ? 'en-US' : 'es-AR',
  );
  return QUOTE_COPY[lang].discount(value);
}

export function buildCotizacionData({
  order,
  customerName,
  lines,
}: {
  order: Order;
  customerName: string;
  lines: CotizacionLine[];
}): CotizacionData {
  return {
    number: order.number,
    date: order.date,
    customerName,
    currency: order.currency || 'USD',
    units: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: order.total,
    notes: order.notes.trim(),
    lines,
  };
}

function cotizacionFileName(
  quote: CotizacionData,
  lang: QuoteLang,
  ext: 'pdf' | 'png',
) {
  const prefix = lang === 'en' ? 'quote' : 'cotizacion';
  const raw = `${prefix}-${quote.number}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .toLowerCase();
  return `${raw || prefix}.${ext}`;
}

function CotizacionSheet({
  quote,
  options,
}: {
  quote: CotizacionData;
  options: CotizacionOptions;
}) {
  const copy = QUOTE_COPY[options.lang];
  const money = (cents: number) => formatMoney(cents, quote.currency);
  const dateLabel = quoteDateLabel(quote.date, options.lang);
  const grand = quoteGrandTotal(quote, options);
  const shipping = options.shipping;
  return (
    <article className="ficha-sheet">
      <header className="ficha-head">
        <img src="/logo-iconic.png" alt="Iconic" width={64} height={72} />
        <div>
          <p>{copy.kicker}</p>
          <h1>{quote.customerName || copy.noCustomer}</h1>
          <small>
            {copy.number(quote.number)} · {dateLabel}
          </small>
        </div>
      </header>
      <dl className="ficha-meta">
        <div>
          <dt>{copy.unitsLabel}</dt>
          <dd>{copy.units(quote.units)}</dd>
        </div>
        <div>
          <dt>{copy.total}</dt>
          <dd>{money(grand)}</dd>
        </div>
      </dl>
      <section className="ficha-block">
        <h2>{copy.products}</h2>
        {quote.lines.length ? (
          <div className="cotizacion-products">
            {quote.lines.map((line) => (
              <article className="cotizacion-product" key={line.id}>
                <div className="cotizacion-product-head">
                  <div className="cotizacion-line-main">
                    <div className="stock-item-photo cotizacion-line-photo-wrap">
                      <ProductPhoto
                        name={line.detail.productTitle || line.title}
                        url={line.photo || line.detail.photo}
                      />
                      <span className="stock-item-qty">{line.quantity}</span>
                    </div>
                    <div>
                      <p className="cotizacion-line-title">
                        {line.detail.productTitle ||
                          line.title.split('\n')[0]}
                        {line.discount > 0 ? (
                          <span className="discount-badge">
                            {discountLabel(line.discount, options.lang)}
                          </span>
                        ) : null}
                      </p>
                      <p className="cotizacion-line-meta">
                        {money(line.unitPrice)}
                        {line.quantity > 1 ? ` × ${line.quantity}` : ''}
                      </p>
                    </div>
                  </div>
                  <strong className="cotizacion-line-total">
                    {money(line.total)}
                  </strong>
                </div>
                <FichaDetailSections
                  detail={line.detail}
                  labels={{
                    description: copy.description,
                    specs: copy.specs,
                    colors: copy.colors,
                    initials: copy.initials,
                    placePrefix: copy.placePrefix,
                  }}
                  artworkTitle={(kind) =>
                    fichaArtworkTitle(kind, options.lang)
                  }
                />
              </article>
            ))}
          </div>
        ) : (
          <p className="ficha-description">{copy.empty}</p>
        )}
      </section>
      <section className="ficha-block">
        <h2>{copy.totals}</h2>
        <ul className="ficha-specs">
          {shipping ? (
            <>
              <li>
                <span>{copy.subtotal}</span>
                <b>{money(quote.total)}</b>
              </li>
              <li>
                <span>
                  {copy.shipping} · {shipping.carrier}
                </span>
                <b>{money(shipping.amount)}</b>
              </li>
            </>
          ) : null}
          <li>
            <span>{copy.total}</span>
            <b>{money(grand)}</b>
          </li>
        </ul>
      </section>
      {quote.notes ? (
        <section className="ficha-block">
          <h2>{copy.notes}</h2>
          <p className="ficha-description">{quote.notes}</p>
        </section>
      ) : null}
      <p className="cotizacion-footer">{copy.footer}</p>
    </article>
  );
}

async function renderCotizacionCanvas(
  quote: CotizacionData,
  options: CotizacionOptions,
) {
  const copy = QUOTE_COPY[options.lang];
  const pageW = 794;
  const pad = 36;
  const contentW = pageW - pad * 2;
  const scale = 2;
  const money = (cents: number) => formatMoney(cents, quote.currency);
  const dateLabel = quoteDateLabel(quote.date, options.lang);
  const grand = quoteGrandTotal(quote, options);
  const shipping = options.shipping;
  const maxH = 20000;
  const imageJobs: Promise<HTMLImageElement | null>[] = [
    loadImage('/logo-iconic.png'),
  ];
  for (const line of quote.lines) {
    const thumb = line.photo || line.detail.photo;
    imageJobs.push(thumb ? loadImage(thumb) : Promise.resolve(null));
    imageJobs.push(
      line.detail.photo && line.detail.photo !== thumb
        ? loadImage(line.detail.photo)
        : Promise.resolve(null),
    );
    imageJobs.push(
      line.detail.initials?.surfacePhoto
        ? loadImage(line.detail.initials.surfacePhoto)
        : Promise.resolve(null),
    );
    for (const piece of line.detail.artwork) {
      imageJobs.push(loadImage(piece.url));
    }
  }
  const loaded = await Promise.all(imageJobs);
  const brand = loaded[0] || null;
  let cursor = 1;
  const lineAssets = quote.lines.map((line) => {
    const thumb = loaded[cursor++] || null;
    const design = loaded[cursor++] || null;
    const leather = loaded[cursor++] || null;
    const artwork = line.detail.artwork.map(() => loaded[cursor++] || null);
    return { thumb, design, leather, artwork };
  });

  const canvas = document.createElement('canvas');
  canvas.width = pageW * scale;
  canvas.height = maxH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(copy.error);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageW, maxH);
  let y = pad;

  if (brand) {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.roundRect(pad, y, 54, 60, 10);
    ctx.fill();
    ctx.drawImage(brand, pad + 8, y + 8, 38, 44);
  }
  ctx.fillStyle = '#5e7268';
  ctx.font = '650 11px system-ui, sans-serif';
  ctx.fillText(copy.kicker.toUpperCase(), pad + 62, y + 14);
  ctx.fillStyle = '#17292b';
  ctx.font = '700 26px system-ui, sans-serif';
  const title = quote.customerName || copy.noCustomer;
  ctx.fillText(title, pad + 62, y + 40);
  ctx.fillStyle = '#5e7268';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText(
    `${copy.number(quote.number)}  ·  ${dateLabel}`,
    pad + 62,
    y + 58,
  );
  y += 78;
  ctx.strokeStyle = '#134c45';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(pageW - pad, y);
  ctx.stroke();
  y += 18;

  const meta: [string, string][] = [
    [copy.unitsLabel, copy.units(quote.units)],
    [copy.total, money(grand)],
  ];
  meta.forEach((row, index) => {
    const col = index % 2;
    const rowY = y + Math.floor(index / 2) * 42;
    const x = pad + col * (contentW / 2);
    ctx.fillStyle = '#6d7f72';
    ctx.font = '650 10px system-ui, sans-serif';
    ctx.fillText(row[0].toUpperCase(), x, rowY);
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(row[1], x, rowY + 18);
  });
  y += Math.ceil(meta.length / 2) * 42 + 10;

  const heading = (label: string) => {
    ctx.fillStyle = '#134c45';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText(label.toUpperCase(), pad, y);
    y += 18;
  };

  heading(copy.products);
  if (!quote.lines.length) {
    ctx.fillStyle = '#17292b';
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillText(copy.empty, pad, y);
    y += 28;
  }
  for (let i = 0; i < quote.lines.length; i++) {
    const line = quote.lines[i]!;
    const assets = lineAssets[i]!;
    const detail = line.detail;
    const startY = y;
    const thumb = 64;
    ctx.fillStyle = '#eef1eb';
    ctx.beginPath();
    ctx.roundRect(pad, y, thumb, thumb, 7);
    ctx.fill();
    if (assets.thumb) {
      const size = fitImage(assets.thumb, thumb, thumb);
      const ox = pad + Math.round((thumb - size.width) / 2);
      const oy = y + Math.round((thumb - size.height) / 2);
      ctx.drawImage(assets.thumb, ox, oy, size.width, size.height);
    }
    const badge = String(line.quantity);
    ctx.font = '650 11px system-ui, sans-serif';
    const badgeW = Math.max(22, ctx.measureText(badge).width + 12);
    const badgeH = 22;
    const badgeX = pad + thumb - badgeW / 2 - 2;
    const badgeY = y - 7;
    ctx.fillStyle = '#134c45';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 999);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badge, badgeX + badgeW / 2, badgeY + 15);
    ctx.textAlign = 'left';

    const textX = pad + thumb + 16;
    const textW = contentW - thumb - 16 - 110;
    const productTitle = detail.productTitle || line.title.split('\n')[0] || '';
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    let textY = y + 14;
    for (const part of wrapText(ctx, productTitle, textW)) {
      ctx.fillText(part, textX, textY);
      textY += 18;
    }
    if (line.discount > 0) {
      ctx.fillStyle = '#7a6a52';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(discountLabel(line.discount, options.lang), textX, textY);
      textY += 16;
    }
    ctx.fillStyle = '#6d7f72';
    ctx.font = '400 12px system-ui, sans-serif';
    ctx.fillText(
      `${money(line.unitPrice)}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`,
      textX,
      textY,
    );
    ctx.fillStyle = '#17292b';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(money(line.total), pageW - pad, y + 16);
    ctx.textAlign = 'left';
    y = Math.max(startY + thumb, textY + 8) + 12;

    if (detail.description) {
      heading(copy.description);
      ctx.fillStyle = '#17292b';
      ctx.font = '400 14px system-ui, sans-serif';
      for (const part of wrapText(ctx, detail.description, contentW)) {
        ctx.fillText(part, pad, y);
        y += 20;
      }
      y += 8;
    }

    const designImage = assets.design || (detail.photo ? assets.thumb : null);
    if (designImage && detail.photo) {
      heading(detail.photoLabel || copy.description);
      const size = fitImage(designImage, contentW, 220);
      ctx.fillStyle = '#f4f6f4';
      ctx.fillRect(pad, y, size.width, size.height);
      ctx.drawImage(designImage, pad, y, size.width, size.height);
      y += size.height + 16;
    }

    if (detail.labels.length) {
      heading(copy.specs);
      for (const row of detail.labels) {
        ctx.fillStyle = '#f7faf6';
        ctx.fillRect(pad, y - 12, contentW, 26);
        ctx.fillStyle = '#6d7f72';
        ctx.font = '400 12px system-ui, sans-serif';
        ctx.fillText(row.label, pad + 10, y);
        ctx.fillStyle = '#17292b';
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(row.value, pad + 210, y);
        y += 26;
      }
      y += 10;
    }

    if (detail.swatches.length) {
      heading(copy.colors);
      detail.swatches.forEach((swatch, index) => {
        const col = index % 2;
        const rowY = y + Math.floor(index / 2) * 48;
        const x = pad + col * (contentW / 2);
        ctx.beginPath();
        ctx.roundRect(x, rowY - 18, 34, 34, 8);
        ctx.fillStyle = swatch.hex;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#6d7f72';
        ctx.font = '400 11px system-ui, sans-serif';
        ctx.fillText(swatch.label, x + 44, rowY - 4);
        ctx.fillStyle = '#17292b';
        ctx.font = '600 14px system-ui, sans-serif';
        ctx.fillText(swatch.name, x + 44, rowY + 14);
      });
      y += Math.ceil(detail.swatches.length / 2) * 48 + 8;
    }

    if (detail.initials) {
      heading(copy.initials);
      const boxH = 150;
      ctx.fillStyle = detail.initials.surfaceHex || '#1c1612';
      ctx.beginPath();
      ctx.roundRect(pad, y, contentW, boxH, 10);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pad, y, contentW, boxH, 10);
      ctx.clip();
      if (assets.leather)
        ctx.drawImage(assets.leather, pad, y, contentW, boxH);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(pad, y, contentW, boxH);
      ctx.fillStyle = detail.initials.hex;
      ctx.font = `500 52px ${detail.initials.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(detail.initials.text, pad + contentW / 2, y + boxH / 2);
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      y += boxH + 18;
      ctx.fillStyle = '#5e7268';
      ctx.font = '400 13px system-ui, sans-serif';
      ctx.fillText(
        [
          detail.initials.fontName,
          detail.initials.colorName,
          detail.initials.size,
          detail.initials.place
            ? `${copy.placePrefix}: ${detail.initials.place}`
            : '',
        ]
          .filter(Boolean)
          .join(' · '),
        pad,
        y,
      );
      y += 18;
    }

    detail.artwork.forEach((piece, index) => {
      heading(fichaArtworkTitle(piece.kind, options.lang));
      const image = assets.artwork[index];
      if (image) {
        const size = fitImage(image, contentW, 200);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d7e0db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pad, y, size.width + 24, size.height + 24, 10);
        ctx.fill();
        ctx.stroke();
        ctx.drawImage(image, pad + 12, y + 12, size.width, size.height);
        y += size.height + 36;
      }
      ctx.fillStyle = '#5e7268';
      ctx.font = '400 13px system-ui, sans-serif';
      ctx.fillText(piece.caption, pad, y);
      y += 20;
    });

    y += 12;
    ctx.strokeStyle = '#e6ece3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pageW - pad, y);
    ctx.stroke();
    y += 20;
  }

  heading(copy.totals);
  const totalRows: [string, string][] = [];
  if (shipping) {
    totalRows.push([copy.subtotal, money(quote.total)]);
    totalRows.push([
      `${copy.shipping} · ${shipping.carrier}`,
      money(shipping.amount),
    ]);
  }
  totalRows.push([copy.total, money(grand)]);
  for (const [label, value] of totalRows) {
    ctx.fillStyle = '#6d7f72';
    ctx.font = '400 13px system-ui, sans-serif';
    ctx.fillText(label, pad, y);
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, pageW - pad, y);
    ctx.textAlign = 'left';
    y += 24;
  }
  y += 8;

  if (quote.notes) {
    heading(copy.notes);
    ctx.fillStyle = '#17292b';
    ctx.font = '400 14px system-ui, sans-serif';
    for (const part of wrapText(ctx, quote.notes, contentW)) {
      ctx.fillText(part, pad, y);
      y += 20;
    }
    y += 8;
  }

  y += 8;
  ctx.strokeStyle = '#e6ece3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(pageW - pad, y);
  ctx.stroke();
  y += 18;
  ctx.fillStyle = '#5e7268';
  ctx.font = '400 12px system-ui, sans-serif';
  for (const part of wrapText(ctx, copy.footer, contentW)) {
    ctx.fillText(part, pad, y);
    y += 18;
  }
  y += 8;

  const used = Math.min(maxH - 20, Math.ceil(y + pad));
  const output = document.createElement('canvas');
  output.width = pageW * scale;
  output.height = used * scale;
  const out = output.getContext('2d');
  if (!out) throw new Error(copy.error);
  out.drawImage(canvas, 0, 0);
  const jpegBlob = await canvasToBlob(output, 'image/jpeg', 0.92);
  const pngBlob = await canvasToBlob(output, 'image/png');
  return {
    jpeg: await blobToBytes(jpegBlob),
    png: await blobToBytes(pngBlob),
    width: output.width,
    height: output.height,
  };
}

export function CotizacionFichaView({
  quote,
  linesForLang,
  shippingCarrier = '',
  shippingAmount = 0,
  onShippingChange,
  onBack,
}: {
  quote: CotizacionData;
  linesForLang?: (lang: QuoteLang) => CotizacionLine[];
  shippingCarrier?: '' | QuoteCarrier;
  shippingAmount?: number;
  onShippingChange?: (body: {
    shipping_carrier: string;
    shipping_amount: number;
  }) => Promise<void>;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [lang, setLang] = useState<QuoteLang>('es');
  const [includeShipping, setIncludeShipping] = useState(!!shippingCarrier);
  const [carrier, setCarrier] = useState<QuoteCarrier>(
    shippingCarrier === 'FedEx' ? 'FedEx' : 'DHL',
  );
  const [shippingCost, setShippingCost] = useState(
    decimal(shippingAmount || 0),
  );
  const copy = QUOTE_COPY[lang];
  const displayQuote: CotizacionData = {
    ...quote,
    lines: linesForLang ? linesForLang(lang) : quote.lines,
  };

  const options: CotizacionOptions = {
    lang,
    shipping: (() => {
      if (!includeShipping) return null;
      try {
        const amount = shippingCost.trim()
          ? parseDecimal(shippingCost)
          : 0;
        return { carrier, amount };
      } catch {
        return { carrier, amount: 0 };
      }
    })(),
  };

  async function persistShipping(next: {
    include: boolean;
    carrier: QuoteCarrier;
    cost: string;
  }) {
    if (!onShippingChange) return;
    if (!next.include) {
      await onShippingChange({ shipping_carrier: '', shipping_amount: 0 });
      return;
    }
    let amount = 0;
    try {
      amount = next.cost.trim() ? parseDecimal(next.cost) : 0;
    } catch {
      amount = 0;
    }
    await onShippingChange({
      shipping_carrier: next.carrier,
      shipping_amount: amount,
    });
  }

  async function files() {
    if (includeShipping && shippingCost.trim()) {
      try {
        parseDecimal(shippingCost);
      } catch (caught) {
        throw caught instanceof Error
          ? caught
          : new Error(copy.shippingCostLabel);
      }
    }
    const captured = await renderCotizacionCanvas(displayQuote, options);
    const pdf = jpegToPdf(captured.jpeg, captured.width, captured.height);
    return {
      pdf: new File(
        [new Uint8Array(pdf)],
        cotizacionFileName(displayQuote, lang, 'pdf'),
        { type: 'application/pdf' },
      ),
      image: new File(
        [new Uint8Array(captured.png)],
        cotizacionFileName(displayQuote, lang, 'png'),
        { type: 'image/png' },
      ),
    };
  }

  async function run(label: string, work: () => Promise<void>) {
    setError('');
    setBusy(label);
    try {
      await work();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : copy.error,
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="ficha-view">
      <button type="button" className="dialog-kicker" onClick={onBack}>
        {copy.back}
      </button>
      <div className="ficha-toolbar">
        <h3>{copy.heading}</h3>
        <div className="ficha-actions">
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() =>
              void run('pdf', async () => {
                const next = await files();
                downloadBlob(next.pdf, next.pdf.name);
              })
            }
          >
            <FileDown size={16} />
            {busy === 'pdf' ? copy.generating : copy.downloadPdf}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() =>
              void run('image', async () => {
                const next = await files();
                downloadBlob(next.image, next.image.name);
              })
            }
          >
            <ImageIcon size={16} />
            {busy === 'image' ? copy.generating : copy.downloadImage}
          </button>
          <button
            type="button"
            className="primary"
            disabled={!!busy}
            onClick={() =>
              void run('share', async () => {
                const next = await files();
                if (canShareFiles(next.pdf)) {
                  try {
                    await navigator.share({
                      files: [next.pdf],
                    });
                  } catch (caught) {
                    if (
                      caught instanceof DOMException &&
                      caught.name === 'AbortError'
                    )
                      return;
                    throw caught;
                  }
                  return;
                }
                downloadBlob(next.pdf, next.pdf.name);
                window.open('https://wa.me/', '_blank', 'noopener,noreferrer');
              })
            }
          >
            <MessageCircle size={16} />
            {busy === 'share' ? copy.generating : copy.share}
          </button>
        </div>
      </div>
      <div className="cotizacion-options form-grid">
        <Field label={copy.langLabel}>
          <Pick
            label={copy.langLabel}
            value={lang}
            onChange={(value) => setLang(value === 'en' ? 'en' : 'es')}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
          />
        </Field>
        <div className="field cotizacion-shipping-toggle">
          <Check
            label={copy.shippingToggle}
            checked={includeShipping}
            onChange={(checked) => {
              const cost = checked
                ? shippingCost || decimal(0)
                : shippingCost;
              setIncludeShipping(checked);
              if (checked && !shippingCost) setShippingCost(decimal(0));
              void run('shipping', () =>
                persistShipping({
                  include: checked,
                  carrier,
                  cost,
                }),
              );
            }}
          />
        </div>
        {includeShipping ? (
          <>
            <Field label={copy.carrierLabel}>
              <Pick
                label={copy.carrierLabel}
                value={carrier}
                onChange={(value) => {
                  const next = value === 'FedEx' ? 'FedEx' : 'DHL';
                  setCarrier(next);
                  void run('shipping', () =>
                    persistShipping({
                      include: true,
                      carrier: next,
                      cost: shippingCost,
                    }),
                  );
                }}
                options={[
                  { value: 'DHL', label: 'DHL' },
                  { value: 'FedEx', label: 'FedEx' },
                ]}
              />
            </Field>
            <Field label={copy.shippingCostLabel}>
              <input
                inputMode="decimal"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                onBlur={() =>
                  void run('shipping', () =>
                    persistShipping({
                      include: true,
                      carrier,
                      cost: shippingCost,
                    }),
                  )
                }
                placeholder="0.00"
              />
            </Field>
          </>
        ) : null}
      </div>
      {error ? <p className="hint ficha-error">{error}</p> : null}
      <p className="hint">{copy.hint}</p>
      <div className="ficha-preview">
        <CotizacionSheet quote={displayQuote} options={options} />
      </div>
    </div>
  );
}
