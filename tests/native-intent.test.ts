/**
 * Unit tests for app/+native-intent.tsx — redirectSystemPath
 *
 * Covers:
 *   - Share-intent URL → '/shareintent'
 *   - Non-share-intent URL → input path returned unchanged
 *   - Unparseable input → input path returned unchanged
 *   - REGRESSION: works under React Native's URL polyfill which only
 *     parses `https?://` (hostname/pathname empty for custom schemes).
 */

// Mock expo-share-intent so getShareExtensionKey returns a stable value
jest.mock('expo-share-intent', () => ({
  getShareExtensionKey: () => 'linksShareKey',
  useShareIntent: () => ({
    shareIntent: null,
    isReady: true,
    resetShareIntent: () => {},
    error: null,
  }),
  useShareIntentContext: () => ({
    shareIntent: null,
    hasShareIntent: false,
    resetShareIntent: () => {},
    error: null,
    isReady: true,
  }),
  ShareIntentProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { redirectSystemPath } from '../app/+native-intent';

describe('redirectSystemPath', () => {
  it('returns /shareintent for the iOS share-intent URL emitted by ShareViewController', () => {
    // Format produced by ios/ShareExtension/ShareViewController.swift:
    //   "\(shareProtocol)://dataUrl=\(sharedKey)#\(type)"
    const path = 'links://dataUrl=linksShareKey#weburl';
    expect(redirectSystemPath({ path, initial: true })).toBe('/shareintent');
  });

  it('returns /shareintent for a share-intent URL with extra path segments', () => {
    const path = 'links://dataUrl=linksShareKey/some/path';
    expect(redirectSystemPath({ path, initial: false })).toBe('/shareintent');
  });

  it('returns the input path for a non-share-intent URL', () => {
    const path = 'links://other';
    expect(redirectSystemPath({ path, initial: true })).toBe(path);
  });

  it('returns the input path for a relative path', () => {
    const path = '/relative/path';
    expect(redirectSystemPath({ path, initial: false })).toBe(path);
  });

  it('returns the input path for a completely unparseable string', () => {
    const path = 'not a url at all!!';
    expect(redirectSystemPath({ path, initial: true })).toBe(path);
  });

  it('does not change behaviour based on the initial flag', () => {
    const shareIntentPath = 'links://dataUrl=linksShareKey';
    expect(redirectSystemPath({ path: shareIntentPath, initial: true })).toBe(
      '/shareintent'
    );
    expect(redirectSystemPath({ path: shareIntentPath, initial: false })).toBe(
      '/shareintent'
    );
  });

  // Regression: previous implementation used `new URL(path)` and inspected
  // `hostname`/`pathname`. React Native's URL polyfill only matches
  // `https?://`, so for `links://...` both fields are empty/`/` and the
  // redirect silently failed on device while passing Node-based tests.
  // Swap in an https-only URL stub here to lock in the behaviour.
  it('redirects correctly even when URL.hostname/pathname are empty (RN polyfill behaviour)', () => {
    const RealURL = global.URL;
    class HttpsOnlyURL {
      _url: string;
      constructor(input: string) {
        this._url = input;
      }
      get hostname(): string {
        const m = this._url.match(/^https?:\/\/([^:/?#]+)/);
        return m ? m[1] : '';
      }
      get pathname(): string {
        const m = this._url.match(/^https?:\/\/[^/]+(\/[^?#]*)?/);
        return m ? m[1] || '/' : '/';
      }
    }
    // @ts-expect-error: deliberately overriding global URL for the test
    global.URL = HttpsOnlyURL;
    try {
      expect(
        redirectSystemPath({
          path: 'links://dataUrl=linksShareKey#weburl',
          initial: true,
        })
      ).toBe('/shareintent');
    } finally {
      global.URL = RealURL;
    }
  });
});
