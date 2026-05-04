import { create } from 'zustand';
import {
  createBookmark,
  deleteBookmark,
  listAllTags,
  listBookmarks,
  updateBookmark,
} from './db';
import type { Bookmark } from './types';
import { BackendError, isBackendConfigured, summarize } from './api';

type BookmarksState = {
  bookmarks: Bookmark[];
  tags: string[];
  loading: boolean;
  error: string | null;
  lastSummarizeError: string | null;
  currentUserId: string;

  load: () => Promise<void>;
  add: (url: string) => Promise<Bookmark>;
  update: (bookmark: Bookmark) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refreshTags: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;
};

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  tags: [],
  loading: false,
  error: null,
  lastSummarizeError: null,
  currentUserId: 'guest',

  load: async () => {
    set({ loading: true, error: null });
    try {
      const userId = get().currentUserId;
      const [bookmarks, tags] = await Promise.all([
        listBookmarks(userId),
        listAllTags(userId),
      ]);
      set({ bookmarks, tags, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  add: async (url: string) => {
    const userId = get().currentUserId;
    const bookmark = await createBookmark(url, [], userId);
    set({ bookmarks: [bookmark, ...get().bookmarks] });
    // Fire-and-forget backend summarize.
    if (isBackendConfigured()) {
      void summarize(url)
        .then(async (result) => {
          const updated: Bookmark = {
            ...bookmark,
            title: result.title,
            summary: result.summary,
            imageUrl: result.imageUrl,
          };
          await updateBookmark(updated);
          set({
            bookmarks: get().bookmarks.map((b) => (b.id === bookmark.id ? updated : b)),
          });
        })
        .catch((e) => {
          const message = e instanceof BackendError ? e.message : String(e);
          set({ lastSummarizeError: message });
        });
    }
    return bookmark;
  },

  update: async (bookmark) => {
    const userId = get().currentUserId;
    await updateBookmark(bookmark);
    const tags = await listAllTags(userId);
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === bookmark.id ? bookmark : b)),
      tags,
    });
  },

  remove: async (id) => {
    const userId = get().currentUserId;
    await deleteBookmark(id);
    const tags = await listAllTags(userId);
    set({
      bookmarks: get().bookmarks.filter((b) => b.id !== id),
      tags,
    });
  },

  refreshTags: async () => {
    const userId = get().currentUserId;
    const tags = await listAllTags(userId);
    set({ tags });
  },

  setCurrentUser: async (userId: string) => {
    set({ currentUserId: userId });
    // Reload bookmarks for the new user.
    set({ loading: true, error: null });
    try {
      const [bookmarks, tags] = await Promise.all([
        listBookmarks(userId),
        listAllTags(userId),
      ]);
      set({ bookmarks, tags, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
