/**
 * Tests for components/StatCard.tsx
 * Verifies: render, value display, label uppercasing, delta conditional rendering.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { StatCard } from '../components/StatCard';

describe('StatCard', () => {
  it('renders without crashing', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="total" value={42} />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('displays the numeric value', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="total" value={99} />);
    });
    const json = tree!.toJSON();
    const text = JSON.stringify(json);
    expect(text).toContain('99');
  });

  it('displays a string value', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="score" value="N/A" />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('N/A');
  });

  it('uppercases the label', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="links" value={0} />);
    });
    // StatCard.tsx:21 applies label.toUpperCase()
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('LINKS');
  });

  it('renders delta text when delta prop is provided', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="total" value={10} delta="+3 this week" />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).toContain('+3 this week');
  });

  it('does not render delta text when delta prop is omitted', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StatCard label="total" value={10} />);
    });
    const text = JSON.stringify(tree!.toJSON());
    expect(text).not.toContain('this week');
  });
});
