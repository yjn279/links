import type { Env } from '../env';
import { jsonResponse } from '../index';
import { fetchPage } from '../fetcher';
import { extractOgImage, extractText, extractTitle } from '../html_extract';
import { summarizeText } from '../anthropic';

interface SummarizeRequest {
  url: string;
}

export async function handleSummarize(
  request: Request,
  env: Env,
  _ctx: ExecutionContext,
): Promise<Response> {
  let body: SummarizeRequest;
  try {
    body = (await request.json()) as SummarizeRequest;
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  const validationError = validateUrl(body?.url);
  if (validationError) return jsonResponse({ error: validationError }, 400);

  let html: string;
  try {
    html = await fetchPage(body.url);
  } catch (e) {
    return jsonResponse({ error: `failed to fetch url: ${String(e)}` }, 422);
  }

  const title = extractTitle(html);
  const imageUrl = extractOgImage(html, body.url);
  const text = extractText(html);

  let summary: string;
  try {
    summary = await summarizeText(text, env);
  } catch (e) {
    const msg = String(e);
    if (msg.includes('429')) return jsonResponse({ error: 'rate limited' }, 429);
    return jsonResponse({ error: `anthropic error: ${msg}` }, 502);
  }

  return jsonResponse({ summary, title, imageUrl });
}

export function validateUrl(url: unknown): string | null {
  if (typeof url !== 'string' || url.length === 0) return 'url is required';
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'invalid url';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'only http/https urls are supported';
  }
  return null;
}
