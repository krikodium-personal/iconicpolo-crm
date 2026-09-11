import { allData, mutate, obj } from '@/lib/server';
import { seed } from '@/lib/seed';
export async function GET() {
  try {
    return Response.json(await allData(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'No se pudieron cargar los datos. Intentá nuevamente.' },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 200000)
    return Response.json(
      { error: 'Solicitud demasiado grande.' },
      { status: 413 },
    );
  try {
    const text = await request.text();
    if (text.length > 200000) throw new Error('Solicitud demasiado grande.');
    const body = obj(JSON.parse(text));
    const result =
      body.action === 'initialize'
        ? await seed(body.demo === true)
        : await mutate(body);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo guardar.';
    const known = message.includes('UNIQUE constraint')
      ? 'El SKU o número ya existe.'
      : message.includes('STOCK_NEGATIVE')
        ? 'Stock insuficiente. Registrá un ingreso antes de cerrar.'
        : message.includes('STALE_VERSION')
          ? 'Otro cambio actualizó este registro. Recargá antes de editar.'
          : message.includes('FOREIGN KEY')
            ? 'El registro está relacionado con otros datos.'
            : message.includes('D1_')
              ? 'No se pudo guardar. Revisá los datos e intentá nuevamente.'
              : message;
    return Response.json({ error: known }, { status: 400 });
  }
}
