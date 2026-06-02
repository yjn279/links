/**
 * Integration tests for app/(app)/index.tsx — LibraryScreen
 *
 * Verifies:
 *   (a) List rendering — multiple bookmarks render as BookmarkCard (testID="bm-card")
 *       and the count label shows "N items".
 *   (b) Empty state — empty bookmarks array renders EmptyLibraryState with no-query text.
 *   (c) Search filter — querying by title/url reduces displayed cards; non-matching
 *       query shows EmptyLibraryState with "No links match" text.
 *   (d) Grid/List view toggle — width>=380 renders grid (ViewToggle present); tapping
 *       "List view" switches to list layout; width<380 always renders list (numColumns===1).
 *   (e) Loading state — loading=true with empty bookmarks renders "Loading...".
 *   (f) Error state — error string set renders "Something went wrong".
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import * as ReactNative from 'react-native';
import type { Bookmark } from '../src/types';

// ---------------------------------------------------------------------------
// Mocks
// Note: jest.mock factories may only reference variables prefixed with `mock`
// (case-insensitive) due to hoisting. We use module-scope `mock*` variables
// and mutate them per-test in beforeEach.
// ---------------------------------------------------------------------------

// react-native-safe-area-context (required by TopBar via useSafeAreaInsets)
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockPush },
}));

// src/bookmarks/store — selector-aware mock
// Variables named `mock*` can be referenced inside jest.mock factories.
let mockBookmarks: Bookmark[] = [];
let mockLoading = false;
let mockError: string | null = null;
const mockLoad = jest.fn();

jest.mock('../src/bookmarks/store', () => ({
  useBookmarksStore: (selector: (s: {
    bookmarks: Bookmark[];
    loading: boolean;
    error: string | null;
    load: () => void;
    tags: [];
  }) => unknown) =>
    selector({
      bookmarks: mockBookmarks,
      loading: mockLoading,
      error: mockError,
      load: mockLoad,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LibraryScreen', () => {
  let dimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    mockBookmarks = [];
    mockLoading = false;
    mockError = null;
    mockLoad.mockClear();
    mockPush.mockClear();
    mockSession = {
      access_token: 'tok',
      user: { id: 'u1', email: 'test@example.com' },
    };
    // Default: width >= 380 → numColumns = 2 (grid path)
    dimensionsSpy = jest
      .spyOn(ReactNative, 'useWindowDimensions')
      .mockReturnValue({ width: 390, height: 844, scale: 2, fontScale: 1 });
  });

  afterEach(() => {
    dimensionsSpy.mockRestore();
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
      // Verify each bookmark's title appears in the rendered output
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('First Bookmark');
      expect(json).toContain('Second Bookmark');
      expect(json).toContain('Third Bookmark');
      // At least one testID="bm-card" node exists per bookmark rendered
      const cards = tree.root.findAll(
        (node) => node.props.testID === 'bm-card',
      );
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('shows "N items" count label matching bookmark count', () => {
      mockBookmarks = [makeBookmark({ id: 'c1' }), makeBookmark({ id: 'c2' })];
      const tree = render();
      // `{filtered.length} items` renders as two adjacent children: [2, " items"]
      // Find the Text node that has children array containing the count and " items"
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
      // StatCard for "Total" renders bookmarks.length (3) as a Text node child
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
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('No bookmarks yet');
    });

    it('shows "0 items" count label when bookmarks is empty', () => {
      mockBookmarks = [];
      const tree = render();
      // `{filtered.length} items` renders children: [0, " items"]
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

      // Only "React Native guide" title matches "react" — verify via JSON
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('React Native guide');
      expect(json).not.toContain('Expo documentation');
      expect(json).not.toContain('TypeScript handbook');
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

      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('No links match');
    });
  });

  // -------------------------------------------------------------------------
  // (d) Grid/List view toggle
  // -------------------------------------------------------------------------
  describe('(d) grid/list view toggle', () => {
    it('renders ViewToggle with "Grid view" button when width >= 380', () => {
      // dimensionsSpy already returns width=390 from beforeEach
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

      // All cards still present after switching to list layout
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Alpha');
      expect(json).toContain('Beta');
    });

    it('width < 380 (numColumns===1): renders list path — all cards visible', () => {
      dimensionsSpy.mockReturnValue({ width: 375, height: 844, scale: 2, fontScale: 1 });
      mockBookmarks = [
        makeBookmark({ id: 'j1', title: 'Narrow1' }),
        makeBookmark({ id: 'j2', title: 'Narrow2' }),
      ];
      const tree = render();

      // numColumns===1 → grid guard fails → list path renders all cards
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Narrow1');
      expect(json).toContain('Narrow2');

      // ViewToggle is always rendered
      const gridBtns = tree.root.findAll(
        (node) => node.props.accessibilityLabel === 'Grid view',
      );
      expect(gridBtns.length).toBeGreaterThanOrEqual(1);
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
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Loading...');
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
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Something went wrong');
    });
  });
});
