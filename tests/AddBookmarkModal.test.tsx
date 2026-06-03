/**
 * Tests for components/AddBookmarkModal.tsx
 * Verifies: render (open=true/false), defaultUrl display, Save calls onSave(trimmed),
 * empty/whitespace input disables Save, Cancel/Close buttons call onClose.
 *
 * jest.useFakeTimers() to handle inputRef.current?.focus() setTimeout (AddBookmarkModal.tsx:44)
 * and Animated.parallel callbacks (setVisible).
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { AddBookmarkModal } from '../components/AddBookmarkModal';

/** Find the first Pressable (with onPress) whose text children include the given label. */
function findPressableByText(
  tree: ReturnType<typeof create>,
  text: string,
): ReactTestInstance | undefined {
  const pressables = tree.root.findAll((node) => node.props.onPress !== undefined);
  return pressables.find((node) => {
    const texts: string[] = [];
    const collect = (n: ReactTestInstance) => {
      if (n.children) {
        n.children.forEach((child) => {
          if (typeof child === 'string') texts.push(child);
          else collect(child as ReactTestInstance);
        });
      }
    };
    collect(node);
    return texts.includes(text);
  });
}

describe('AddBookmarkModal', () => {
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
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={jest.fn()}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('returns null when open=false (visible=false, AddBookmarkModal.tsx:71)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={false}
          onClose={jest.fn()}
          onSave={jest.fn()}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    // open=false from the start: visible initialises to false => returns null
    expect(tree!.toJSON()).toBeNull();
  });

  it('displays title "Add Bookmark"', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={jest.fn()}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain('Add Bookmark');
  });

  it('shows defaultUrl as the initial TextInput value (AddBookmarkModal.tsx:30,38)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={jest.fn()}
          defaultUrl="https://default.example.com"
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    const inputs = tree!.root.findAll(
      (node) => node.props.value === 'https://default.example.com',
    );
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('calls onSave with trimmed URL and empty tag array when Save is pressed with a valid URL (AddBookmarkModal.tsx:62-66)', () => {
    const onSave = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={onSave}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    // Type a URL into the TextInput
    const input = tree!.root.findAll(
      (node) => node.props.placeholder === 'https://…',
    )[0];
    act(() => {
      input.props.onChangeText('  https://trimmed.example.com  ');
    });
    const saveBtn = findPressableByText(tree!, 'Save');
    expect(saveBtn).toBeDefined();
    act(() => {
      saveBtn!.props.onPress();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    // onSave signature is (url: string, tagNames: string[]) — no tags selected => empty array
    expect(onSave).toHaveBeenCalledWith('https://trimmed.example.com', []);
  });

  it('does NOT call onSave when Save is pressed with an empty URL (AddBookmarkModal.tsx:63-64)', () => {
    const onSave = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={onSave}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    // url starts as '' — Save button is disabled (onPress still fires handleSave,
    // which returns early when trimmed is empty)
    const saveBtn = findPressableByText(tree!, 'Save');
    expect(saveBtn).toBeDefined();
    act(() => {
      saveBtn!.props.onPress();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does NOT call onSave when Save is pressed with whitespace-only URL (AddBookmarkModal.tsx:63)', () => {
    const onSave = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={jest.fn()}
          onSave={onSave}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    const input = tree!.root.findAll(
      (node) => node.props.placeholder === 'https://…',
    )[0];
    act(() => {
      input.props.onChangeText('   ');
    });
    const saveBtn = findPressableByText(tree!, 'Save');
    act(() => {
      saveBtn!.props.onPress();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is pressed (AddBookmarkModal.tsx:126)', () => {
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={onClose}
          onSave={jest.fn()}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    const cancelBtn = findPressableByText(tree!, 'Cancel');
    expect(cancelBtn).toBeDefined();
    act(() => {
      cancelBtn!.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Close button (accessibilityLabel="Close") is pressed (AddBookmarkModal.tsx:91)', () => {
    const onClose = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <AddBookmarkModal
          open={true}
          onClose={onClose}
          onSave={jest.fn()}
          existingTags={[]}
        />,
      );
      jest.runAllTimers();
    });
    const closeBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Close',
    )[0];
    expect(closeBtn).toBeDefined();
    act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
