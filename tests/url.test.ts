/**
 * Unit tests for src/lib/url.ts — isOpenableUrl
 */
import { isOpenableUrl } from '../src/lib/url';

describe('isOpenableUrl', () => {
  it('accepts https:// URLs', () => {
    expect(isOpenableUrl('https://example.com')).toBe(true);
  });

  it('accepts http:// URLs', () => {
    expect(isOpenableUrl('http://example.com')).toBe(true);
  });

  it('rejects ftp:// URLs', () => {
    expect(isOpenableUrl('ftp://x')).toBe(false);
  });

  it('rejects javascript: URLs', () => {
    expect(isOpenableUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects scheme-less strings', () => {
    expect(isOpenableUrl('example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isOpenableUrl('')).toBe(false);
  });

  it('accepts URL with path and query string', () => {
    expect(isOpenableUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('rejects data: URLs', () => {
    expect(isOpenableUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });
});
