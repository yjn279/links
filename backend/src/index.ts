import type { Env } from './env';
import { handleSummarize } from './handlers/summarize';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/summarize') {
      const authError = checkAuth(request, env);
      if (authError) return authError;
      return handleSummarize(request, env, ctx);
    }
    return jsonResponse({ error: 'not found' }, 404);
  },
} satisfies ExportedHandler<Env>;

function checkAuth(request: Request, env: Env): Response | null {
  const header = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${env.LINKS_BACKEND_TOKEN}`;
  if (!env.LINKS_BACKEND_TOKEN || header !== expected) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  return null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
