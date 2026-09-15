import {
  createSession,
  hasAnyPassword,
  sessionCookie,
  setPartnerAccess,
} from '@/lib/auth';
import { ensureAccountTables, obj, str } from '@/lib/server';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 });
  await ensureAccountTables();
  try {
    if (await hasAnyPassword())
      throw new Error('El acceso ya está configurado. Ingresá con tu email.');
    const body = obj(JSON.parse(await request.text()));
    const id = str(body.partner_id, 'Socio', true);
    const email = str(body.email, 'Email', true);
    const password = str(body.password, 'Contraseña', true, 72);
    await setPartnerAccess(id, email, password);
    const token = await createSession(id);
    return Response.json(
      { ok: true },
      { headers: { 'Set-Cookie': sessionCookie(token, request) } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : 'No se pudo crear el acceso.',
      },
      { status: 400 },
    );
  }
}
