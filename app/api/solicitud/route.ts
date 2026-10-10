/**
 * Trae una solicitud del sitio iconicpolo.com y la devuelve traducida al
 * modelo del CRM, para precargar el formulario de pedido nuevo.
 *
 * No guarda ningún pedido. El botón del mail es un GET, y los GET de un correo
 * los dispara cualquier proxy de imágenes o antivirus sin que nadie haga clic:
 * si acá se creara el pedido, aparecerían pedidos fantasma. Lo único que se
 * guarda son las imágenes del diseño, porque la configuración del CRM referencia
 * rutas de R2 y no archivos.
 */

import { env } from 'cloudflare:workers';
import { files } from '@/db';
import { readUser, unauthorized } from '@/lib/auth';
import { stmt } from '@/lib/server';
import { TEMPLATE_IDS } from '@/lib/configure';
import {
  mapearCasco,
  notasDeCliente,
  notasDeSolicitud,
  printDelCatalogo,
  type OrderPrefill,
  type SolicitudSitio,
} from '@/lib/solicitud';

const ID_SOLICITUD = /^[A-Za-z0-9_-]{32}$/;
const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/;
const MAX_IMAGEN = 5 * 1024 * 1024;

function bytesDeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const m = DATA_URL.exec(dataUrl);
  if (!m) return null;
  let binario: string;
  try {
    binario = atob(m[2]);
  } catch {
    return null;
  }
  if (!binario.length || binario.length > MAX_IMAGEN) return null;
  const bytes = Uint8Array.from(binario, (ch) => ch.charCodeAt(0));
  // El tipo se saca de los bytes, no de lo que dice el data URL.
  const real =
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? 'image/jpeg'
      : bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
        ? 'image/png'
        : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
            String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
          ? 'image/webp'
          : null;
  if (!real || real !== m[1]) return null;
  return { bytes, mime: real };
}

/** Guarda una imagen del sitio en R2 y devuelve su ruta, o '' si no se pudo. */
async function guardarImagen(dataUrl: string, nombre: string): Promise<string> {
  const datos = bytesDeDataUrl(dataUrl);
  if (!datos) return '';
  const id = crypto.randomUUID();
  try {
    await files().put(id, datos.bytes, {
      httpMetadata: { contentType: datos.mime },
    });
    await stmt(
      'INSERT INTO images(id,name,mime,size,created_at) VALUES(?,?,?,?,?)',
      id,
      nombre.slice(0, 200),
      datos.mime,
      datos.bytes.byteLength,
      new Date().toISOString(),
    ).run();
    return `/api/images/${id}`;
  } catch (error) {
    console.error('[Solicitud] No se pudo guardar una imagen', error);
    try {
      await files().delete(id);
    } catch {
      /* la imagen huérfana en R2 no justifica fallar la precarga */
    }
    return '';
  }
}

export async function GET(request: Request) {
  const user = await readUser(request);
  if (!user) return unauthorized();

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ID_SOLICITUD.test(id))
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 });

  const origen = (env.ICONIC_SITE_ORIGIN || 'https://www.iconicpolo.com').replace(/\/+$/, '');
  const clave = (env.CRM_SHARED_KEY || '').trim();
  if (!clave)
    return Response.json(
      { error: 'Falta configurar la conexión con el sitio (CRM_SHARED_KEY).' },
      { status: 503 },
    );

  // Cada motivo de falla dice qué pasó y qué hacer: un "no se pudo" sin causa
  // obliga a ir a los logs del Worker para saber si es la clave, la red o el id.
  const destino = `${origen}/api/solicitud/${id}`;
  let solicitud: SolicitudSitio;
  try {
    const respuesta = await fetch(destino, {
      headers: { 'X-Iconic-Crm-Key': clave },
    });
    if (respuesta.status === 404)
      return Response.json(
        { error: 'Esa solicitud ya no está disponible. Las solicitudes vencen a los 90 días.' },
        { status: 404 },
      );
    if (respuesta.status === 401) {
      // La misma huella que registra el sitio: si coinciden, el problema no es
      // la clave sino algo en el camino.
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(clave),
      );
      const marca = Array.from(new Uint8Array(digest).slice(0, 5))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      console.error(`[Solicitud] el sitio rechazó la clave · la que mandé: ${marca}`);
    }
    if (respuesta.status === 401)
      return Response.json(
        {
          error:
            'El sitio rechazó la clave compartida. El secreto CRM_SHARED_KEY tiene que tener el mismo valor en el Worker del CRM y en el del sitio.',
        },
        { status: 502 },
      );
    if (!respuesta.ok) {
      console.error(`[Solicitud] ${destino} respondió ${respuesta.status}`);
      return Response.json(
        { error: `El sitio respondió ${respuesta.status} al pedir la solicitud.` },
        { status: 502 },
      );
    }
    const cuerpo = (await respuesta.json()) as { ok?: boolean; solicitud?: SolicitudSitio };
    if (!cuerpo.ok || !cuerpo.solicitud) {
      console.error('[Solicitud] respuesta inesperada del sitio', cuerpo);
      return Response.json(
        { error: 'El sitio contestó algo que no se entiende. Revisá los logs del Worker.' },
        { status: 502 },
      );
    }
    solicitud = cuerpo.solicitud;
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    console.error(`[Solicitud] no se pudo llegar a ${destino}`, error);
    return Response.json(
      { error: `No se pudo llegar al sitio (${origen}): ${detalle}` },
      { status: 502 },
    );
  }

  const avisos: string[] = [];
  const items: OrderPrefill['items'] = [];
  for (const item of solicitud.items) {
    if (!item.diseno) continue;
    const imagenes: string[] = [];
    for (const imagen of item.imagenes) {
      const ruta = await guardarImagen(imagen.dataUrl, imagen.label || 'diseño');
      if (ruta) imagenes.push(ruta);
    }
    if (imagenes.length < item.imagenes.length)
      avisos.push('Alguna captura del diseño no se pudo cargar: está en el mail.');
    const logo = item.diseno.logoDataUrl
      ? await guardarImagen(item.diseno.logoDataUrl, 'logo del club')
      : '';
    // Un print del catálogo ya está en public/prints: subirlo duplicaría el archivo.
    const print =
      item.diseno.material === 'Print' &&
      item.diseno.printDataUrl &&
      !printDelCatalogo(item.diseno)
        ? await guardarImagen(item.diseno.printDataUrl, 'print del casco')
        : '';
    const mapeado = mapearCasco(item.diseno, imagenes, logo, print);
    avisos.push(...mapeado.avisos);
    items.push({ product_id: TEMPLATE_IDS.cascos, config: mapeado.config });
  }

  if (!items.length)
    return Response.json(
      { error: 'Esa solicitud no trae ningún casco configurado.' },
      { status: 400 },
    );

  // Cliente que ya exista con ese email: se reusa en lugar de duplicarlo.
  const fila = await stmt(
    "SELECT id FROM contacts WHERE kind='customer' AND archived=0 AND lower(email)=? LIMIT 1",
    solicitud.cliente.email.toLowerCase(),
  ).first<{ id: string }>();

  const prefill: OrderPrefill = {
    solicitud_id: id,
    customer_id: fila?.id || '',
    customer: {
      name: solicitud.cliente.name,
      phone: solicitud.cliente.phone,
      email: solicitud.cliente.email,
      // El sitio no pide dirección.
      address: '',
      notes: notasDeCliente(solicitud.cliente),
    },
    notes: notasDeSolicitud(solicitud, id, avisos),
    items,
    avisos,
  };
  return Response.json(prefill, { headers: { 'Cache-Control': 'no-store' } });
}
