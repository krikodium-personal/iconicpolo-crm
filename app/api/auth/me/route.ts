import {
  hasAnyPassword,
  partnersForSetup,
  readUser,
} from '@/lib/auth';
import { ensureAccountTables } from '@/lib/server';

export async function GET(request: Request) {
  await ensureAccountTables();
  const user = await readUser(request);
  const setup = !(await hasAnyPassword());
  return Response.json({
    user,
    setup,
    partners: user ? [] : await partnersForSetup(),
  });
}
