import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { fetchPage } from '../src/fetcher';

const mockFetch = vi.fn();
beforeAll(() => {
  vi.stubGlobal('fetch', mockFetch);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('fetchPage', () => {
  it('throws for unsupported content-type (application/pdf)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('%PDF-1.4 ...', {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );

    await expect(fetchPage('https://example.com/file.pdf')).rejects.toThrow(
      'unsupported content-type: application/pdf',
    );
  });

  it('throws for upstream non-ok status', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    await expect(fetchPage('https://example.com/missing')).rejects.toThrow(
      'upstream 404',
    );
  });

  it('returns text for text/html content-type', async () => {
    const htmlContent = '<html><body>Hello</body></html>';
    mockFetch.mockResolvedValueOnce(
      new Response(htmlContent, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    );

    const result = await fetchPage('https://example.com/');
    expect(result).toBe(htmlContent);
  });

  it('returns text for text/plain content-type', async () => {
    const textContent = 'Plain text content';
    mockFetch.mockResolvedValueOnce(
      new Response(textContent, {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const result = await fetchPage('https://example.com/readme.txt');
    expect(result).toBe(textContent);
  });

  it('sends correct user-agent header', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    await fetchPage('https://example.com/');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': 'LinksBackend/0.1 (+https://github.com/links)',
        }),
      }),
    );
  });
});
