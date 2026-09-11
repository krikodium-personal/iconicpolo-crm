import { files } from '@/db';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-z0-9-]+$/.test(id))
    return new Response('No encontrada', { status: 404 });
  const file = await files().get(id);
  if (!file) return new Response('No encontrada', { status: 404 });
  return new Response(file.body, {
    headers: {
      'Content-Type':
        file.httpMetadata?.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
