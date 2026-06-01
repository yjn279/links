/**
 * Unit tests for src/share-intent.ts — resolveShareIntentTarget and
 * shouldHandleAndroidShareIntent (pure functions).
 *
 * Tests cover AC#22(b)(c)(d) from plan.md Sprint 10:
 *   - Unauthenticated: target is /(auth)/login with params.pendingUrl = input URL
 *   - Authenticated:   target is /(app)/add with params.url = input URL
 *   - Empty URL:       returns null (no navigation)
 *   - URL with query string: params are passed through as-is
 *
 * Also covers shouldHandleAndroidShareIntent (M2):
 *   - Returns true only on Android when conditions are fully met
 *   - Returns false on iOS (Platform guard)
 *   - Returns false when auth is still loading
 *   - Returns false when already navigated
 *   - Returns false when no share intent or empty URL
 */
import { resolveShareIntentTarget, shouldHandleAndroidShareIntent } from '../src/share-intent';

// expo-share-intent uses native modules; mock the module so the import in
// share-intent.ts does not fail in the jest-expo (jsdom/node) environment.
jest.mock('expo-share-intent', () => ({
  useShareIntent: () => ({
    shareIntent: null,
    isReady: true,
    resetShareIntent: () => {},
    error: null,
  }),
}));

// expo-router is only needed by handleSharedUrl (which we do not test here).
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('resolveShareIntentTarget', () => {
  it('case 1 (unauthenticated): returns /(auth)/login with pendingUrl param', () => {
    const url = 'https://example.com/article';
    const target = resolveShareIntentTarget(url, false);
    expect(target).not.toBeNull();
    expect(target!.pathname).toBe('/(auth)/login');
    expect((target as { pathname: string; params: { pendingUrl: string } }).params.pendingUrl).toBe(url);
  });

  it('case 2 (authenticated): returns /(app)/add with url param', () => {
    const url = 'https://example.com/article';
    const target = resolveShareIntentTarget(url, true);
    expect(target).not.toBeNull();
    expect(target!.pathname).toBe('/(app)/add');
    expect((target as { pathname: string; params: { url: string } }).params.url).toBe(url);
  });

  it('case 3 (empty url): returns null regardless of login state', () => {
    expect(resolveShareIntentTarget('', false)).toBeNull();
    expect(resolveShareIntentTarget('', true)).toBeNull();
  });

  it('case 4 (url with query string): params are passed through unchanged', () => {
    const url = 'https://example.com/page?q=hello&ref=share';
    const unauthTarget = resolveShareIntentTarget(url, false);
    expect((unauthTarget as { pathname: string; params: { pendingUrl: string } }).params.pendingUrl).toBe(url);

    const authTarget = resolveShareIntentTarget(url, true);
    expect((authTarget as { pathname: string; params: { url: string } }).params.url).toBe(url);
  });
});

describe('shouldHandleAndroidShareIntent', () => {
  const baseArgs = {
    platform: 'android',
    hasShareIntent: true,
    webUrl: 'https://example.com',
    authLoading: false,
    navigated: false,
  };

  it('returns true when all conditions are met on Android', () => {
    expect(shouldHandleAndroidShareIntent(baseArgs)).toBe(true);
  });

  it('returns false on iOS (platform guard)', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, platform: 'ios' })).toBe(false);
  });

  it('returns false on web (platform guard)', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, platform: 'web' })).toBe(false);
  });

  it('returns false when auth is still loading', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, authLoading: true })).toBe(false);
  });

  it('returns false when already navigated', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, navigated: true })).toBe(false);
  });

  it('returns false when hasShareIntent is false', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, hasShareIntent: false })).toBe(false);
  });

  it('returns false when webUrl is null', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, webUrl: null })).toBe(false);
  });

  it('returns false when webUrl is undefined', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, webUrl: undefined })).toBe(false);
  });

  it('returns false when webUrl is empty string', () => {
    expect(shouldHandleAndroidShareIntent({ ...baseArgs, webUrl: '' })).toBe(false);
  });
});
