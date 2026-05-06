/**
 * Tests for the meta-parsing logic mirroring supabase/functions/fetch-meta/parse.ts.
 * The Edge Function uses Deno-style imports; we inline the same pure functions here for Jest.
 */

type ParsedMeta = {
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
};

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
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    );
}

function extractProperty(html: string, property: string): string | null {
  const esc = escapeRegex(property);
  // property="..." content="..."
  const re1 = new RegExp(
    `<meta[^>]+property=['"]${esc}['"][^>]+content=['"]([^'"]+)['"]`,
    'i',
  );
  const m1 = re1.exec(html);
  if (m1) return decodeHtmlEntities(m1[1].trim());
  // content="..." property="..."
  const re2 = new RegExp(
    `<meta[^>]+content=['"]([^'"]+)['"][^>]+property=['"]${esc}['"]`,
    'i',
  );
  const m2 = re2.exec(html);
  if (m2) return decodeHtmlEntities(m2[1].trim());
  return null;
}

function extractName(html: string, name: string): string | null {
  const esc = escapeRegex(name);
  const re1 = new RegExp(
    `<meta[^>]+name=['"]${esc}['"][^>]+content=['"]([^'"]+)['"]`,
    'i',
  );
  const m1 = re1.exec(html);
  if (m1) return decodeHtmlEntities(m1[1].trim());
  const re2 = new RegExp(
    `<meta[^>]+content=['"]([^'"]+)['"][^>]+name=['"]${esc}['"]`,
    'i',
  );
  const m2 = re2.exec(html);
  if (m2) return decodeHtmlEntities(m2[1].trim());
  return null;
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? decodeHtmlEntities(m[1].trim()) : null;
}

function extractFavicon(html: string, base: string): string | null {
  const re1 = /<link[^>]+rel=['"][^'"]*icon[^'"]*['"][^>]+href=['"]([^'"]+)['"]/i;
  const m1 = re1.exec(html);
  if (m1) {
    try { return new URL(m1[1].trim(), base).href; } catch { return m1[1].trim(); }
  }
  const re2 = /<link[^>]+href=['"]([^'"]+)['"][^>]+rel=['"][^'"]*icon[^'"]*['"]/i;
  const m2 = re2.exec(html);
  if (m2) {
    try { return new URL(m2[1].trim(), base).href; } catch { return m2[1].trim(); }
  }
  return null;
}

function parseMeta(html: string, pageUrl: string): ParsedMeta {
  return {
    title:
      extractProperty(html, 'og:title') ??
      extractName(html, 'twitter:title') ??
      extractTitle(html),
    description:
      extractProperty(html, 'og:description') ??
      extractName(html, 'twitter:description') ??
      extractName(html, 'description'),
    thumbnail_url:
      extractProperty(html, 'og:image') ??
      extractName(html, 'twitter:image') ??
      extractName(html, 'twitter:image:src'),
    site_name: extractProperty(html, 'og:site_name'),
    favicon_url: extractFavicon(html, pageUrl),
  };
}

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────

describe('parseMeta', () => {
  it('case 1: extracts all OG fields when present', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Example OG Title" />
        <meta property="og:description" content="An example description." />
        <meta property="og:image" content="https://example.com/og.png" />
        <meta property="og:site_name" content="Example Site" />
        <link rel="icon" href="/favicon.ico" />
      </head><body/></html>`;
    const r = parseMeta(html, 'https://example.com/page');
    expect(r.title).toBe('Example OG Title');
    expect(r.description).toBe('An example description.');
    expect(r.thumbnail_url).toBe('https://example.com/og.png');
    expect(r.site_name).toBe('Example Site');
    expect(r.favicon_url).toBe('https://example.com/favicon.ico');
  });

  it('case 2: falls back to <title> and meta name=description when OG absent', () => {
    const html = `
      <html><head>
        <title>Plain Title Page</title>
        <meta name="description" content="A plain description." />
      </head><body/></html>`;
    const r = parseMeta(html, 'https://example.com/');
    expect(r.title).toBe('Plain Title Page');
    expect(r.description).toBe('A plain description.');
    expect(r.thumbnail_url).toBeNull();
    expect(r.site_name).toBeNull();
  });

  it('case 3: returns all nulls for empty / unrecognised HTML', () => {
    const r = parseMeta('<html><body>nothing here</body></html>', 'https://example.com/');
    expect(r.title).toBeNull();
    expect(r.description).toBeNull();
    expect(r.thumbnail_url).toBeNull();
    expect(r.favicon_url).toBeNull();
    expect(r.site_name).toBeNull();
  });

  it('case 4: uses Twitter Card tags as fallback', () => {
    const html = `
      <html><head>
        <meta name="twitter:title" content="Twitter Title" />
        <meta name="twitter:image" content="https://example.com/twitter.png" />
      </head><body/></html>`;
    const r = parseMeta(html, 'https://example.com/');
    expect(r.title).toBe('Twitter Title');
    expect(r.thumbnail_url).toBe('https://example.com/twitter.png');
  });

  it('case 5: decodes HTML entities in title', () => {
    const html = '<html><head><title>Cats &amp; Dogs &lt;Fun&gt;</title></head></html>';
    const r = parseMeta(html, 'https://example.com/');
    expect(r.title).toBe('Cats & Dogs <Fun>');
  });

  it('case 6: resolves relative favicon URL against page base', () => {
    const html =
      '<html><head><link rel="shortcut icon" href="/assets/favicon.png" /></head></html>';
    const r = parseMeta(html, 'https://example.com/some/path');
    expect(r.favicon_url).toBe('https://example.com/assets/favicon.png');
  });
});
