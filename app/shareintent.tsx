import { Redirect } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import { useAuthStore } from '../src/auth/store';
import { resolveShareIntentTarget } from '../src/share-intent';

/**
 * Dedicated route for expo-share-intent.
 * Landed here via +native-intent.tsx redirectSystemPath → '/shareintent'.
 *
 * Reads share intent context and auth state, then performs a single
 * declarative <Redirect> to the appropriate screen:
 *   (a) URL shared + logged in  → /(app)/add?url=...
 *   (b) URL shared + logged out → /(auth)/login?pendingUrl=...
 *   (c) No URL (cold-start timing / direct navigation) → home or login fallback
 */
export default function ShareIntentRoute() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);

  // Call resetShareIntent after we've captured the URL so it doesn't fire twice.
  // We invoke it unconditionally once auth state is settled.
  useEffect(() => {
    if (!loading) {
      resetShareIntent();
    }
  }, [loading, resetShareIntent]);

  // Wait until auth state is resolved
  if (loading) {
    return null;
  }

  const webUrl = shareIntent?.webUrl ?? null;
  const target = webUrl ? resolveShareIntentTarget(webUrl, !!session) : null;

  if (target) {
    if (target.pathname === '/(app)/add') {
      const { url } = target.params as { url: string };
      return <Redirect href={{ pathname: '/(app)/add', params: { url } }} />;
    }
    // /(auth)/login with pendingUrl
    const { pendingUrl } = target.params as { pendingUrl: string };
    return (
      <Redirect
        href={{ pathname: '/(auth)/login', params: { pendingUrl } }}
      />
    );
  }

  // Fallback: no share URL — go home or login
  if (session) {
    return <Redirect href="/(app)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
