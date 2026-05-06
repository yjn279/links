/**
 * Pure HTML parser for OG / Twitter Card / <title> / <link rel="icon"> metadata.
 * No DOM dependency — uses regex over the raw HTML string for Deno edge compatibility.
 */

export type ParsedMeta = {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
};

function extractMeta(html: string, property: string): string | null {
  const propRegex = new RegExp(
    '<meta[^>]+property=["\']' + escapeRegex(property) + '["\'][^>]+content=["\']([^"\']+)["\']',
    'i',
  );
  const propMatch = propRegex.exec(html);
  if (propMatch) return decodeHtmlEntities(propMatch[1].trim());

  const propRegexRev = new RegExp(
    '<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + escapeRegex(property) + '["\']',
    'i',
  );
  const propMatchRev = propRegexRev.exec(html);
  if (propMatchRev) return decodeHtmlEntities(propMatchRev[1].trim());

  return null;
}

function extractNameMeta(html: string, name: string): string | null {
  const nameRegex = new RegExp(
    '<meta[^>]+name=["\']' + escapeRegex(name) + '["\'][^>]+content=["\']([^"\']+)["\']',
    'i',
  );
  const m = nameRegex.exec(html);
  if (m) return decodeHtmlEntities(m[1].trim());

  const nameRegexRev = new RegExp(
    '<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']' + escapeRegex(name) + '["\']',
    'i',
  );
  const mRev = nameRegexRev.exec(html);
  if (mRev) return decodeHtmlEntities(mRev[1].trim());

  return null;
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (m) return decodeHtmlEntities(m[1].trim());
  return null;
}

function extractFaviconUrl(html: string, baseUrl: string): string | null {
  const iconRegex = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i;
  const m = iconRegex.exec(html);
  if (m) {
    const href = m[1].trim();
    return resolveUrl(href, baseUrl);
  }

  const iconRegexRev = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i;
  const mRev = iconRegexRev.exec(html);
  if (mRev) {
    return resolveUrl(mRev[1].trim(), baseUrl);
  }

  return null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Parse OG / Twitter Card / title / favicon from raw HTML.
 * @param html  Raw HTML string.
 * @param pageUrl  Canonical page URL (used to resolve relative favicon paths).
 */
export function parseMeta(html: string, pageUrl: string): ParsedMeta {
  const title =
    extractMeta(html, 'og:title') ??
    extractNameMeta(html, 'twitter:title') ??
    extractTitle(html);

  const description =
    extractMeta(html, 'og:description') ??
    extractNameMeta(html, 'twitter:description') ??
    extractNameMeta(html, 'description');

  const thumbnail_url =
    extractMeta(html, 'og:image') ??
    extractNameMeta(html, 'twitter:image') ??
    extractNameMeta(html, 'twitter:image:src');

  const site_name = extractMeta(html, 'og:site_name');

  const favicon_url = extractFaviconUrl(html, pageUrl);

  return {
    title: title || null,
    description: description || null,
    thumbnail_url: thumbnail_url || null,
    favicon_url: favicon_url || null,
    site_name: site_name || null,
  };
}
