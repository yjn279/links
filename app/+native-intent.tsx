import { getShareExtensionKey } from 'expo-share-intent';

// React Native's bundled URL polyfill (Libraries/Blob/URL.js) only parses
// `https?://` URLs — `hostname` and `pathname` return empty for custom
// schemes like `links://`. So we cannot use `new URL(path)` here. Match
// against the raw string instead, mirroring expo-share-intent's own check
// in useShareIntent: `url.includes(\`${scheme}://dataUrl=\`)`.
export function redirectSystemPath({
  path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}): string {
  if (typeof path !== 'string') return path;
  try {
    const key = getShareExtensionKey();
    if (path.includes(`dataUrl=${key}`)) {
      return '/shareintent';
    }
    return path;
  } catch {
    return path;
  }
}
