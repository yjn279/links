/**
 * Tests for components/Sidebar.tsx
 * Verifies: render (open=true), brand text, nav items + counts, nav select calls
 * onSelect+onClose, Collections item select, Close menu button, and current-spec:
 * Settings item calls onSettings and onClose when pressed (#33).
 *
 * Animated.timing callbacks (setScrimVisible) are driven with jest.useFakeTimers().
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { Sidebar } from '../components/Sidebar';

const makeStats = () => ({
  total: { n: 120, delta: '+5' },
  recent: { n: 10 },
  favorites: { n: 8 },
  trending: { n: 3 },
});

/** Find a Pressable whose rendered JSON string contains the given label text. */
function findPressableByText(
  tree: ReturnType<typeof create>,
  text: string,
): ReactTestInstance | undefined {
  const pressables = tree.root.findAll((node) => node.props.onPress !== undefined);
  return pressables.find((node) => {
    const str = JSON.stringify(tree.toJSON());
    // Narrow to the subtree: collect all Text children recursively
    const texts: string[] = [];
    const collect = (n: ReactTestInstance) => {
      if (typeof n === 'string') return;
      if (n.children) {
        n.children.forEach((child) => {
          if (typeof child === 'string') texts.push(child);
          else collect(child as ReactTestInstance);
        });
      }
    };
    collect(node);
    void str; // suppress unused-var warning
    return texts.includes(text);
  });
}

describe('Sidebar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing when open=true', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={jest.fn()}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('displays brand name "Links"', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={jest.fn()}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Links');
  });

  it('displays nav items: All Links, Recent, Favorites, Trending', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={jest.fn()}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('All Links');
    expect(json).toContain('Recent');
    expect(json).toContain('Favorites');
    expect(json).toContain('Trending');
  });

  it('displays stats counts in nav items (Sidebar.tsx:132-135)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={jest.fn()}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('120');
    expect(json).toContain('10');
    expect(json).toContain('8');
    expect(json).toContain('3');
  });

  it('calls onSelect("recent") and onClose when "Recent" NavItem is pressed (Sidebar.tsx:59-62)', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={onSelect}
          onClose={onClose}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const recentPressable = findPressableByText(tree!, 'Recent');
    expect(recentPressable).toBeDefined();
    act(() => {
      recentPressable!.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('recent');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect("favorites") and onClose when "Favorites" NavItem is pressed', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={onSelect}
          onClose={onClose}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const favPressable = findPressableByText(tree!, 'Favorites');
    expect(favPressable).toBeDefined();
    act(() => {
      favPressable!.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('favorites');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSelect("col:tech") and onClose when "Technology" Collections item is pressed (Sidebar.tsx:147)', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={onSelect}
          onClose={onClose}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const techPressable = findPressableByText(tree!, 'Technology');
    expect(techPressable).toBeDefined();
    act(() => {
      techPressable!.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('col:tech');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the Close menu button is pressed (accessibilityLabel="Close menu")', () => {
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={onClose}
          onSettings={jest.fn()}
          stats={makeStats()}
        />,
      );
    });
    const closeBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Close menu',
    )[0];
    act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Settings item is present and calls onSettings when pressed (Sidebar.tsx:156-161)', () => {
    const onSettings = jest.fn();
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={onClose}
          onSettings={onSettings}
          stats={makeStats()}
        />,
      );
    });
    // Settings Pressable has onPress wired to onSettings + onClose
    const settingsPressable = findPressableByText(tree!, 'Settings');
    expect(settingsPressable).toBeDefined();
    act(() => {
      settingsPressable!.props.onPress();
    });
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });
});
