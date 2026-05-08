/**
 * Component tests for app/shareintent.tsx — imperative router.replace
 * pattern with timeout fallback. The route always returns null and navigates
 * via router.replace in a useEffect, gated by a navigatedRef so we fire
 * exactly once even if the component re-renders.
 *
 * Branches covered:
 *   (a) URL shared + logged in  → router.replace('/(app)/add', { url })
 *   (b) URL shared + logged out → router.replace('/(auth)/login', { pendingUrl })
 *   (c) Cold-start: no URL yet → wait until shareIntent arrives, then (a)/(b)
 *   (d-1) No URL + session  → after timeout: router.replace('/(app)')
 *   (d-2) No URL + no session → after timeout: router.replace('/(auth)/login')
 *   (e) navigatedRef gate: only fires once even on re-render after reset
 */

import React from 'react';
import { act, create } from 'react-test-renderer';

let mockShareIntent: { webUrl?: string | null } | null = null;
const mockResetShareIntent = jest.fn();

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: () => ({
    shareIntent: mockShareIntent,
    hasShareIntent: !!mockShareIntent?.webUrl,
    resetShareIntent: mockResetShareIntent,
    error: null,
    isReady: true,
  }),
}));

const replaceCalls: {
  pathname: string;
  params: Record<string, string> | undefined;
}[] = [];

jest.mock('expo-router', () => ({
  router: {
    replace: (
      arg: string | { pathname: string; params?: Record<string, string> },
    ) => {
      if (typeof arg === 'string') {
        replaceCalls.push({ pathname: arg, params: undefined });
      } else {
        replaceCalls.push({ pathname: arg.pathname, params: arg.params });
      }
    },
  },
}));

let mockLoading = false;
let mockSession: { user: string } | null = null;

jest.mock('../src/auth/store', () => ({
  useAuthStore: (
    selector: (s: {
      loading: boolean;
      session: { user: string } | null;
    }) => unknown,
  ) => selector({ loading: mockLoading, session: mockSession }),
}));

import ShareIntentRoute from '../app/shareintent';

// react-test-renderer needs an act() wrapper around mount so the initial
// useEffect (which performs router.replace) runs synchronously.
const render = () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ShareIntentRoute />);
  });
  return tree;
};

describe('ShareIntentRoute', () => {
  beforeEach(() => {
    mockShareIntent = null;
    mockSession = null;
    mockLoading = false;
    replaceCalls.length = 0;
    mockResetShareIntent.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null while auth is loading', () => {
    mockLoading = true;
    const tree = render();
    expect(tree.toJSON()).toBeNull();
    expect(replaceCalls).toHaveLength(0);
  });

  it('(a) URL + session → router.replace /(app)/add with url param', () => {
    mockShareIntent = { webUrl: 'https://example.com/x' };
    mockSession = { user: 'u1' };
    render();
    expect(replaceCalls).toEqual([
      { pathname: '/(app)/add', params: { url: 'https://example.com/x' } },
    ]);
    expect(mockResetShareIntent).toHaveBeenCalledTimes(1);
  });

  it('(b) URL + no session → router.replace /(auth)/login with pendingUrl', () => {
    mockShareIntent = { webUrl: 'https://example.com/x' };
    mockSession = null;
    render();
    expect(replaceCalls).toEqual([
      {
        pathname: '/(auth)/login',
        params: { pendingUrl: 'https://example.com/x' },
      },
    ]);
  });

  it('(c) cold-start: no URL initially → waits, then navigates when shareIntent arrives', () => {
    mockShareIntent = null;
    mockSession = { user: 'u1' };
    const tree = render();
    expect(replaceCalls).toHaveLength(0);

    // Native module fills the share intent before the timeout fires.
    mockShareIntent = { webUrl: 'https://example.com/late' };
    act(() => {
      jest.advanceTimersByTime(500);
      tree.update(<ShareIntentRoute />);
    });
    expect(replaceCalls).toEqual([
      { pathname: '/(app)/add', params: { url: 'https://example.com/late' } },
    ]);
  });

  it('(d-1) no URL + session → after timeout, fallback to /(app)', () => {
    mockShareIntent = null;
    mockSession = { user: 'u1' };
    const tree = render();
    expect(replaceCalls).toHaveLength(0);
    act(() => {
      jest.advanceTimersByTime(2100);
      tree.update(<ShareIntentRoute />);
    });
    expect(replaceCalls).toEqual([{ pathname: '/(app)', params: undefined }]);
  });

  it('(d-2) no URL + no session → after timeout, fallback to /(auth)/login', () => {
    mockShareIntent = null;
    mockSession = null;
    const tree = render();
    act(() => {
      jest.advanceTimersByTime(2100);
      tree.update(<ShareIntentRoute />);
    });
    expect(replaceCalls).toEqual([
      { pathname: '/(auth)/login', params: undefined },
    ]);
  });

  it('(e) navigatedRef: re-rendering after reset does not fire a second navigation', () => {
    mockShareIntent = { webUrl: 'https://example.com/x' };
    mockSession = { user: 'u1' };
    const tree = render();
    expect(replaceCalls).toHaveLength(1);

    // Simulate the reset clearing the share intent and a forced re-render.
    mockShareIntent = null;
    act(() => {
      tree.update(<ShareIntentRoute />);
    });
    expect(replaceCalls).toHaveLength(1);
  });
});
