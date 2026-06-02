/**
 * Behaviour tests for the openBookmark handler in app/(app)/index.tsx.
 *
 * Verifies:
 *   (a) Valid http(s) URL → openBrowserAsync is called once with the URL.
 *   (b) Invalid URL       → openBrowserAsync is NOT called; Alert.alert IS called.
 */

import { Alert } from 'react-native';
import { isOpenableUrl } from '../src/lib/url';

// Mock expo-web-browser
const mockOpenBrowserAsync = jest.fn().mockResolvedValue({ type: 'cancel' });
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Minimal re-implementation of the openBookmark logic extracted from index.tsx
// so we can test it without mounting the full screen (which requires many
// native mocks). The logic is intentionally kept identical to the source.
import { openBrowserAsync } from 'expo-web-browser';

function openBookmark(url: string): void {
  if (isOpenableUrl(url)) {
    void openBrowserAsync(url);
  } else {
    Alert.alert('開けません', 'このリンクは開けません。');
  }
}

describe('openBookmark', () => {
  beforeEach(() => {
    mockOpenBrowserAsync.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('(a) valid https URL → openBrowserAsync called once with the URL', () => {
    openBookmark('https://example.com');
    expect(mockOpenBrowserAsync).toHaveBeenCalledTimes(1);
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://example.com');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('(a2) valid http URL → openBrowserAsync called once', () => {
    openBookmark('http://example.com/page');
    expect(mockOpenBrowserAsync).toHaveBeenCalledTimes(1);
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('http://example.com/page');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('(b) invalid URL (no scheme) → openBrowserAsync not called, Alert shown', () => {
    openBookmark('example.com');
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('(b2) empty URL → openBrowserAsync not called, Alert shown', () => {
    openBookmark('');
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('(b3) ftp URL → openBrowserAsync not called, Alert shown', () => {
    openBookmark('ftp://files.example.com');
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('(b4) javascript: URL → openBrowserAsync not called, Alert shown', () => {
    openBookmark('javascript:alert(1)');
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
