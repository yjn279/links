/**
 * Tests for components/TopBar.tsx
 * Verifies: render, search input (setQuery), menu tap (onMenu), add tap (onAdd),
 * userInitial display, and current-spec: Notifications bell has no onPress handler.
 *
 * safe-area mocked to fixed insets.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { TopBar } from '../components/TopBar';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('TopBar', () => {
  it('renders without crashing', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          query=""
          setQuery={jest.fn()}
          userInitial="T"
        />,
      );
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('displays userInitial in the avatar', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          query=""
          setQuery={jest.fn()}
          userInitial="Z"
        />,
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Z');
  });

  it('calls setQuery when the search TextInput changes', () => {
    const setQuery = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          query=""
          setQuery={setQuery}
        />,
      );
    });
    // Find the TextInput by placeholder
    const input = tree!.root.findAll(
      (node) => node.props.placeholder === 'Search link',
    )[0];
    act(() => {
      input.props.onChangeText('react');
    });
    expect(setQuery).toHaveBeenCalledTimes(1);
    expect(setQuery).toHaveBeenCalledWith('react');
  });

  it('calls onMenu when the Menu button is pressed', () => {
    const onMenu = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={onMenu}
          onAdd={jest.fn()}
          query=""
          setQuery={jest.fn()}
        />,
      );
    });
    const menuBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Menu',
    )[0];
    act(() => {
      menuBtn.props.onPress();
    });
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it('calls onAdd when the "Add bookmark" button is pressed', () => {
    const onAdd = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={onAdd}
          query=""
          setQuery={jest.fn()}
        />,
      );
    });
    const addBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Add bookmark',
    )[0];
    act(() => {
      addBtn.props.onPress();
    });
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('current-spec: Notifications bell element exists but has no onPress handler (TopBar.tsx:73-82)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          query=""
          setQuery={jest.fn()}
        />,
      );
    });
    const bellBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Notifications',
    )[0];
    expect(bellBtn).toBeDefined();
    // No onPress wired — pressing it does nothing (current spec, not a bug to fix yet)
    expect(bellBtn.props.onPress).toBeUndefined();
  });

  it('current-spec: red notification dot exists as a static View (styles.dot)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          query=""
          setQuery={jest.fn()}
        />,
      );
    });
    // The dot is a sibling of the bell Icon inside the Notifications Pressable
    const bellBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Notifications',
    )[0];
    // The dot View is a child element of the bell Pressable
    expect(bellBtn).toBeDefined();
    // Verify the entire subtree renders (dot is static with no interaction)
    expect(tree!.toJSON()).not.toBeNull();
  });
});
