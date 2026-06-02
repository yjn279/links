/**
 * URL guard helpers for bookmark open actions.
 * Only http: and https: URLs with a non-empty host are considered openable.
 */

/**
 * Returns true when `url` can be safely opened in an in-app browser.
 * Accepts only `http:` and `https:` URLs that parse successfully and
 * have a non-empty hostname.
 */
export function isOpenableUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}
