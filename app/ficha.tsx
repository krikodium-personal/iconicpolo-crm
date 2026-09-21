'use client';
import { useState, type CSSProperties } from 'react';
import { FileDown, ImageIcon, MessageCircle } from 'lucide-react';
import {
  fichaFileName,
  fichaShareText,
  jpegToPdf,
  fichaArtworkTitle,
  type FichaData,
} from '@/lib/ficha';
import { formatMoney } from '@/lib/money';
import type { Order } from '@/lib/types';
import { ProductPhoto } from './ui';

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

export function FichaSheet({ ficha }: { ficha: FichaData }) {
  const initials = ficha.initials;
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
      <section className="ficha-block">
        <h2>Descripción</h2>
        <p className="ficha-description">{ficha.description}</p>
      </section>
      {ficha.photo ? (
        <section className="ficha-block">
          <h2>{ficha.photoLabel || 'Referencia'}</h2>
          <img className="ficha-photo" src={ficha.photo} alt={ficha.productTitle} />
        </section>
      ) : null}
      {ficha.labels.length ? (
        <section className="ficha-block">
          <h2>Especificaciones</h2>
          <ul className="ficha-specs">
            {ficha.labels.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {ficha.swatches.length ? (
        <section className="ficha-block">
          <h2>Colores</h2>
          <ul className="ficha-swatches">
            {ficha.swatches.map((swatch) => (
              <li key={swatch.label}>
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
          <h2>Iniciales</h2>
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
              initials.place ? `Ubicación: ${initials.place}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </section>
      ) : null}
      {ficha.artwork.map((piece) => (
        <section className="ficha-block" key={piece.url}>
          <h2>{fichaArtworkTitle(piece.kind)}</h2>
          <img className="ficha-artwork" src={piece.url} alt={piece.caption} />
          <p className="ficha-initials-meta">{piece.caption}</p>
        </section>
      ))}
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
                const text = fichaShareText(ficha);
                if (canShareFiles(next.pdf)) {
                  try {
                    await navigator.share({
                      files: [next.pdf],
                      title: `Ficha técnica · Pedido ${ficha.orderNumber}`,
                      text,
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
                const target =
                  ficha.supplierWhatsapp ||
                  'https://wa.me/?text=' + encodeURIComponent(text);
                const url = ficha.supplierWhatsapp
                  ? `${ficha.supplierWhatsapp}?text=${encodeURIComponent(text)}`
                  : target;
                window.open(url, '_blank', 'noopener,noreferrer');
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
        logo o bordado adjunto. En el celular, Compartir / WhatsApp adjunta el
        archivo; en la computadora se descarga para enviarlo.
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
};

export type CotizacionData = {
  number: string;
  date: string;
  dateLabel: string;
  customerName: string;
  currency: string;
  units: number;
  total: number;
  notes: string;
  lines: CotizacionLine[];
};

export function buildCotizacionData({
  order,
  customerName,
  lines,
}: {
  order: Order;
  customerName: string;
  lines: CotizacionLine[];
}): CotizacionData {
  const [year, month, day] = order.date.split('-');
  const dateLabel =
    year && month && day ? `${day}/${month}/${year}` : order.date || 'Sin fecha';
  return {
    number: order.number,
    date: order.date,
    dateLabel,
    customerName,
    currency: order.currency || 'USD',
    units: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: order.total,
    notes: order.notes.trim(),
    lines,
  };
}

function cotizacionFileName(quote: CotizacionData, ext: 'pdf' | 'png') {
  const raw = `cotizacion-${quote.number}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .toLowerCase();
  return `${raw || 'cotizacion'}.${ext}`;
}

function cotizacionShareText(quote: CotizacionData) {
  return [
    `Cotización Iconic — Nro: ${quote.number}`,
    quote.customerName ? `Para ${quote.customerName}` : '',
    `Total ${formatMoney(quote.total, quote.currency)}`,
    'Adjunto la cotización.',
  ]
    .filter(Boolean)
    .join('\n');
}

function CotizacionSheet({ quote }: { quote: CotizacionData }) {
  const money = (cents: number) => formatMoney(cents, quote.currency);
  return (
    <article className="ficha-sheet cotizacion-sheet">
      <header className="ficha-head">
        <img src="/logo-iconic.png" alt="Iconic" width={64} height={72} />
        <div>
          <p>Cotización</p>
          <h1>Nro: {quote.number}</h1>
          <small>
            {[
              quote.dateLabel,
              quote.customerName ? `Para ${quote.customerName}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </small>
        </div>
      </header>
      <dl className="ficha-meta">
        <div>
          <dt>Productos</dt>
          <dd>{quote.units === 1 ? '1 ud.' : `${quote.units} uds.`}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{money(quote.total)}</dd>
        </div>
      </dl>
      <section className="ficha-block">
        <h2>Productos</h2>
        {quote.lines.length ? (
          <ul className="cotizacion-lines">
            {quote.lines.map((line) => (
              <li key={line.id}>
                <div className="cotizacion-line-main">
                  <div className="stock-item-photo cotizacion-line-photo-wrap">
                    <ProductPhoto name={line.title} url={line.photo} />
                    <span className="stock-item-qty">{line.quantity}</span>
                  </div>
                  <div>
                    <p className="cotizacion-line-title">
                      {line.title.split('\n').map((part, index) => (
                        <span key={`${line.id}-${index}`}>
                          {index ? <br /> : null}
                          {part}
                        </span>
                      ))}
                      {line.discount > 0 ? (
                        <span className="discount-badge">
                          {`${(line.discount / 100).toLocaleString('es-AR')}% dto.`}
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
              </li>
            ))}
          </ul>
        ) : (
          <p className="ficha-description">Sin productos.</p>
        )}
      </section>
      <dl className="ficha-meta">
        <div>
          <dt>Total</dt>
          <dd>{money(quote.total)}</dd>
        </div>
      </dl>
      {quote.notes ? (
        <section className="ficha-block">
          <h2>Notas</h2>
          <p className="ficha-description">{quote.notes}</p>
        </section>
      ) : null}
    </article>
  );
}

async function renderCotizacionCanvas(quote: CotizacionData) {
  const pageW = 794;
  const pad = 36;
  const contentW = pageW - pad * 2;
  const scale = 2;
  const money = (cents: number) => formatMoney(cents, quote.currency);
  const [brand, ...photos] = await Promise.all([
    loadImage('/logo-iconic.png'),
    ...quote.lines.map((line) =>
      line.photo ? loadImage(line.photo) : Promise.resolve(null),
    ),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = pageW * scale;
  canvas.height = 6400 * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo generar la cotización.');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageW, 6400);
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
  ctx.fillText('COTIZACIÓN', pad + 62, y + 14);
  ctx.fillStyle = '#17292b';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`Nro: ${quote.number}`, pad + 62, y + 40);
  ctx.fillStyle = '#5e7268';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText(
    [quote.dateLabel, quote.customerName ? `Para ${quote.customerName}` : '']
      .filter(Boolean)
      .join('  ·  '),
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
  y += 22;

  const meta = [
    [
      'Productos',
      quote.units === 1 ? '1 ud.' : `${quote.units} uds.`,
    ],
    ['Total', money(quote.total)],
  ];
  meta.forEach((row, index) => {
    const x = pad + index * (contentW / 2);
    ctx.fillStyle = '#6d7f72';
    ctx.font = '650 10px system-ui, sans-serif';
    ctx.fillText(row[0].toUpperCase(), x, y);
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(row[1], x, y + 18);
  });
  y += 48;

  ctx.fillStyle = '#134c45';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('PRODUCTOS', pad, y);
  y += 18;

  for (let i = 0; i < quote.lines.length; i++) {
    const line = quote.lines[i]!;
    const photo = photos[i] || null;
    const startY = y;
    const thumb = 64;
    ctx.fillStyle = '#eef1eb';
    ctx.beginPath();
    ctx.roundRect(pad, y, thumb, thumb, 7);
    ctx.fill();
    if (photo) {
      const size = fitImage(photo, thumb, thumb);
      const ox = pad + Math.round((thumb - size.width) / 2);
      const oy = y + Math.round((thumb - size.height) / 2);
      ctx.drawImage(photo, ox, oy, size.width, size.height);
    } else {
      ctx.fillStyle = '#738873';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('·', pad + thumb / 2, y + thumb / 2 + 4);
      ctx.textAlign = 'left';
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
    ctx.fillStyle = '#17292b';
    ctx.font = '600 14px system-ui, sans-serif';
    let textY = y + 14;
    for (const part of wrapText(ctx, line.title, textW)) {
      ctx.fillText(part, textX, textY);
      textY += 18;
    }
    if (line.discount > 0) {
      ctx.fillStyle = '#7a6a52';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(
        `${(line.discount / 100).toLocaleString('es-AR')}% dto.`,
        textX,
        textY,
      );
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
    const rowBottom = Math.max(startY + thumb, textY + 8);
    y = rowBottom + 16;
    ctx.strokeStyle = '#e6ece3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y - 8);
    ctx.lineTo(pageW - pad, y - 8);
    ctx.stroke();
  }

  y += 8;
  ctx.fillStyle = '#6d7f72';
  ctx.font = '650 10px system-ui, sans-serif';
  ctx.fillText('TOTAL', pad, y);
  ctx.fillStyle = '#17292b';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(money(quote.total), pad, y + 24);
  y += 48;

  if (quote.notes) {
    ctx.fillStyle = '#134c45';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('NOTAS', pad, y);
    y += 18;
    ctx.fillStyle = '#17292b';
    ctx.font = '400 14px system-ui, sans-serif';
    for (const part of wrapText(ctx, quote.notes, contentW)) {
      ctx.fillText(part, pad, y);
      y += 20;
    }
    y += 8;
  }

  const used = Math.min(6380, Math.ceil(y + pad));
  const output = document.createElement('canvas');
  output.width = pageW * scale;
  output.height = used * scale;
  const out = output.getContext('2d');
  if (!out) throw new Error('No se pudo generar la cotización.');
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
  onBack,
}: {
  quote: CotizacionData;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function files() {
    const captured = await renderCotizacionCanvas(quote);
    const pdf = jpegToPdf(captured.jpeg, captured.width, captured.height);
    return {
      pdf: new File([new Uint8Array(pdf)], cotizacionFileName(quote, 'pdf'), {
        type: 'application/pdf',
      }),
      image: new File(
        [new Uint8Array(captured.png)],
        cotizacionFileName(quote, 'png'),
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
          : 'No se pudo generar la cotización.',
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
        <h3>Ficha cotización</h3>
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
                const text = cotizacionShareText(quote);
                if (canShareFiles(next.pdf)) {
                  try {
                    await navigator.share({
                      files: [next.pdf],
                      title: `Cotización · ${quote.number}`,
                      text,
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
                  'https://wa.me/?text=' + encodeURIComponent(text),
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
        Descargá el PDF o compartilo por WhatsApp. En el celular, Compartir
        adjunta el archivo; en la computadora se descarga para enviarlo.
      </p>
      <div className="ficha-preview">
        <CotizacionSheet quote={quote} />
      </div>
    </div>
  );
}
