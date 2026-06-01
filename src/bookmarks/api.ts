import { supabase } from '../supabase';
import type { Bookmark, Tag } from '../types';

export type ListBookmarksResult = {
  bookmarks: Bookmark[];
  nextCursor: string | null;
};

/** Fetch bookmarks (with their tags) for the current user, newest first.
 *  Supports cursor-based pagination via `before` (a created_at value) and `limit`.
 *  Defaults to limit=100. Returns `nextCursor` for the next page, or null when
 *  there are no more results.
 */
export async function listBookmarks(opts?: {
  limit?: number;
  before?: string;
}): Promise<ListBookmarksResult> {
  const limit = opts?.limit ?? 100;
  const before = opts?.before;

  let query = supabase
    .from('bookmarks')
    .select(
      `id, user_id, url, title, description, thumbnail_url, favicon_url, site_name, created_at, updated_at,
       tags:bookmark_tags(tag:tags(id, user_id, name, created_at))`,
    )
    .order('created_at', { ascending: false });

  if (before !== undefined) {
    query = query.lt('created_at', before);
  }

  query = query.range(0, limit - 1);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const bookmarks = rows.map((row) => ({
    ...row,
    tags: ((row.tags ?? []) as unknown as { tag: Tag | null }[])
      .map((bt) => bt.tag)
      .filter((t): t is Tag => t !== null),
  }));

  const nextCursor =
    bookmarks.length === limit ? bookmarks[bookmarks.length - 1].created_at : null;

  return { bookmarks, nextCursor };
}

/** Create a new bookmark (no meta yet). Returns the saved bookmark. */
export async function createBookmark(
  url: string,
  userId: string,
): Promise<Bookmark> {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ url, user_id: userId })
    .select(
      `id, user_id, url, title, description, thumbnail_url, favicon_url, site_name, created_at, updated_at`,
    )
    .single();

  if (error) throw new Error(error.message);
  return { ...data, tags: [] };
}

/** Update mutable fields of a bookmark. */
export async function updateBookmark(
  id: string,
  fields: Partial<
    Pick<Bookmark, 'url' | 'title' | 'description' | 'thumbnail_url' | 'favicon_url' | 'site_name'>
  >,
): Promise<void> {
  const { error } = await supabase.from('bookmarks').update(fields).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Delete a bookmark by ID. */
export async function deleteBookmark(id: string): Promise<void> {
  const { error } = await supabase.from('bookmarks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** List all tags belonging to the current user. */
export async function listTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, user_id, name, created_at')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Replace all tags on a bookmark with the given tag names.
 * Creates new tags if they don't exist for this user; reuses existing ones.
 */
export async function setTagsForBookmark(
  bookmarkId: string,
  userId: string,
  tagNames: string[],
): Promise<Tag[]> {
  // Upsert tags by (user_id, name)
  const normalized = Array.from(
    new Set(tagNames.map((n) => n.trim().toLowerCase()).filter(Boolean)),
  );

  const resolvedTags: Tag[] = [];

  for (const name of normalized) {
    // Try to find existing tag
    const { data: existing } = await supabase
      .from('tags')
      .select('id, user_id, name, created_at')
      .eq('user_id', userId)
      .eq('name', name)
      .maybeSingle();

    let tag: Tag;
    if (existing) {
      tag = existing as Tag;
    } else {
      const { data: created, error } = await supabase
        .from('tags')
        .insert({ user_id: userId, name })
        .select('id, user_id, name, created_at')
        .single();
      if (error) throw new Error(error.message);
      tag = created as Tag;
    }
    resolvedTags.push(tag);
  }

  // Replace junction rows
  const { error: delError } = await supabase
    .from('bookmark_tags')
    .delete()
    .eq('bookmark_id', bookmarkId);
  if (delError) throw new Error(delError.message);

  if (resolvedTags.length > 0) {
    const { error: insError } = await supabase.from('bookmark_tags').insert(
      resolvedTags.map((t) => ({ bookmark_id: bookmarkId, tag_id: t.id })),
    );
    if (insError) throw new Error(insError.message);
  }

  return resolvedTags;
}
