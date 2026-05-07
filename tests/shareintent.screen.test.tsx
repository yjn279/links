/**
 * Component tests for app/shareintent.tsx
 *
 * Tests the three Redirect branches:
 *   (a) shareIntent.webUrl present + session → /(app)/add?url=...
 *   (b) shareIntent.webUrl present + no session → /(auth)/login?pendingUrl=...
 *   (c) No shareIntent.webUrl → fallback to /(app) (session) or /(auth)/login (no session)
 *
 * Mocks: useShareIntentContext (expo-share-intent), useAuthStore (src/auth/store),
 *        expo-router (Redirect)
 */

import React from 'react';
import { act } from 'react-test-renderer';
import renderer from 'react-test-renderer';

// ---- expo-router mock -------------------------------------------------------
let lastRedirectHref: unknown = null;

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: unknown }) => {
    lastRedirectHref = href;
    return null;
  },
}));

// ---- expo-share-intent mock -------------------------------------------------
let mockShareIntent: { webUrl: string | null } | null = null;
const mockResetShareIntent = jest.fn();

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: () => ({
    shareIntent: mockShareIntent,
    hasShareIntent: mockShareIntent?.webUrl != null,
    resetShareIntent: mockResetShareIntent,
    error: null,
    isReady: true,
  }),
  ShareIntentProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  getShareExtensionKey: () => 'linksShareKey',
  useShareIntent: () => ({
    shareIntent: null,
    isReady: true,
    resetShareIntent: () => {},
    error: null,
  }),
}));

// ---- src/auth/store mock ----------------------------------------------------
let mockSession: object | null = null;
let mockLoading = false;

jest.mock('../src/auth/store', () => ({
  useAuthStore: (
    selector: (s: { session: object | null; loading: boolean }) => unknown
  ) => selector({ session: mockSession, loading: mockLoading }),
}));

// ---- supabase mock (transitive dep) -----------------------------------------
jest.mock('../src/supabase', () => ({ supabase: {} }));

import ShareIntentRoute from '../app/shareintent';

function render() {
  lastRedirectHref = null;
  mockResetShareIntent.mockClear();
  let instance!: renderer.ReactTestRenderer;
  act(() => {
    instance = renderer.create(<ShareIntentRoute />);
  });
  return instance;
}

describe('ShareIntentRoute', () => {
  beforeEach(() => {
    mockShareIntent = null;
    mockSession = null;
    mockLoading = false;
    lastRedirectHref = null;
    mockResetShareIntent.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null while loading', () => {
    mockLoading = true;
    mockShareIntent = { webUrl: 'https://example.com' };
    mockSession = { user: 'u1' };
    const tree = render();
    expect(tree.toJSON()).toBeNull();
  });

  it('(a) URL + session → Redirect to /(app)/add with url param', () => {
    const url = 'https://example.com/article';
    mockShareIntent = { webUrl: url };
    mockSession = { user: 'u1' };
    render();
    expect(lastRedirectHref).toEqual({
      pathname: '/(app)/add',
      params: { url },
    });
  });

  it('(b) URL + no session → Redirect to /(auth)/login with pendingUrl param', () => {
    const url = 'https://example.com/article';
    mockShareIntent = { webUrl: url };
    mockSession = null;
    render();
    expect(lastRedirectHref).toEqual({
      pathname: '/(auth)/login',
      params: { pendingUrl: url },
    });
  });

  it('(c-1) no URL + session → renders null until timeout, then Redirect to /(app)', () => {
    mockShareIntent = null;
    mockSession = { user: 'u1' };
    const tree = render();
    // Before the timeout fires, render holds (no redirect yet)
    expect(lastRedirectHref).toBeNull();
    expect(tree.toJSON()).toBeNull();
    // Advance past the 2s timeout
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(lastRedirectHref).toBe('/(app)');
  });

  it('(c-2) no URL + no session → renders null until timeout, then Redirect to /(auth)/login', () => {
    mockShareIntent = null;
    mockSession = null;
    const tree = render();
    expect(lastRedirectHref).toBeNull();
    expect(tree.toJSON()).toBeNull();
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(lastRedirectHref).toBe('/(auth)/login');
  });

  it('(d) async share intent: webUrl arrives before timeout → Redirect to /(app)/add', () => {
    // Simulate cold-start: native module hasn't fired yet at first render.
    mockShareIntent = null;
    mockSession = { user: 'u1' };
    const tree = render();
    expect(lastRedirectHref).toBeNull();
    expect(tree.toJSON()).toBeNull();

    // Native module fires before the 2s timeout: shareIntent fills, re-render.
    const url = 'https://example.com/late';
    mockShareIntent = { webUrl: url };
    act(() => {
      jest.advanceTimersByTime(500);
      tree.update(<ShareIntentRoute />);
    });
    expect(lastRedirectHref).toEqual({
      pathname: '/(app)/add',
      params: { url },
    });
  });
});
