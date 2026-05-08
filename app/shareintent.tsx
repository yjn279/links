import { Redirect } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/auth/store';
import { resolveShareIntentTarget } from '../src/share-intent';

/**
 * Dedicated route for expo-share-intent.
 * Landed here via +native-intent.tsx redirectSystemPath → '/shareintent'.
 *
 * The native share-intent module fills `shareIntent` asynchronously after the
 * route mounts (it reads the App Group UserDefaults via an event triggered
 * from `useLinkingURL`). If we synchronously decide on first render, we
 * navigate away before `webUrl` arrives and the shared URL is lost. We
 * therefore wait until `hasShareIntent` becomes true OR a short timeout
 * elapses before performing the declarative <Redirect> to:
 *   (a) URL shared + logged in  → /(app)/add?url=...
 *   (b) URL shared + logged out → /(auth)/login?pendingUrl=...
 *   (c) No URL (timeout / direct navigation) → home or login fallback
 */
const SHARE_INTENT_TIMEOUT_MS = 2000;

export default function ShareIntentRoute() {
  const { shareIntent, resetShareIntent, hasShareIntent } =
    useShareIntentContext();
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);
  const [timedOut, setTimedOut] = useState(false);

  // Wait for the native module to populate shareIntent. Cap the wait so a
  // direct navigation to /shareintent (no share intent in flight) doesn't
  // hang forever.
  useEffect(() => {
    if (hasShareIntent) return;
    const t = setTimeout(() => setTimedOut(true), SHARE_INTENT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [hasShareIntent]);

  // Reset native module state once we've consumed the share intent (or
  // given up after the timeout). Auth must also be settled to avoid racing
  // with the auth-loading branch below.
  useEffect(() => {
    if (!loading && (hasShareIntent || timedOut)) {
      resetShareIntent();
    }
  }, [loading, hasShareIntent, timedOut, resetShareIntent]);

  // Wait until auth is resolved AND (share intent ready OR timed out)
  if (loading || (!hasShareIntent && !timedOut)) {
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
