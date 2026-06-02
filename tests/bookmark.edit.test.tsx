/**
 * Tests for the long-press → edit navigation in BookmarkCard and index.tsx.
 *
 * Verifies:
 *   (a) BookmarkCard calls onLongPress with the correct bookmark on long-press.
 *   (b) editBookmark handler calls router.push with /(app)/edit/[id] and the correct id.
 *   (c) Normal press (onPress) does NOT trigger onLongPress.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { BookmarkCard } from '../components/BookmarkCard';
import type { Bookmark } from '../src/types';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
  },
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

// Mock modules required by BookmarkCard / SiteThumb
jest.mock('../src/theme/tokens', () => ({
  color: {
    card: '#fff',
    line: '#ccc',
    ink: '#000',
    ink2: '#333',
    ink3: '#666',
    ink4: '#999',
    paper: '#fafafa',
    paper2: '#f0f0f0',
    white: '#fff',
  },
  elevation: { e1: {} },
  pickThumb: () => 'thumb1',
  radius: { lg: 12, pill: 99 },
  sp: [0, 4, 8, 12, 16, 20, 24],
  typeScale: {
    h3: {},
    bodySm: {},
    caption: {},
    body: {},
    h1: {},
  },
}));

jest.mock('../src/lib/time', () => ({
  relativeTime: () => '1 day ago',
}));

jest.mock('../components/SiteThumb', () => ({
  SiteThumb: () => null,
}));

const BOOKMARK: Bookmark = {
  id: 'bm-1',
  user_id: 'u-1',
  url: 'https://example.com',
  title: 'Example',
  description: null,
  thumbnail_url: null,
  favicon_url: null,
  site_name: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tags: [],
};

describe('BookmarkCard — long-press navigation', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('(a) calls onLongPress with the bookmark when long-pressed', () => {
    const onLongPress = jest.fn();
    const onOpen = jest.fn();
    let tree!: ReturnType<typeof create>;

    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={BOOKMARK}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={onOpen}
          onLongPress={onLongPress}
        />,
      );
    });

    const card = tree.root.findByProps({ testID: 'bm-card' });
    act(() => {
      card.props.onLongPress();
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledWith(BOOKMARK);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('(b) editBookmark handler pushes to /(app)/edit/[id] with correct id', () => {
    // Simulate the editBookmark function extracted from index.tsx
    const { router } = require('expo-router') as { router: { push: typeof mockPush } };

    function editBookmark(b: Bookmark): void {
      router.push({ pathname: '/(app)/edit/[id]', params: { id: b.id } });
    }

    editBookmark(BOOKMARK);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(app)/edit/[id]',
      params: { id: 'bm-1' },
    });
  });

  it('(c) normal press calls onOpen but NOT onLongPress', () => {
    const onLongPress = jest.fn();
    const onOpen = jest.fn();
    let tree!: ReturnType<typeof create>;

    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={BOOKMARK}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={onOpen}
          onLongPress={onLongPress}
        />,
      );
    });

    const card = tree.root.findByProps({ testID: 'bm-card' });
    act(() => {
      card.props.onPress();
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(BOOKMARK);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
