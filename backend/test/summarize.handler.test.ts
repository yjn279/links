import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { SELF, fetchMock } from 'cloudflare:test';

// Mock the Anthropic SDK so tests never make real API calls.
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: async () => ({
        content: [{ type: 'text', text: 'fake summary' }],
      }),
    };
  },
}));

const VALID_TOKEN = 'test-token-abc123';
const BASE_URL = 'http://localhost';

function authHeaders(token?: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token !== undefined) {
    headers['authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Activate Miniflare's fetch mock for the whole suite so outbound fetches
// from within the Worker isolate can be intercepted. `vi.stubGlobal('fetch')`
// does NOT reach inside the Worker because it runs in a separate isolate.
beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

beforeEach(() => {
  // Assert every previously registered interceptor was actually hit.
  // This keeps tests honest about what they set up.
  fetchMock.assertNoPendingInterceptors();
});

afterAll(() => {
  fetchMock.deactivate();
});

describe('POST /summarize auth', () => {
  it('returns 401 without auth header', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('unauthorized');
  });

  it('returns 401 with wrong token', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders('wrong-token'),
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    expect(response.status).toBe(401);
  });
});

describe('POST /summarize validation', () => {
  it('returns 400 for invalid JSON body', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders(VALID_TOKEN),
      body: 'not json',
    });
    expect(response.status).toBe(400);
  });

  it('returns 400 with error "url is required" when url is missing', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders(VALID_TOKEN),
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('url is required');
  });

  it('returns 400 for non-http url (ftp protocol)', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders(VALID_TOKEN),
      body: JSON.stringify({ url: 'ftp://example.com' }),
    });
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid url string', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders(VALID_TOKEN),
      body: JSON.stringify({ url: 'not a url' }),
    });
    expect(response.status).toBe(400);
  });
});

describe('POST /summarize success path', () => {
  it('returns 200 with summary and title when fetch and anthropic succeed', async () => {
    // Intercept the outbound fetch to example.com from within the Worker.
    fetchMock
      .get('https://example.com')
      .intercept({ path: '/', method: 'GET' })
      .reply(
        200,
        '<html><head><title>Test Page</title></head><body><p>Some content here.</p></body></html>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      );

    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: authHeaders(VALID_TOKEN),
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { summary: string; title: string | null };
    expect(body.summary).toBe('fake summary');
    expect(body.title).toBe('Test Page');
  });
});

describe('GET /summarize', () => {
  it('returns 404 for non-POST method', async () => {
    const response = await SELF.fetch(`${BASE_URL}/summarize`, {
      method: 'GET',
    });
    expect(response.status).toBe(404);
  });
});
