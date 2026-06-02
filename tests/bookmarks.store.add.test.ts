/**
 * Unit tests for src/bookmarks/store.ts — add() with tagNames
 *
 * Covers:
 *   (a) tagNames 指定時に setTagsForBookmark が呼ばれ tags が反映される
 *   (b) tagNames 省略/空配列時は setTagsForBookmark が呼ばれない（後方互換）
 *   (c) setTagsForBookmark 失敗時もブックマークは残り add が resolve する（失敗時方針）
 */

jest.mock('../src/bookmarks/api', () => ({
  listBookmarks: jest.fn().mockResolvedValue([]),
  createBookmark: jest.fn(),
  updateBookmark: jest.fn().mockResolvedValue(undefined),
  deleteBookmark: jest.fn().mockResolvedValue(undefined),
  listTags: jest.fn().mockResolvedValue([]),
  setTagsForBookmark: jest.fn(),
}));

jest.mock('../src/meta/client', () => ({
  fetchMeta: jest.fn().mockResolvedValue({
    title: null,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
  }),
}));

import {
  createBookmark,
  setTagsForBookmark,
  listTags,
} from '../src/bookmarks/api';
import { useBookmarksStore } from '../src/bookmarks/store';

const mockCreateBookmark = createBookmark as jest.MockedFunction<typeof createBookmark>;
const mockSetTagsForBookmark = setTagsForBookmark as jest.MockedFunction<typeof setTagsForBookmark>;
const mockListTags = listTags as jest.MockedFunction<typeof listTags>;

function makeBookmark(id: string) {
  return {
    id,
    user_id: 'user-1',
    url: 'https://example.com',
    title: null,
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    tags: [] as { id: string; user_id: string; name: string; created_at: string }[],
  };
}

function makeTag(id: string, name: string) {
  return { id, user_id: 'user-1', name, created_at: '2026-01-01T00:00:00Z' };
}

beforeEach(() => {
  // Zustand store をリセット（各テスト前にクリーンな状態にする）
  useBookmarksStore.setState({
    bookmarks: [],
    tags: [],
    loading: false,
    error: null,
    lastMetaError: null,
  });
  jest.clearAllMocks();
  // デフォルトの listTags 戻り値
  mockListTags.mockResolvedValue([]);
});

describe('store.add — tagNames 指定時', () => {
  it('(a) setTagsForBookmark が (bookmark.id, userId, tagNames) で呼ばれ、bookmark.tags に反映される', async () => {
    const bookmark = makeBookmark('bm-1');
    const tags = [makeTag('t-1', 'work'), makeTag('t-2', 'react')];

    mockCreateBookmark.mockResolvedValue(bookmark);
    mockSetTagsForBookmark.mockResolvedValue(tags);
    mockListTags.mockResolvedValue(tags);

    const result = await useBookmarksStore
      .getState()
      .add('https://example.com', 'user-1', ['work', 'react']);

    // setTagsForBookmark が正しい引数で呼ばれたことを確認
    expect(mockSetTagsForBookmark).toHaveBeenCalledTimes(1);
    expect(mockSetTagsForBookmark).toHaveBeenCalledWith('bm-1', 'user-1', ['work', 'react']);

    // 戻り値の bookmark.tags に tags が反映されている
    expect(result.tags).toEqual(tags);

    // store 内の bookmarks にも tags が反映されている
    const storeBookmark = useBookmarksStore.getState().bookmarks.find((b) => b.id === 'bm-1');
    expect(storeBookmark?.tags).toEqual(tags);

    // tags ストアも最新化されている
    expect(useBookmarksStore.getState().tags).toEqual(tags);
  });
});

describe('store.add — tagNames 省略/空配列時（後方互換）', () => {
  it('(b-1) tagNames 省略時は setTagsForBookmark が呼ばれない', async () => {
    const bookmark = makeBookmark('bm-2');
    mockCreateBookmark.mockResolvedValue(bookmark);

    await useBookmarksStore
      .getState()
      .add('https://example.com', 'user-1');

    expect(mockSetTagsForBookmark).not.toHaveBeenCalled();

    // ブックマークは登録されている
    const storeBookmark = useBookmarksStore.getState().bookmarks.find((b) => b.id === 'bm-2');
    expect(storeBookmark).toBeDefined();
  });

  it('(b-2) tagNames 空配列時は setTagsForBookmark が呼ばれない', async () => {
    const bookmark = makeBookmark('bm-3');
    mockCreateBookmark.mockResolvedValue(bookmark);

    await useBookmarksStore
      .getState()
      .add('https://example.com', 'user-1', []);

    expect(mockSetTagsForBookmark).not.toHaveBeenCalled();

    const storeBookmark = useBookmarksStore.getState().bookmarks.find((b) => b.id === 'bm-3');
    expect(storeBookmark).toBeDefined();
  });
});

describe('store.add — setTagsForBookmark 失敗時', () => {
  it('(c) setTagsForBookmark が reject してもブックマークは bookmarks に残り add が resolve する', async () => {
    const bookmark = makeBookmark('bm-4');
    mockCreateBookmark.mockResolvedValue(bookmark);
    mockSetTagsForBookmark.mockRejectedValue(new Error('tag upsert failed'));

    // add 自体は throw しない
    const result = await useBookmarksStore
      .getState()
      .add('https://example.com', 'user-1', ['work']);

    expect(result).toBeDefined();
    expect(result.id).toBe('bm-4');

    // ブックマークは一覧に残っている
    const storeBookmark = useBookmarksStore.getState().bookmarks.find((b) => b.id === 'bm-4');
    expect(storeBookmark).toBeDefined();

    // エラーが lastMetaError に surface されている
    expect(useBookmarksStore.getState().lastMetaError).toBe('tag upsert failed');
  });
});
