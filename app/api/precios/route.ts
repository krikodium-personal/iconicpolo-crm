/**
 * Precios de los productos configurables, para el configurador del sitio.
 *
 * El CRM es la fuente de verdad del precio: se carga una vez acá y el sitio lo
 * muestra. Devuelve **sólo el precio de lista**; el costo y el precio Friends &
 * Family no salen nunca de acá, aunque estén en el mismo registro.
 *
 * Pide el mismo secreto compartido que `/api/solicitud`: el sitio lo consulta
 * de servidor a servidor y nunca expone esta ruta al navegador del cliente.
 */

import { env } from 'cloudflare:workers';
import { stmt } from '@/lib/server';
import {
  configuredKindOf,
  parsePricing,
  type ConfiguredKind,
} from '@/lib/configure';

export type PreciosConfigurable = {
  /** Precio de lista base, en centavos. */
  base: number;
  /** Recargo por opción elegida, en centavos. Clave = id de `selectedPriceKeys`. */
  extras: Record<string, number>;
};

export type RespuestaPrecios = {
  moneda: string;
  /** Cuándo se leyó, para que el sitio sepa qué tan fresco es lo que cachea. */
  leido: string;
  productos: Partial<Record<ConfiguredKind, PreciosConfigurable>>;
};

function mismoSecreto(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET(request: Request) {
  const esperada = (env.CRM_SHARED_KEY || '').trim();
  if (!esperada)
    return Response.json(
      { error: 'Falta configurar CRM_SHARED_KEY.' },
      { status: 503 },
    );
  const clave = (request.headers.get('X-Iconic-Crm-Key') || '').trim();
  if (!mismoSecreto(clave, esperada))
    return Response.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    const ajustes = await stmt('SELECT currency FROM settings LIMIT 1').first<{
      currency: string;
    }>();
    const filas = (
      await stmt(
        "SELECT id, category, kind, price, pricing, attributes FROM products WHERE kind='configured' AND archived=0",
      ).all()
    ).results;

    const productos: RespuestaPrecios['productos'] = {};
    for (const fila of filas) {
      const producto = fila as unknown as {
        category: string;
        kind: string;
        price: number;
        pricing: string;
        attributes: string;
      };
      const tipo = configuredKindOf(producto);
      if (!tipo) continue;
      // Un producto sin precio de lista definido no se publica a medias: se
      // omite, y el sitio muestra ese configurador sin precio.
      const atributos = JSON.parse(producto.attributes || '{}') as Record<string, string>;
      if (atributos['Precio de lista'] === 'Pendiente de definir') continue;

      const pricing = parsePricing(JSON.parse(producto.pricing || '{}'));
      const extras: Record<string, number> = {};
      for (const [id, punto] of Object.entries(pricing.extras)) {
        // Sólo el precio. El costo se queda en el CRM.
        extras[id] = punto.price;
      }
      productos[tipo] = { base: producto.price, extras };
    }

    return Response.json(
      {
        moneda: ajustes?.currency || 'USD',
        leido: new Date().toISOString(),
        productos,
      } satisfies RespuestaPrecios,
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[Precios] no se pudieron leer', error);
    return Response.json(
      { error: 'No se pudieron leer los precios.' },
      { status: 503 },
    );
  }
}
