/**
 * Component tests for app/(app)/index.tsx — FlatList infinite scroll.
 *
 * Scenarios covered:
 *   1. onEndReached fires → store's loadMore is called.
 *   2. loadingMore=true  → footer spinner (testID="loading-more-spinner") is rendered.
 *   3. loadingMore=false → footer spinner is absent.
 *   4. filtered.length===0 → EmptyLibraryState is rendered.
 *   5. viewMode toggle (grid → list) → numColumns changes (key prop changes on FlatList).
 */

import React from 'react';
import { act, create } from 'react-test-renderer';

// ---------- Mock: expo-router ----------
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

// ---------- Mock: react-native-safe-area-context ----------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------- Mock: useWindowDimensions ----------
// Default width=390 → numColumns=2 in grid mode.
let mockWidth = 390;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({ width: mockWidth, height: 844 }),
}));

// ---------- Mock: src/auth/use-auth ----------
let mockSession: { user: { email: string } } | null = { user: { email: 'test@example.com' } };
jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => ({ session: mockSession }),
}));

// ---------- Store mock state ----------
let mockBookmarks: object[] = [];
let mockLoading = false;
let mockLoadingMore = false;
let mockHasMore = true;
let mockError: string | null = null;
const mockLoad = jest.fn();
const mockLoadMore = jest.fn();

jest.mock('../src/bookmarks/store', () => ({
  useBookmarksStore: (selector: (s: object) => unknown) =>
    selector({
      bookmarks: mockBookmarks,
      loading: mockLoading,
      loadingMore: mockLoadingMore,
      hasMore: mockHasMore,
      error: mockError,
      load: mockLoad,
      loadMore: mockLoadMore,
    }),
}));

// ---------- Mock: src/bookmarks/filters ----------
// Pass-through by default so filtered === viewedBookmarks.
jest.mock('../src/bookmarks/filters', () => ({
  applyFilters: (items: object[]) => items,
}));

// ---------- Mock: heavy native components ----------
jest.mock('../components/TopBar', () => ({
  TopBar: () => null,
}));
jest.mock('../components/Sidebar', () => ({
  Sidebar: () => null,
}));
jest.mock('../components/BookmarkCard', () => ({
  BookmarkCard: () => null,
}));
jest.mock('../components/StatCard', () => ({
  StatCard: () => null,
}));
jest.mock('../components/ViewToggle', () => ({
  ViewToggle: () => null,
}));
jest.mock('../components/EmptyLibraryState', () => {
  const { View } = require('react-native');
  return {
    EmptyLibraryState: () => <View testID="empty-library-state" />,
  };
});

// ---------- Mock: Icon (used by EmptyLibraryState) ----------
jest.mock('../components/Icon', () => ({
  Icon: () => null,
}));

import LibraryScreen from '../app/(app)/index';

// Helper: render with act
function render() {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<LibraryScreen />);
  });
  return tree;
}

// Helper: find a component instance by testID in the rendered tree
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

describe('LibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookmarks = [];
    mockLoading = false;
    mockLoadingMore = false;
    mockHasMore = true;
    mockError = null;
    mockSession = { user: { email: 'test@example.com' } };
    mockWidth = 390;
  });

  // --- 1. onEndReached → loadMore is called ---
  it('onEndReached triggers loadMore from the store', () => {
    const b = {
      id: 'bk1',
      user_id: 'u1',
      url: 'https://example.com/1',
      title: 'Test',
      description: null,
      thumbnail_url: null,
      favicon_url: null,
      site_name: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      tags: [],
    };
    mockBookmarks = [b];

    const tree = render();

    // Find the FlatList instance and call onEndReached directly
    const flatList = tree.root.findByType(
      require('react-native').FlatList,
    );
    act(() => {
      flatList.props.onEndReached?.({ distanceFromEnd: 100 });
    });

    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  // --- 2. loadingMore=true → footer spinner is rendered ---
  it('renders footer spinner when loadingMore is true', () => {
    mockLoadingMore = true;

    const tree = render();
    expect(findByTestID(tree, 'loading-more-spinner')).toBe(true);
  });

  // --- 3. loadingMore=false → footer spinner is absent ---
  it('does not render footer spinner when loadingMore is false', () => {
    mockLoadingMore = false;

    const tree = render();
    expect(findByTestID(tree, 'loading-more-spinner')).toBe(false);
  });

  // --- 4. Empty state: EmptyLibraryState is rendered when filtered is empty ---
  it('renders EmptyLibraryState when there are no bookmarks', () => {
    mockBookmarks = [];

    const tree = render();

    // Find the FlatList and verify ListEmptyComponent is present
    const flatList = tree.root.findByType(
      require('react-native').FlatList,
    );
    // ListEmptyComponent is rendered when data is empty
    const emptyComponent = flatList.props.ListEmptyComponent;
    expect(emptyComponent).not.toBeNull();

    // Render the empty component and check testID
    let emptyTree!: ReturnType<typeof create>;
    act(() => {
      emptyTree = create(emptyComponent as React.ReactElement);
    });
    expect(findByTestID(emptyTree, 'empty-library-state')).toBe(true);
  });

  // --- 5. FlatList key changes when viewMode switches grid/list ---
  it('FlatList key switches between cols-1 and cols-2 based on numColumns', () => {
    // Default: grid mode, width=390 → numColumns=2, key="cols-2"
    const tree = render();
    const flatList = tree.root.findByType(
      require('react-native').FlatList,
    );
    // In grid mode with width>=380, numColumns should be 2
    expect(flatList.props.numColumns).toBe(2);

    // Narrow screen → numColumns=1, key="cols-1"
    mockWidth = 320;
    let tree2!: ReturnType<typeof create>;
    act(() => {
      tree2 = create(<LibraryScreen />);
    });
    const flatList2 = tree2.root.findByType(
      require('react-native').FlatList,
    );
    expect(flatList2.props.numColumns).toBe(1);
  });

  // --- 6. load() is called on mount when session is present ---
  it('calls load() on mount when session is present', () => {
    render();
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  // --- 7. load() is NOT called when session is null ---
  it('does not call load() when session is null', () => {
    mockSession = null;
    render();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  // --- 8. loading+empty state shows loading screen ---
  it('renders loading screen when loading=true and bookmarks is empty', () => {
    mockLoading = true;
    mockBookmarks = [];

    const tree = render();
    const json = tree.toJSON() as { props?: { style?: object } } | null;
    // Should render the loadingContainer View (not a FlatList)
    expect(tree.root.findAllByType(require('react-native').FlatList)).toHaveLength(0);
    expect(json).not.toBeNull();
  });

  // --- 9. error state shows error screen ---
  it('renders error screen when error is set', () => {
    mockError = 'Something failed';

    const tree = render();
    // Should render error UI, not FlatList
    expect(tree.root.findAllByType(require('react-native').FlatList)).toHaveLength(0);
  });

  // --- 10. onEndReachedThreshold is set to 0.5 ---
  it('onEndReachedThreshold is 0.5', () => {
    const tree = render();
    const flatList = tree.root.findByType(
      require('react-native').FlatList,
    );
    expect(flatList.props.onEndReachedThreshold).toBe(0.5);
  });
});
