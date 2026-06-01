/**
 * Tests for components/ViewToggle.tsx
 * Verifies: render (with Icon), onChange callbacks for grid/list.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { ViewToggle } from '../components/ViewToggle';

describe('ViewToggle', () => {
  it('renders without crashing (including Icon)', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<ViewToggle mode="grid" onChange={jest.fn()} />);
    });
    expect(tree!.toJSON()).not.toBeNull();
  });

  it('calls onChange("grid") when "Grid view" button is pressed', () => {
    const onChange = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<ViewToggle mode="list" onChange={onChange} />);
    });
    const gridBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Grid view',
    )[0];
    act(() => {
      gridBtn.props.onPress();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('calls onChange("list") when "List view" button is pressed', () => {
    const onChange = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<ViewToggle mode="grid" onChange={onChange} />);
    });
    const listBtn = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'List view',
    )[0];
    act(() => {
      listBtn.props.onPress();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('renders both "Grid view" and "List view" accessible buttons', () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<ViewToggle mode="grid" onChange={jest.fn()} />);
    });
    const gridBtns = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'Grid view',
    );
    const listBtns = tree!.root.findAll(
      (node) => node.props.accessibilityLabel === 'List view',
    );
    // findAll may return multiple fiber nodes for the same element at different tree levels
    expect(gridBtns.length).toBeGreaterThanOrEqual(1);
    expect(listBtns.length).toBeGreaterThanOrEqual(1);
  });
});
