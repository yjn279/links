import { create } from 'zustand';
import {
  listBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  listTags,
  setTagsForBookmark,
} from './api';
import { fetchMeta } from '../meta/client';
import type { Bookmark, Tag } from '../types';

type BookmarksState = {
  bookmarks: Bookmark[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  lastMetaError: string | null;

  load: () => Promise<void>;
  add: (url: string, userId: string) => Promise<Bookmark>;
  update: (
    id: string,
    fields: Partial<Pick<Bookmark, 'url' | 'title' | 'description' | 'thumbnail_url' | 'favicon_url' | 'site_name'>>,
    tagNames: string[],
    userId: string,
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refreshTags: () => Promise<void>;
  setMetaError: (msg: string | null) => void;
};

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  tags: [],
  loading: false,
  error: null,
  lastMetaError: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const [bookmarks, tags] = await Promise.all([listBookmarks(), listTags()]);
      set({ bookmarks, tags, loading: false });
    } catch (e) {
      set({ error: String(e instanceof Error ? e.message : e), loading: false });
    }
  },

  add: async (url, userId) => {
    // 1. Immediate save (no meta yet)
    const bookmark = await createBookmark(url, userId);
    set({ bookmarks: [bookmark, ...get().bookmarks] });

    // 2. Fire-and-forget meta fetch — same pattern as old summarize in src/store.ts:43-66
    void fetchMeta(url)
      .then(async (meta) => {
        if (
          meta.title ||
          meta.description ||
          meta.thumbnail_url ||
          meta.favicon_url ||
          meta.site_name
        ) {
          await updateBookmark(bookmark.id, meta);
          set({
            bookmarks: get().bookmarks.map((b) =>
              b.id === bookmark.id ? { ...b, ...meta } : b,
            ),
          });
        }
      })
      .catch((e) => {
        get().setMetaError(String(e instanceof Error ? e.message : e));
      });

    return bookmark;
  },

  update: async (id, fields, tagNames, userId) => {
    await updateBookmark(id, fields);
    const newTags = await setTagsForBookmark(id, userId, tagNames);
    const allTags = await listTags();
    set({
      bookmarks: get().bookmarks.map((b) =>
        b.id === id ? { ...b, ...fields, tags: newTags } : b,
      ),
      tags: allTags,
    });
  },

  remove: async (id) => {
    await deleteBookmark(id);
    const allTags = await listTags();
    set({
      bookmarks: get().bookmarks.filter((b) => b.id !== id),
      tags: allTags,
    });
  },

  refreshTags: async () => {
    const tags = await listTags();
    set({ tags });
  },

  setMetaError: (msg) => set({ lastMetaError: msg }),
}));
