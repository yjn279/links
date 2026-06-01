import type { Bookmark } from '../types';

export type SortKey = 'created_at' | 'updated_at' | 'title' | 'site_name';

export type FilterParams = {
  /** Tag IDs to filter by (AND semantics). Empty array = no filter. */
  tagIds: string[];
  /** Free-text query matched against title and url (case-insensitive). */
  query: string;
  /** true = oldest first / A-Z, false = newest first / Z-A (default). */
  sortAsc: boolean;
  /** Field to sort by. Defaults to 'created_at' when omitted. */
  sortKey?: SortKey;
};

/**
 * Apply tag filter, free-text search, and sort to a bookmark array.
 * Pure function — no side effects.
 *
 * Sort behaviour:
 * - 'created_at' / 'updated_at': numeric time comparison.
 * - 'title' / 'site_name': localeCompare (handles Japanese natural order).
 * - Null or empty-string values are always placed at the end regardless of sortAsc.
 */
export function applyFilters(bookmarks: Bookmark[], params: FilterParams): Bookmark[] {
  const { tagIds, query, sortAsc, sortKey = 'created_at' } = params;
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

  // Sort
  result = [...result].sort((a, b) => {
    if (sortKey === 'created_at' || sortKey === 'updated_at') {
      const aTime = new Date(a[sortKey]).getTime();
      const bTime = new Date(b[sortKey]).getTime();
      return sortAsc ? aTime - bTime : bTime - aTime;
    }

    // String keys: title, site_name
    const aRaw = a[sortKey];
    const bRaw = b[sortKey];
    const aEmpty = aRaw === null || aRaw === '';
    const bEmpty = bRaw === null || bRaw === '';

    // Null / empty always goes to the end regardless of sort direction
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    const cmp = aRaw!.localeCompare(bRaw!, undefined, { sensitivity: 'base' });
    return sortAsc ? cmp : -cmp;
  });

  return result;
}
