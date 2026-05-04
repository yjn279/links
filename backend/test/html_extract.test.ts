import { describe, it, expect } from 'vitest';
import { extractTitle, extractText, extractOgImage } from '../src/html_extract';

describe('extractTitle', () => {
  it('returns title tag content', () => {
    const html = '<html><head><title>Hello World</title></head><body></body></html>';
    expect(extractTitle(html)).toBe('Hello World');
  });

  it('returns null when no title tag', () => {
    const html = '<html><head></head><body><p>No title here</p></body></html>';
    expect(extractTitle(html)).toBeNull();
  });

  it('decodes HTML entities in title', () => {
    const html = '<html><head><title>Hello &amp; World &lt;test&gt;</title></head></html>';
    expect(extractTitle(html)).toBe('Hello & World <test>');
  });

  it('returns null for empty title tag', () => {
    const html = '<html><head><title>   </title></head></html>';
    expect(extractTitle(html)).toBeNull();
  });
});

describe('extractText', () => {
  it('strips script and style blocks', () => {
    const html = `
      <html>
        <head>
          <style>body { color: red; }</style>
          <script>console.log('hello');</script>
        </head>
        <body><p>Visible content</p></body>
      </html>
    `;
    const result = extractText(html);
    expect(result).not.toContain('color: red');
    expect(result).not.toContain("console.log");
    expect(result).toContain('Visible content');
  });

  it('collapses whitespace', () => {
    const html = '<p>Hello     world\n\n  how   are   you</p>';
    const result = extractText(html);
    expect(result).toBe('Hello world how are you');
  });

  it('truncates at 8000 characters', () => {
    const longContent = 'a'.repeat(10000);
    const html = `<p>${longContent}</p>`;
    const result = extractText(html);
    expect(result.length).toBeLessThanOrEqual(8000);
  });

  it('returns empty string for HTML with only tags and whitespace', () => {
    const html = '<html>  <head>  </head>  <body>   </body>  </html>';
    const result = extractText(html);
    expect(result).toBe('');
  });

  it('decodes HTML entities in body text', () => {
    const html = '<p>Hello &amp; world &lt;3&gt; &quot;quotes&quot;</p>';
    const result = extractText(html);
    expect(result).toBe('Hello & world <3> "quotes"');
  });

  it('strips HTML comments', () => {
    const html = '<p>Before<!-- this is a comment -->After</p>';
    const result = extractText(html);
    expect(result).not.toContain('this is a comment');
    expect(result).toContain('Before');
    expect(result).toContain('After');
  });
});

describe('extractOgImage', () => {
  const BASE = 'https://example.com/page';

  it('returns og:image URL (property before content)', () => {
    const html = `<meta property="og:image" content="https://example.com/og.png" />`;
    expect(extractOgImage(html, BASE)).toBe('https://example.com/og.png');
  });

  it('returns og:image URL (content before property)', () => {
    const html = `<meta content="https://example.com/og2.png" property="og:image" />`;
    expect(extractOgImage(html, BASE)).toBe('https://example.com/og2.png');
  });

  it('returns twitter:image when og:image is absent', () => {
    const html = `<meta name="twitter:image" content="https://cdn.example.com/tw.jpg" />`;
    expect(extractOgImage(html, BASE)).toBe('https://cdn.example.com/tw.jpg');
  });

  it('prefers og:image over twitter:image', () => {
    const html = [
      `<meta property="og:image" content="https://example.com/og.png" />`,
      `<meta name="twitter:image" content="https://example.com/tw.jpg" />`,
    ].join('\n');
    expect(extractOgImage(html, BASE)).toBe('https://example.com/og.png');
  });

  it('resolves relative URL against baseUrl', () => {
    const html = `<meta property="og:image" content="/images/thumb.png" />`;
    expect(extractOgImage(html, BASE)).toBe('https://example.com/images/thumb.png');
  });

  it('returns null when neither og:image nor twitter:image present', () => {
    const html = `<html><head><title>No image</title></head></html>`;
    expect(extractOgImage(html, BASE)).toBeNull();
  });

  it('returns null for non-http/https scheme', () => {
    const html = `<meta property="og:image" content="data:image/png;base64,abc" />`;
    expect(extractOgImage(html, BASE)).toBeNull();
  });
});
