/**
 * Extract the best OG image URL from HTML.
 * Priority: og:image → twitter:image
 * Relative URLs are resolved against baseUrl.
 * Non-http/https schemes return null.
 */
export function extractOgImage(html: string, baseUrl: string): string | null {
  // Match <meta property="og:image" content="..." /> or <meta name="twitter:image" content="..." />
  const ogMatch = html.match(
    /<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/i,
  ) ?? html.match(
    /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+property\s*=\s*["']og:image["'][^>]*>/i,
  );

  const twitterMatch = html.match(
    /<meta[^>]+name\s*=\s*["']twitter:image["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/i,
  ) ?? html.match(
    /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+name\s*=\s*["']twitter:image["'][^>]*>/i,
  );

  const raw = (ogMatch?.[1] ?? twitterMatch?.[1] ?? '').trim();
  if (!raw) return null;

  // Resolve to absolute URL
  let resolved: string;
  try {
    resolved = new URL(raw, baseUrl).href;
  } catch {
    return null;
  }

  // Only allow http / https
  if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
    return null;
  }

  return resolved;
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const raw = match[1].trim();
  return raw.length === 0 ? null : decodeHtmlEntities(raw);
}

export function extractText(html: string): string {
  // Strip <script> and <style> blocks entirely, then remove remaining tags.
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  out = out.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  out = out.replace(/<!--[\s\S]*?-->/g, ' ');
  out = out.replace(/<[^>]+>/g, ' ');
  out = decodeHtmlEntities(out);
  out = out.replace(/\s+/g, ' ').trim();
  // Cap at 8000 characters to limit token usage downstream.
  return out.length > 8000 ? out.slice(0, 8000) : out;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}
