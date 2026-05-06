import { getShareExtensionKey } from 'expo-share-intent';

export function redirectSystemPath({
  path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const url = new URL(path);
    const key = getShareExtensionKey();
    if (
      url.hostname === `dataUrl=${key}` ||
      url.pathname.includes(`dataUrl=${key}`)
    ) {
      return '/shareintent';
    }
    return path;
  } catch {
    return path;
  }
}
