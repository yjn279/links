/**
 * Tests for Forgot password link in app/(auth)/login.tsx
 *
 * Branches covered:
 *   (a) login screen renders "Forgot password?" link
 *   (b) pressing "Forgot password?" pushes /(auth)/forgot-password
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';

// NOTE: jest.mock is hoisted before variable declarations.
// Define all mock fns inside the factory; retrieve with jest.requireMock.
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

jest.mock('../src/auth/use-auth', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    loading: false,
    error: null,
    clearError: jest.fn(),
    session: null,
  }),
}));

jest.mock('../src/auth/store', () => ({
  useAuthStore: (selector: (s: { error: null }) => unknown) =>
    selector({ error: null }),
}));

import LoginScreen from '../app/(auth)/login';

const mockRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock; replace: jest.Mock } }).router;

const render = () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<LoginScreen />);
  });
  return tree;
};

/**
 * Recursively collect all Text node string values from the instance tree.
 * This avoids circular reference issues with JSON.stringify(props.children).
 */
function collectTextStrings(node: ReactTestInstance): string[] {
  const texts: string[] = [];
  if ((node.type as unknown) === 'Text') {
    const children = node.props.children;
    if (typeof children === 'string') {
      texts.push(children);
    } else if (Array.isArray(children)) {
      for (const c of children) {
        if (typeof c === 'string') texts.push(c);
      }
    }
  }
  for (const child of node.children ?? []) {
    if (typeof child !== 'string') {
      texts.push(...collectTextStrings(child as ReactTestInstance));
    } else {
      texts.push(child);
    }
  }
  return texts;
}

/**
 * Find the first node with onPress that contains the given text in its subtree.
 */
function findPressableContaining(root: ReactTestInstance, text: string): ReactTestInstance | null {
  const candidates = root.findAll((n) => typeof n.props?.onPress === 'function');
  for (const c of candidates) {
    const texts = collectTextStrings(c);
    if (texts.some((t) => t.includes(text))) {
      return c;
    }
  }
  return null;
}

describe('LoginScreen — Forgot password link', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
  });

  it('(a) renders "Forgot password?" text', () => {
    const tree = render();
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Forgot password?');
  });

  it('(b) pressing "Forgot password?" pushes /(auth)/forgot-password', () => {
    const tree = render();

    const forgotBtn = findPressableContaining(tree.root, 'Forgot password?');
    expect(forgotBtn).not.toBeNull();

    act(() => {
      forgotBtn!.props.onPress();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/forgot-password');
  });
});
