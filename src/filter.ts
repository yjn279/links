import type { Bookmark } from './types';

/**
 * Filter bookmarks by a search query.
 *
 * Matches against: title, url, summary, and tags.
 * Note: `summary` is the OG-derived body text (equivalent to `description`
 * in the original Flutter codebase / GitHub Issue #6 terminology).
 *
 * Returns the original array unchanged when query is empty or whitespace-only.
 * Preserves the original ordering (created_at DESC from listBookmarks).
 */
export function filterBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
  const q = query.trim().toLowerCase();
  if (q === '') return bookmarks;

  return bookmarks.filter((b) => {
    const title = (b.title ?? '').toLowerCase();
    const url = b.url.toLowerCase();
    // `summary` is the OG description equivalent (Issue #6: "description にマッチしない")
    const summary = (b.summary ?? '').toLowerCase();
    const tags = b.tags.join(' ').toLowerCase();

    return (
      title.includes(q) ||
      url.includes(q) ||
      summary.includes(q) ||
      tags.includes(q)
    );
  });
}
