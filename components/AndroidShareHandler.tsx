/**
 * AndroidShareHandler
 *
 * Monitors expo-share-intent for incoming Android ACTION_SEND shares and
 * routes them to the appropriate screen via resolveShareIntentTarget.
 *
 * This component renders nothing. It is placed inside ShareIntentProvider in
 * app/_layout.tsx so that useShareIntentContext() is available.
 *
 * iOS is explicitly excluded (Platform.OS === 'android' guard) to avoid
 * competing with the existing +native-intent → /shareintent pipeline.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useAuthStore } from '../src/auth/store';
import { resolveShareIntentTarget, shouldHandleAndroidShareIntent } from '../src/share-intent';

export default function AndroidShareHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);
  const navigatedRef = useRef(false);

  const webUrl = shareIntent?.webUrl ?? null;

  useEffect(() => {
    const shouldNavigate = shouldHandleAndroidShareIntent({
      platform: Platform.OS,
      hasShareIntent,
      webUrl,
      authLoading: loading,
      navigated: navigatedRef.current,
    });

    if (!shouldNavigate) return;

    navigatedRef.current = true;

    const target = resolveShareIntentTarget(webUrl as string, !!session);
    if (!target) return;

    if (target.pathname === '/(app)/add') {
      router.replace({
        pathname: '/(app)/add',
        params: target.params as Record<string, string>,
      });
    } else {
      router.replace({
        pathname: '/(auth)/login',
        params: target.params as Record<string, string>,
      });
    }

    resetShareIntent();
  }, [hasShareIntent, webUrl, loading, session, resetShareIntent]);

  return null;
}
