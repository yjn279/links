/**
 * expo-share-intent wrapper.
 * Handles incoming shared URLs and routes them to /(app)/add?url=...
 *
 * NOTE: expo-share-intent does NOT work in Expo Go.
 * Use EAS Development Build or Preview Build to test Share Extension.
 * On web this module is a no-op.
 */
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useShareIntent as useShareIntentNative } from 'expo-share-intent';

type ShareIntentHookResult = {
  shareIntent: { webUrl?: string | null } | null;
  isReady: boolean;
  resetShareIntent: () => void;
  error: string | null;
};

/**
 * Safe hook that wraps expo-share-intent.
 * On web (and in Expo Go when the native module is absent), returns a no-op result.
 */
export function useSafeShareIntent(): ShareIntentHookResult {
  // Call the real hook unconditionally to comply with React's rules of hooks.
  // The return value is ignored on web.
  const native = useShareIntentNative();

  if (Platform.OS === 'web') {
    return {
      shareIntent: null,
      isReady: true,
      resetShareIntent: () => {},
      error: null,
    };
  }

  return native as ShareIntentHookResult;
}

type ShareIntentTarget =
  | { pathname: '/(app)/add'; params: { url: string } }
  | { pathname: '/(auth)/login'; params: { pendingUrl: string } };

/**
 * Pure function: resolves the navigation target for a shared URL.
 * Returns null when the URL is empty (no navigation should occur).
 * Exported for unit testing without mocking expo-router.
 */
export function resolveShareIntentTarget(
  url: string,
  isLoggedIn: boolean,
): ShareIntentTarget | null {
  if (!url) return null;
  if (isLoggedIn) {
    return { pathname: '/(app)/add', params: { url } };
  }
  return { pathname: '/(auth)/login', params: { pendingUrl: url } };
}

/**
 * Handle an incoming shared URL.
 * If the user is logged in, navigate to add screen with the URL pre-filled.
 * If not logged in, navigate to login with the URL as pendingUrl.
 */
export function handleSharedUrl(url: string, isLoggedIn: boolean): void {
  const target = resolveShareIntentTarget(url, isLoggedIn);
  if (!target) return;
  router.push(target);
}

/**
 * Pure function: determines whether the Android share handler should navigate.
 * Returns true only on Android when auth has resolved and a non-empty URL is present.
 * Exported for unit testing without native module dependencies.
 */
export function shouldHandleAndroidShareIntent({
  platform,
  hasShareIntent,
  webUrl,
  authLoading,
  navigated,
}: {
  platform: string;
  hasShareIntent: boolean;
  webUrl: string | null | undefined;
  authLoading: boolean;
  navigated: boolean;
}): boolean {
  if (platform !== 'android') return false;
  if (authLoading) return false;
  if (navigated) return false;
  if (!hasShareIntent) return false;
  if (!webUrl) return false;
  return true;
}
