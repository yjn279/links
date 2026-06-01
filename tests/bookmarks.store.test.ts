/**
 * Unit tests for src/bookmarks/store.ts — loadMore / hasMore / nextCursor.
 *
 * The api module (`src/bookmarks/api`) and meta client (`src/meta/client`)
 * are mocked so no Supabase env vars or network access are needed.
 *
 * Scenarios covered:
 *   1. load() sets bookmarks / nextCursor / hasMore from api result.
 *   2. loadMore() appends page 2 and updates nextCursor.
 *   3. loadMore() is no-op when hasMore is false (nextCursor == null).
 *   4. loadMore() is no-op when loadingMore is already true (multi-fire guard).
 *   5. loadMore() is no-op when loading is true.
 *   6. add() prepends bookmark to the front; nextCursor / hasMore unchanged.
 *   7. remove() filters out the bookmark by id; nextCursor / hasMore unchanged.
 *   8. load() followed by loadMore() → hasMore becomes false when page 2 is last.
 */

// ---------- Mock: api module ----------
jest.mock('../src/bookmarks/api', () => ({
  listBookmarks: jest.fn(),
  createBookmark: jest.fn(),
  updateBookmark: jest.fn(),
  deleteBookmark: jest.fn(),
  listTags: jest.fn(),
  setTagsForBookmark: jest.fn(),
}));

// ---------- Mock: meta client ----------
jest.mock('../src/meta/client', () => ({
  fetchMeta: jest.fn(),
}));

import {
  listBookmarks,
  createBookmark,
  deleteBookmark,
  listTags,
} from '../src/bookmarks/api';
import { fetchMeta } from '../src/meta/client';
import type { Bookmark, Tag } from '../src/types';

// Cast to jest mocks for easy configuration
const mockListBookmarks = listBookmarks as jest.MockedFunction<typeof listBookmarks>;
const mockCreateBookmark = createBookmark as jest.MockedFunction<typeof createBookmark>;
const mockDeleteBookmark = deleteBookmark as jest.MockedFunction<typeof deleteBookmark>;
const mockListTags = listTags as jest.MockedFunction<typeof listTags>;
const mockFetchMeta = fetchMeta as jest.MockedFunction<typeof fetchMeta>;

// ---------- Helpers ----------

function makeBookmark(id: string, createdAt: string): Bookmark {
  return {
    id,
    user_id: 'user-1',
    url: `https://example.com/${id}`,
    title: `Title ${id}`,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: createdAt,
    updated_at: createdAt,
    tags: [],
  };
}

const TAG_EMPTY: Tag[] = [];

// ---------- Store import (after mocks are registered) ----------

// Zustand stores are singletons; we need to reset state between tests.
// We re-import and call setState via the store's own set mechanism.
import { useBookmarksStore } from '../src/bookmarks/store';

function resetStore() {
  useBookmarksStore.setState({
    bookmarks: [],
    tags: [],
    loading: false,
    loadingMore: false,
    hasMore: true,
    nextCursor: null,
    error: null,
    lastMetaError: null,
  });
}

// ---------- Tests ----------

describe('useBookmarksStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
    // Default: listTags returns empty array
    mockListTags.mockResolvedValue(TAG_EMPTY);
    // Default: fetchMeta returns empty result (fire-and-forget won't update)
    mockFetchMeta.mockResolvedValue({
      title: null,
      description: null,
      thumbnail_url: null,
      favicon_url: null,
      site_name: null,
    });
  });

  // --- 1. load() sets bookmarks / nextCursor / hasMore ---
  it('load() sets bookmarks, nextCursor, and hasMore from api result', async () => {
    const page1 = [
      makeBookmark('bk1', '2026-01-02T00:00:00Z'),
      makeBookmark('bk2', '2026-01-01T00:00:00Z'),
    ];
    mockListBookmarks.mockResolvedValue({
      bookmarks: page1,
      nextCursor: '2026-01-01T00:00:00Z',
    });

    await useBookmarksStore.getState().load();

    const state = useBookmarksStore.getState();
    expect(state.bookmarks).toEqual(page1);
    expect(state.nextCursor).toBe('2026-01-01T00:00:00Z');
    expect(state.hasMore).toBe(true);
    expect(state.loading).toBe(false);
  });

  // --- 1b. load() sets hasMore false when nextCursor is null ---
  it('load() sets hasMore=false when nextCursor is null', async () => {
    mockListBookmarks.mockResolvedValue({ bookmarks: [], nextCursor: null });

    await useBookmarksStore.getState().load();

    const state = useBookmarksStore.getState();
    expect(state.nextCursor).toBeNull();
    expect(state.hasMore).toBe(false);
  });

  // --- 2. loadMore() appends page 2 ---
  it('loadMore() appends second page bookmarks and updates nextCursor', async () => {
    const page1 = [makeBookmark('bk1', '2026-01-03T00:00:00Z')];
    const page2 = [makeBookmark('bk2', '2026-01-02T00:00:00Z')];

    mockListBookmarks
      .mockResolvedValueOnce({ bookmarks: page1, nextCursor: '2026-01-03T00:00:00Z' })
      .mockResolvedValueOnce({ bookmarks: page2, nextCursor: '2026-01-02T00:00:00Z' });

    await useBookmarksStore.getState().load();
    await useBookmarksStore.getState().loadMore();

    const state = useBookmarksStore.getState();
    expect(state.bookmarks).toEqual([...page1, ...page2]);
    expect(state.nextCursor).toBe('2026-01-02T00:00:00Z');
    expect(state.hasMore).toBe(true);
    expect(state.loadingMore).toBe(false);
  });

  // --- 3. loadMore() is no-op when hasMore is false ---
  it('loadMore() does not call api when hasMore is false (nextCursor == null)', async () => {
    mockListBookmarks.mockResolvedValue({ bookmarks: [], nextCursor: null });
    await useBookmarksStore.getState().load();

    // Reset call count after load
    mockListBookmarks.mockClear();

    await useBookmarksStore.getState().loadMore();

    expect(mockListBookmarks).not.toHaveBeenCalled();
  });

  // --- 4. loadMore() multi-fire guard: no-op when loadingMore is true ---
  it('loadMore() does not call api when loadingMore is already true', async () => {
    // Seed state with hasMore=true but loadingMore=true
    useBookmarksStore.setState({ hasMore: true, nextCursor: '2026-01-01T00:00:00Z', loadingMore: true });

    await useBookmarksStore.getState().loadMore();

    expect(mockListBookmarks).not.toHaveBeenCalled();
  });

  // --- 5. loadMore() is no-op when loading is true ---
  it('loadMore() does not call api when loading is true', async () => {
    useBookmarksStore.setState({ hasMore: true, nextCursor: '2026-01-01T00:00:00Z', loading: true });

    await useBookmarksStore.getState().loadMore();

    expect(mockListBookmarks).not.toHaveBeenCalled();
  });

  // --- 6. add() prepends bookmark; nextCursor / hasMore unchanged ---
  it('add() prepends new bookmark and leaves nextCursor / hasMore unchanged', async () => {
    const existing = makeBookmark('bk1', '2026-01-01T00:00:00Z');
    useBookmarksStore.setState({
      bookmarks: [existing],
      hasMore: true,
      nextCursor: '2026-01-01T00:00:00Z',
    });

    const newBk = makeBookmark('bk-new', '2026-01-05T00:00:00Z');
    mockCreateBookmark.mockResolvedValue(newBk);

    await useBookmarksStore.getState().add('https://example.com/new', 'user-1');

    const state = useBookmarksStore.getState();
    expect(state.bookmarks[0].id).toBe('bk-new');
    expect(state.bookmarks[1].id).toBe('bk1');
    // cursor / hasMore untouched
    expect(state.nextCursor).toBe('2026-01-01T00:00:00Z');
    expect(state.hasMore).toBe(true);
  });

  // --- 7. remove() filters bookmark; nextCursor / hasMore unchanged ---
  it('remove() removes bookmark by id and leaves nextCursor / hasMore unchanged', async () => {
    const bk1 = makeBookmark('bk1', '2026-01-02T00:00:00Z');
    const bk2 = makeBookmark('bk2', '2026-01-01T00:00:00Z');
    useBookmarksStore.setState({
      bookmarks: [bk1, bk2],
      hasMore: true,
      nextCursor: '2026-01-01T00:00:00Z',
    });

    mockDeleteBookmark.mockResolvedValue(undefined);

    await useBookmarksStore.getState().remove('bk1');

    const state = useBookmarksStore.getState();
    expect(state.bookmarks.map((b) => b.id)).toEqual(['bk2']);
    // cursor / hasMore untouched
    expect(state.nextCursor).toBe('2026-01-01T00:00:00Z');
    expect(state.hasMore).toBe(true);
  });

  // --- 8. Full flow: load → loadMore → hasMore becomes false ---
  it('hasMore becomes false when loadMore returns nextCursor=null (last page)', async () => {
    const page1 = [makeBookmark('bk1', '2026-01-03T00:00:00Z')];
    const page2 = [makeBookmark('bk2', '2026-01-01T00:00:00Z')];

    mockListBookmarks
      .mockResolvedValueOnce({ bookmarks: page1, nextCursor: '2026-01-03T00:00:00Z' })
      .mockResolvedValueOnce({ bookmarks: page2, nextCursor: null });

    await useBookmarksStore.getState().load();
    await useBookmarksStore.getState().loadMore();

    const state = useBookmarksStore.getState();
    expect(state.bookmarks).toEqual([...page1, ...page2]);
    expect(state.nextCursor).toBeNull();
    expect(state.hasMore).toBe(false);

    // Subsequent loadMore call must be no-op
    mockListBookmarks.mockClear();
    await useBookmarksStore.getState().loadMore();
    expect(mockListBookmarks).not.toHaveBeenCalled();
  });

  // --- 9. load() replaces bookmarks (not appends) on re-call ---
  it('load() replaces existing bookmarks on re-call', async () => {
    useBookmarksStore.setState({ bookmarks: [makeBookmark('old', '2025-12-31T00:00:00Z')] });

    const fresh = [makeBookmark('fresh1', '2026-01-10T00:00:00Z')];
    mockListBookmarks.mockResolvedValue({ bookmarks: fresh, nextCursor: null });

    await useBookmarksStore.getState().load();

    expect(useBookmarksStore.getState().bookmarks).toEqual(fresh);
  });
});
