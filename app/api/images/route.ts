import { files } from '@/db';
import { stmt } from '@/lib/server';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 5_300_000)
    return Response.json({ error: 'Máximo 5 MB por foto.' }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 5_242_880 || !file.size)
      throw new Error('Seleccioná una foto de hasta 5 MB.');
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const mime =
      bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'image/jpeg'
        : bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
          ? 'image/png'
          : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
              String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
            ? 'image/webp'
            : null;
    if (!mime) throw new Error('Usá fotos JPG, PNG o WebP.');
    const id = crypto.randomUUID();
    await files().put(id, file.stream(), { httpMetadata: { contentType: mime } });
    try {
      await stmt(
        'INSERT INTO images(id,name,mime,size,created_at) VALUES(?,?,?,?,?)',
        id,
        file.name.slice(0, 200),
        mime,
        file.size,
        new Date().toISOString(),
      ).run();
    } catch (e) {
      await files().delete(id);
      throw e;
    }
    return Response.json({ url: `/api/images/${id}` });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'No se pudo cargar la foto.' },
      { status: 400 },
    );
  }
}
