/**
 * Unit tests for src/bookmarks/url.ts — normalizeUrl
 */
import { normalizeUrl } from '../src/bookmarks/url';

describe('normalizeUrl', () => {
  // 1. Protocol completion
  it('prepends https:// when no scheme is present', () => {
    const result = normalizeUrl('example.com');
    expect(result).toEqual({ ok: true, url: 'https://example.com/' });
  });

  // 2a. Existing https:// scheme is preserved
  it('keeps https:// scheme unchanged', () => {
    const result = normalizeUrl('https://example.com');
    expect(result).toEqual({ ok: true, url: 'https://example.com/' });
  });

  // 2b. Existing http:// scheme is preserved
  it('keeps http:// scheme unchanged', () => {
    const result = normalizeUrl('http://example.com');
    expect(result).toEqual({ ok: true, url: 'http://example.com/' });
  });

  // 2c. Scheme detection is case-insensitive
  it('recognises uppercase HTTP:// without double-prepending', () => {
    const result = normalizeUrl('HTTP://example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toMatch(/^http:\/\//i);
    }
  });

  // 3. Invalid URL
  it('rejects "not a url" with error "Invalid URL"', () => {
    expect(normalizeUrl('not a url')).toEqual({
      ok: false,
      error: 'Invalid URL',
    });
  });

  // 4a. Empty string
  it('rejects empty string', () => {
    expect(normalizeUrl('')).toEqual({ ok: false, error: 'Invalid URL' });
  });

  // 4b. Whitespace-only string
  it('rejects whitespace-only string', () => {
    expect(normalizeUrl('   ')).toEqual({ ok: false, error: 'Invalid URL' });
  });

  // Whitespace is trimmed before processing
  it('trims surrounding whitespace before validating', () => {
    const result = normalizeUrl('  example.com  ');
    expect(result).toEqual({ ok: true, url: 'https://example.com/' });
  });

  // Non-http(s) scheme is rejected even though URL parses fine
  it('rejects non-http(s) schemes (e.g. ftp://)', () => {
    expect(normalizeUrl('ftp://example.com')).toEqual({
      ok: false,
      error: 'Invalid URL',
    });
  });

  // RN polyfill regression: swap global.URL for a stub that only resolves
  // hostname/host for https?:// — identical to the technique used in
  // tests/native-intent.test.ts:76-104.  Under this stub:
  //   • 'not a url'  → prepended to 'https://not a url', host === '' → ok: false
  //   • 'example.com' → prepended to 'https://example.com', host !== '' → ok: true
  it('rejects "not a url" and completes "example.com" with RN polyfill stub', () => {
    const RealURL = global.URL;

    class HttpsOnlyURL {
      private _raw: string;
      constructor(input: string) {
        // React Native's URL polyfill does NOT throw for arbitrary strings;
        // it silently produces empty hostname/host instead.
        this._raw = input;
      }
      get protocol(): string {
        // Only recognise http: and https: — anything else returns ''.
        const m = this._raw.match(/^(https?:)\/\//i);
        return m ? m[1].toLowerCase() : '';
      }
      get host(): string {
        // Return non-empty host only when the entire input has no whitespace
        // and starts with a well-formed https?:// authority.
        // Mirrors RN polyfill: 'https://not a url' → host === ''
        // because the polyfill cannot parse URLs with spaces.
        if (/\s/.test(this._raw)) return '';
        const m = this._raw.match(/^https?:\/\/([^/?#]+)/i);
        return m ? m[1] : '';
      }
      get href(): string {
        const h = this.host;
        if (!h) return this._raw;
        const base = `${this.protocol}//${h}`;
        return this._raw.endsWith('/') ? base + '/' : base + '/';
      }
    }

    // @ts-expect-error: deliberately overriding global URL for the test
    global.URL = HttpsOnlyURL;

    try {
      expect(normalizeUrl('not a url')).toEqual({
        ok: false,
        error: 'Invalid URL',
      });
      const completed = normalizeUrl('example.com');
      expect(completed.ok).toBe(true);
      if (completed.ok) {
        expect(completed.url).toContain('example.com');
      }
    } finally {
      global.URL = RealURL;
    }
  });
});
