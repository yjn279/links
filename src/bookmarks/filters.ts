import type { Bookmark } from '../types';

export type FilterParams = {
  /** Tag IDs to filter by (AND semantics). Empty array = no filter. */
  tagIds: string[];
  /** Free-text query matched against title and url (case-insensitive). */
  query: string;
  /** true = oldest first, false = newest first (default). */
  sortAsc: boolean;
};

/**
 * Apply tag filter, free-text search, and sort to a bookmark array.
 * Pure function — no side effects.
 */
export function applyFilters(bookmarks: Bookmark[], params: FilterParams): Bookmark[] {
  const { tagIds, query, sortAsc } = params;
  const q = query.trim().toLowerCase();

  let result = bookmarks;

  // Tag AND filter
  if (tagIds.length > 0) {
    result = result.filter((b) => {
      const bookmarkTagIds = new Set(b.tags.map((t) => t.id));
      return tagIds.every((id) => bookmarkTagIds.has(id));
    });
  }

  // Free-text filter on title and url
  if (q) {
    result = result.filter((b) => {
      const title = (b.title ?? '').toLowerCase();
      const url = b.url.toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }

  // Sort by created_at
  result = [...result].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortAsc ? aTime - bTime : bTime - aTime;
  });

  return result;
}
