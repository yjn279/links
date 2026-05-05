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

/**
 * Handle an incoming shared URL.
 * If the user is logged in, navigate to add screen with the URL pre-filled.
 * If not logged in, navigate to login.
 */
export function handleSharedUrl(url: string, isLoggedIn: boolean): void {
  if (!url) return;
  if (isLoggedIn) {
    router.push({ pathname: '/(app)/add', params: { url } });
  } else {
    router.push({ pathname: '/(auth)/login', params: { pendingUrl: url } });
  }
}
