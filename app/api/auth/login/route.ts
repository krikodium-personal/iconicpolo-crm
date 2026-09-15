import {
  createSession,
  sessionCookie,
  validEmail,
  verifyPassword,
} from '@/lib/auth';
import { ensureAccountTables, obj, stmt, str } from '@/lib/server';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 });
  await ensureAccountTables();
  try {
    const body = obj(JSON.parse(await request.text()));
    const email = str(body.email, 'Email', true).toLowerCase();
    const password = str(body.password, 'Contraseña', true, 72);
    if (!validEmail(email)) throw new Error('Email o contraseña incorrectos.');
    const row = await stmt(
      'SELECT id, password_hash FROM partners WHERE email=? AND archived=0',
      email,
    ).first();
    const hash = row ? String(obj(row).password_hash || '') : '';
    if (!row || !hash || !(await verifyPassword(password, hash)))
      throw new Error('Email o contraseña incorrectos.');
    const token = await createSession(String(obj(row).id));
    return Response.json(
      { ok: true },
      { headers: { 'Set-Cookie': sessionCookie(token, request) } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo ingresar.' },
      { status: 400 },
    );
  }
}
