/**
 * Tests for components/EmptyLibraryState.tsx
 * Verifies: render, no-query state shows "No bookmarks yet" + hint,
 * query-present state shows query string in "No links match …".
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { EmptyLibraryState } from '../components/EmptyLibraryState';

describe('EmptyLibraryState', () => {
  it('renders without crashing', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('shows "No bookmarks yet" when query is not provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('No bookmarks yet');
  });

  it('shows the hint text when query is not provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('Tap the + button to add your first URL.');
  });

  it('does not show "No bookmarks yet" when query is provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState query="react" />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).not.toContain('No bookmarks yet');
  });

  it('shows query string in message when query is provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState query="react hooks" />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('react hooks');
  });

  it('shows "No links match" prefix when query is provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<EmptyLibraryState query="anything" />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('No links match');
  });
});
