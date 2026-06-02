/**
 * Tests for app/(app)/index.tsx — LibraryScreen (FlatList + infinite scroll)
 *
 * Scenarios covered:
 *   (a) List rendering — multiple bookmarks render as BookmarkCard (testID="bm-card")
 *       and the count label shows "N items".
 *   (b) Empty state — empty bookmarks array renders EmptyLibraryState.
 *   (c) Search filter — querying by title/url reduces displayed cards.
 *   (d) Grid/List view toggle — width>=380 renders grid; width<380 → numColumns===1.
 *   (e) Loading state — loading=true with empty bookmarks renders "Loading...".
 *   (f) Error state — error string set renders "Something went wrong".
 *   (g) FlatList pagination — onEndReached fires → store's loadMore is called.
 *   (h) Footer spinner — loadingMore=true renders spinner (testID="loading-more-spinner").
 *   (i) onEndReachedThreshold is set to 0.5.
 *   (j) load() called on mount when session present; skipped when null.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { Bookmark } from '../src/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockPush },
}));

// expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

// useWindowDimensions — module-level mock, width mutated per-test
let mockWidth = 390;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({ width: mockWidth, height: 844, scale: 2, fontScale: 1 }),
}));

// src/bookmarks/store — selector-aware mock with full pagination state
let mockBookmarks: Bookmark[] = [];
let mockLoading = false;
let mockLoadingMore = false;
let mockHasMore = true;
let mockError: string | null = null;
const mockLoad = jest.fn();
const mockLoadMore = jest.fn();

jest.mock('../src/bookmarks/store', () => ({
  useBookmarksStore: (selector: (s: {
    bookmarks: Bookmark[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    load: () => void;
    loadMore: () => void;
    tags: [];
  }) => unknown) =>
    selector({
      bookmarks: mockBookmarks,
      loading: mockLoading,
      loadingMore: mockLoadingMore,
      hasMore: mockHasMore,
      error: mockError,
      load: mockLoad,
      loadMore: mockLoadMore,
      tags: [],
    }),
}));

// src/auth/use-auth
let mockSession: { access_token: string; user: { id: string; email: string | undefined } } | null = {
  access_token: 'tok',
  user: { id: 'u1', email: 'test@example.com' },
};

jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => ({ session: mockSession }),
}));

// Import AFTER all jest.mock calls
import LibraryScreen from '../app/(app)/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    url: 'https://example.com',
    title: 'Example Title',
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

function render() {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<LibraryScreen />);
  });
  return tree;
}

// Helper: find a node by testID in the rendered tree JSON
function findByTestID(tree: ReturnType<typeof create>, testID: string): boolean {
  const json = tree.toJSON();
  const search = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false;
    const n = node as { props?: { testID?: string }; children?: unknown[] };
    if (n.props?.testID === testID) return true;
    if (Array.isArray(n.children)) {
      return n.children.some((child) => search(child));
    }
    return false;
  };
  if (Array.isArray(json)) return json.some((node) => search(node));
  return search(json);
}

// Recursively search for text in the rendered tree (avoids JSON.stringify circular ref issue)
function containsText(node: unknown, text: string): boolean {
  if (typeof node === 'string') return node.includes(text);
  if (!node || typeof node !== 'object') return false;
  const n = node as { props?: { children?: unknown }; children?: unknown[] };
  const children = (n as { children?: unknown[] }).children ?? [];
  if (Array.isArray(children)) {
    return children.some((child) => containsText(child, text));
  }
  if (n.props?.children !== undefined) {
    return containsText(n.props.children, text);
  }
  return false;
}

function treeContainsText(tree: ReturnType<typeof create>, text: string): boolean {
  const json = tree.toJSON();
  if (Array.isArray(json)) return json.some((node) => containsText(node, text));
  return containsText(json, text);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookmarks = [];
    mockLoading = false;
    mockLoadingMore = false;
    mockHasMore = true;
    mockError = null;
    mockWidth = 390;
    mockSession = {
      access_token: 'tok',
      user: { id: 'u1', email: 'test@example.com' },
    };
  });

  // -------------------------------------------------------------------------
  // (a) List rendering
  // -------------------------------------------------------------------------
  describe('(a) list rendering', () => {
    it('renders a BookmarkCard for each bookmark', () => {
      mockBookmarks = [
        makeBookmark({ id: 'b1', title: 'First Bookmark' }),
        makeBookmark({ id: 'b2', title: 'Second Bookmark' }),
        makeBookmark({ id: 'b3', title: 'Third Bookmark' }),
      ];
      const tree = render();
      expect(treeContainsText(tree, 'First Bookmark')).toBe(true);
      expect(treeContainsText(tree, 'Second Bookmark')).toBe(true);
      expect(treeContainsText(tree, 'Third Bookmark')).toBe(true);
      const cards = tree.root.findAll(
        (node) => node.props.testID === 'bm-card',
      );
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('shows "N items" count label matching bookmark count', () => {
      mockBookmarks = [makeBookmark({ id: 'c1' }), makeBookmark({ id: 'c2' })];
      const tree = render();
      const countText = tree.root.findAll(
        (node) =>
          String(node.type) === 'Text' &&
          Array.isArray(node.props.children) &&
          node.props.children[0] === 2 &&
          node.props.children[1] === ' items',
      );
      expect(countText.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Total stat value equal to bookmark count', () => {
      mockBookmarks = [
        makeBookmark({ id: 'd1' }),
        makeBookmark({ id: 'd2' }),
        makeBookmark({ id: 'd3' }),
      ];
      const tree = render();
      const allTexts = tree.root.findAll(
        (node) => String(node.type) === 'Text' && node.props.children === 3,
      );
      expect(allTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // (b) Empty state
  // -------------------------------------------------------------------------
  describe('(b) empty state', () => {
    it('renders EmptyLibraryState "No bookmarks yet" when bookmarks is empty', () => {
      mockBookmarks = [];
      const tree = render();
      expect(treeContainsText(tree, 'No bookmarks yet')).toBe(true);
    });

    it('shows "0 items" count label when bookmarks is empty', () => {
      mockBookmarks = [];
      const tree = render();
      const countText = tree.root.findAll(
        (node) =>
          String(node.type) === 'Text' &&
          Array.isArray(node.props.children) &&
          node.props.children[0] === 0 &&
          node.props.children[1] === ' items',
      );
      expect(countText.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // (c) Search filter
  // -------------------------------------------------------------------------
  describe('(c) search filter', () => {
    it('reduces displayed cards to those matching the query', () => {
      mockBookmarks = [
        makeBookmark({ id: 'f1', title: 'React Native guide', url: 'https://reactnative.dev' }),
        makeBookmark({ id: 'f2', title: 'Expo documentation', url: 'https://expo.dev' }),
        makeBookmark({ id: 'f3', title: 'TypeScript handbook', url: 'https://typescriptlang.org' }),
      ];
      const tree = render();

      const input = tree.root.findAll(
        (node) => node.props.placeholder === 'Search link',
      )[0];
      act(() => {
        input.props.onChangeText('react');
      });

      expect(treeContainsText(tree, 'React Native guide')).toBe(true);
      expect(treeContainsText(tree, 'Expo documentation')).toBe(false);
      expect(treeContainsText(tree, 'TypeScript handbook')).toBe(false);
    });

    it('shows EmptyLibraryState with "No links match" when query has no matches', () => {
      mockBookmarks = [
        makeBookmark({ id: 'g1', title: 'Expo docs', url: 'https://expo.dev' }),
      ];
      const tree = render();

      const input = tree.root.findAll(
        (node) => node.props.placeholder === 'Search link',
      )[0];
      act(() => {
        input.props.onChangeText('zzznomatch');
      });

      expect(treeContainsText(tree, 'No links match')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // (d) Grid/List view toggle
  // -------------------------------------------------------------------------
  describe('(d) grid/list view toggle', () => {
    it('renders ViewToggle with "Grid view" button when width >= 380', () => {
      mockWidth = 390;
      mockBookmarks = [makeBookmark({ id: 'h1' })];
      const tree = render();
      const gridBtns = tree.root.findAll(
        (node) => node.props.accessibilityLabel === 'Grid view',
      );
      expect(gridBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('switching to list view via ViewToggle keeps all cards visible', () => {
      mockBookmarks = [
        makeBookmark({ id: 'i1', title: 'Alpha' }),
        makeBookmark({ id: 'i2', title: 'Beta' }),
      ];
      const tree = render();

      const listBtn = tree.root.findAll(
        (node) => node.props.accessibilityLabel === 'List view',
      )[0];
      act(() => {
        listBtn.props.onPress();
      });

      expect(treeContainsText(tree, 'Alpha')).toBe(true);
      expect(treeContainsText(tree, 'Beta')).toBe(true);
    });

    it('width < 380 → numColumns===1', () => {
      mockWidth = 320;
      const tree = render();
      const flatList = tree.root.findByType(
        require('react-native').FlatList,
      );
      expect(flatList.props.numColumns).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // (e) Loading state
  // -------------------------------------------------------------------------
  describe('(e) loading state', () => {
    it('shows "Loading..." when loading=true and bookmarks is empty', () => {
      mockLoading = true;
      mockBookmarks = [];
      const tree = render();
      expect(treeContainsText(tree, 'Loading...')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // (f) Error state
  // -------------------------------------------------------------------------
  describe('(f) error state', () => {
    it('shows "Something went wrong" when error is set', () => {
      mockError = 'Network error';
      mockBookmarks = [];
      const tree = render();
      expect(treeContainsText(tree, 'Something went wrong')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // (g) FlatList pagination — onEndReached
  // -------------------------------------------------------------------------
  describe('(g) FlatList pagination', () => {
    it('onEndReached triggers loadMore from the store', () => {
      mockBookmarks = [makeBookmark({ id: 'bk1', title: 'Test' })];

      const tree = render();
      const flatList = tree.root.findByType(
        require('react-native').FlatList,
      );
      act(() => {
        flatList.props.onEndReached?.({ distanceFromEnd: 100 });
      });

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('FlatList numColumns is 2 in grid mode with width >= 380', () => {
      mockWidth = 390;
      const tree = render();
      const flatList = tree.root.findByType(
        require('react-native').FlatList,
      );
      expect(flatList.props.numColumns).toBe(2);
    });

    it('FlatList numColumns is 1 with width < 380', () => {
      mockWidth = 320;
      const tree = render();
      const flatList = tree.root.findByType(
        require('react-native').FlatList,
      );
      expect(flatList.props.numColumns).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // (h) Footer spinner
  // -------------------------------------------------------------------------
  describe('(h) footer spinner', () => {
    it('renders footer spinner (testID="loading-more-spinner") when loadingMore is true', () => {
      mockLoadingMore = true;
      const tree = render();
      expect(findByTestID(tree, 'loading-more-spinner')).toBe(true);
    });

    it('does not render footer spinner when loadingMore is false', () => {
      mockLoadingMore = false;
      const tree = render();
      expect(findByTestID(tree, 'loading-more-spinner')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // (i) onEndReachedThreshold
  // -------------------------------------------------------------------------
  it('onEndReachedThreshold is 0.5', () => {
    const tree = render();
    const flatList = tree.root.findByType(
      require('react-native').FlatList,
    );
    expect(flatList.props.onEndReachedThreshold).toBe(0.5);
  });

  // -------------------------------------------------------------------------
  // (j) load() on mount
  // -------------------------------------------------------------------------
  describe('(j) load() on mount', () => {
    it('calls load() on mount when session is present', () => {
      render();
      expect(mockLoad).toHaveBeenCalledTimes(1);
    });

    it('does not call load() when session is null', () => {
      mockSession = null;
      render();
      expect(mockLoad).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Loading/Error screen: no FlatList rendered
  // -------------------------------------------------------------------------
  describe('early returns (loading/error screen)', () => {
    it('renders loading screen (no FlatList) when loading=true and bookmarks is empty', () => {
      mockLoading = true;
      mockBookmarks = [];
      const tree = render();
      expect(tree.root.findAllByType(require('react-native').FlatList)).toHaveLength(0);
    });

    it('renders error screen (no FlatList) when error is set', () => {
      mockError = 'Something failed';
      const tree = render();
      expect(tree.root.findAllByType(require('react-native').FlatList)).toHaveLength(0);
    });
  });
});
