import {
  clearSessionCookie,
  destroySession,
} from '@/lib/auth';
import { ensureAccountTables } from '@/lib/server';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 });
  await ensureAccountTables();
  await destroySession(request);
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': clearSessionCookie(request) } },
  );
}
