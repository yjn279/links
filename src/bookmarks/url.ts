/**
 * URL normalisation and validation utilities for bookmark input.
 *
 * React Native's URL polyfill only parses `https?://` schemes.
 * For any other scheme `hostname` and `pathname` are empty/`/`, so validation
 * MUST check `protocol` and `host` explicitly rather than relying on `new URL`
 * succeeding alone.  This mirrors the backend guard in
 * `backend/src/handlers/summarize.ts:48-60`.
 */

/**
 * Normalise a raw URL input from the user.
 *
 * - Trims whitespace.
 * - Prepends `https://` when no `http(s)://` prefix is present.
 * - Validates that the result is parseable AND has an `http:`/`https:` protocol
 *   AND a non-empty host (guards against RN polyfill leniency where
 *   `new URL('https://not a url')` succeeds but `hostname` is `''`).
 *
 * Returns `{ ok: true, url }` with the normalised string on success, or
 * `{ ok: false, error: 'Invalid URL' }` on failure.
 *
 * Pure function — no imports from React/RN, no I/O, no side-effects.
 */
export function normalizeUrl(
  input: string,
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'Invalid URL' };
  }

  // If the input contains a scheme (e.g. "ftp://") but it is not http(s),
  // reject early rather than letting "https://ftp://..." slip through.
  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { ok: false, error: 'Invalid URL' };
  }

  // Prepend https:// if the input lacks an http(s) scheme.
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  // RN polyfill guard: even when new URL() doesn't throw, hostname may be
  // empty for inputs like 'not a url' after prepending https://.
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.host === ''
  ) {
    return { ok: false, error: 'Invalid URL' };
  }

  return { ok: true, url: parsed.href };
}
