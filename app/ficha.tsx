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
