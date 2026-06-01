/**
 * Tests for components/BookmarkCard.tsx (+ SiteThumb)
 * Verifies: render, title display (with url fallback), card tap -> onOpen,
 * star tap -> onToggleFav, favorite prop controls star icon name.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { BookmarkCard } from '../components/BookmarkCard';
import type { Bookmark } from '../src/types';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 'bm-1',
    user_id: 'user-1',
    url: 'https://example.com/article',
    title: 'Example Article',
    description: null,
    thumbnail_url: null,
    favicon_url: null,
    site_name: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  };
}

describe('BookmarkCard', () => {
  it('renders without crashing', () => {
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={jest.fn()}
        />,
      );
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('displays the bookmark title when title is set', () => {
    const bookmark = makeBookmark({ title: 'My Test Title' });
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
        />,
      );
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('My Test Title');
  });

  it('falls back to url when title is null (BookmarkCard.tsx:48-50)', () => {
    const bookmark = makeBookmark({ title: null, url: 'https://fallback-url.com' });
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
        />,
      );
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('https://fallback-url.com');
  });

  it('calls onOpen with the bookmark when the card (testID="bm-card") is pressed', () => {
    const onOpen = jest.fn();
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={onOpen}
        />,
      );
    });
    const card = tree!.root.findAll((node) => node.props.testID === 'bm-card')[0];
    act(() => {
      card.props.onPress();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(bookmark);
  });

  it('calls onToggleFav with bookmark.id when star (accessibilityLabel="Favorite") is pressed', () => {
    const onToggleFav = jest.fn();
    const bookmark = makeBookmark({ id: 'bm-42' });
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={onToggleFav}
          onOpen={jest.fn()}
        />,
      );
    });
    const starBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Favorite',
    )[0];
    act(() => {
      starBtn.props.onPress({ stopPropagation: jest.fn() });
    });
    expect(onToggleFav).toHaveBeenCalledTimes(1);
    expect(onToggleFav).toHaveBeenCalledWith('bm-42');
  });

  it('shows accessibilityLabel="Unfavorite" when favorite=true', () => {
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={true}
          onToggleFav={jest.fn()}
          onOpen={jest.fn()}
        />,
      );
    });
    // findAll returns fiber nodes at multiple levels; presence of >= 1 is sufficient
    const starBtns = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Unfavorite',
    );
    expect(starBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows accessibilityLabel="Favorite" when favorite=false', () => {
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={jest.fn()}
        />,
      );
    });
    const starBtns = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Favorite',
    );
    expect(starBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('renders star-fill icon when favorite=true (SiteThumb.tsx:58)', () => {
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={true}
          onToggleFav={jest.fn()}
          onOpen={jest.fn()}
        />,
      );
    });
    // Icon component receives name prop; find node with name="star-fill"
    const starFillIcons = tree!.root.findAll(
      (node) => node.props.name === 'star-fill',
    );
    expect(starFillIcons.length).toBeGreaterThan(0);
  });

  it('renders star icon (not star-fill) when favorite=false (SiteThumb.tsx:58)', () => {
    const bookmark = makeBookmark();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BookmarkCard
          bookmark={bookmark}
          favorite={false}
          onToggleFav={jest.fn()}
          onOpen={jest.fn()}
        />,
      );
    });
    const starIcons = tree!.root.findAll(
      (node) => node.props.name === 'star',
    );
    const starFillIcons = tree!.root.findAll(
      (node) => node.props.name === 'star-fill',
    );
    expect(starIcons.length).toBeGreaterThan(0);
    expect(starFillIcons).toHaveLength(0);
  });
});
