# Links Backend

A Cloudflare Worker written in TypeScript that provides an AI-powered URL summarization endpoint for the Links iOS app. It fetches a web page, extracts plain text, and calls Anthropic Claude Haiku to produce a 2-3 sentence summary in the page's language (falling back to Japanese when the language is unclear).

## Local Development

Install dependencies and start a local dev server:

```bash
npm install
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Secrets

Set secrets via Wrangler before deploying (or for local dev, add them to `backend/.dev.vars`):

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put LINKS_BACKEND_TOKEN
```

For local development without `wrangler secret`, create `backend/.dev.vars`:

```
ANTHROPIC_API_KEY=sk-ant-...
LINKS_BACKEND_TOKEN=your-local-token
```

## Deploy

```bash
npm run deploy
```

## Configuration

The Anthropic model is configurable via `ANTHROPIC_MODEL` in `wrangler.toml`. Default: `claude-haiku-4-5`.

## API

### `POST /summarize`

Fetch a URL and return an AI-generated summary.

**Headers:**

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <LINKS_BACKEND_TOKEN>` |
| `Content-Type` | `application/json` |

**Request body:**

```json
{ "url": "https://example.com/article" }
```

**Success response (200):**

```json
{
  "summary": "This article discusses ...",
  "title": "Article Title"
}
```

`title` is `null` if no `<title>` tag is found in the page HTML.

**Error responses:**

| Status | Meaning |
|--------|---------|
| 400 | Missing/invalid `url` field or invalid JSON body |
| 401 | Missing or incorrect `Authorization` header |
| 404 | Route not found |
| 422 | Could not fetch the target URL (upstream error or unsupported content-type) |
| 429 | Anthropic rate limit hit |
| 502 | Anthropic API error |

### Example `curl`

```bash
curl -X POST https://links-backend.<your-subdomain>.workers.dev/summarize \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/some-article"}'
```

## Testing

Run the Vitest suite (uses `@cloudflare/vitest-pool-workers` for the Workers runtime):

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Type-check without emitting:

```bash
npm run typecheck
```

Real end-to-end testing against Anthropic requires valid `ANTHROPIC_API_KEY` and `LINKS_BACKEND_TOKEN` secrets and is done manually via `wrangler dev` + `curl`.

## Project Structure

```
backend/
  src/
    index.ts          # Worker entry point, router, auth check
    env.ts            # Env interface (typed bindings)
    fetcher.ts        # Outbound HTTP fetch with content-type guard
    html_extract.ts   # Pure HTML -> plain text / title extraction
    anthropic.ts      # Anthropic Claude SDK wrapper
    handlers/
      summarize.ts    # POST /summarize handler logic
  test/
    html_extract.test.ts        # Unit tests for HTML extraction
    fetcher.test.ts             # Unit tests for fetcher (mocked fetch)
    summarize.handler.test.ts   # Integration tests via SELF.fetch
  wrangler.toml
  tsconfig.json
  vitest.config.ts
  package.json
```
