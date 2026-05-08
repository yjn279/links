import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../src/auth/store';
import { resolveShareIntentTarget } from '../src/share-intent';

/**
 * Dedicated route for expo-share-intent.
 * Landed here via +native-intent.tsx redirectSystemPath → '/shareintent'.
 *
 * The native share-intent module fills `shareIntent` asynchronously after the
 * route mounts. We navigate imperatively from a useEffect so that
 *   (a) the navigation only fires once even if the component re-renders, and
 *   (b) re-renders triggered by `resetShareIntent` cannot issue a competing
 *       <Redirect> that overrides the first one.
 *
 * Targets:
 *   (a) URL shared + logged in  → /(app)/add?url=...
 *   (b) URL shared + logged out → /(auth)/login?pendingUrl=...
 *   (c) No URL within timeout / direct navigation → home or login fallback
 */
const SHARE_INTENT_TIMEOUT_MS = 2000;

export default function ShareIntentRoute() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);
  const [timedOut, setTimedOut] = useState(false);
  const navigatedRef = useRef(false);

  const webUrl = shareIntent?.webUrl ?? null;

  // Imperative navigation. Fires exactly once when both:
  //   - auth state has resolved (loading === false), AND
  //   - we have a webUrl OR we've timed out waiting for one.
  useEffect(() => {
    if (loading || navigatedRef.current) return;
    if (!webUrl && !timedOut) return;

    navigatedRef.current = true;

    if (webUrl) {
      const target = resolveShareIntentTarget(webUrl, !!session);
      if (target?.pathname === '/(app)/add') {
        router.replace({
          pathname: '/(app)/add',
          params: target.params as Record<string, string>,
        });
      } else if (target) {
        router.replace({
          pathname: '/(auth)/login',
          params: target.params as Record<string, string>,
        });
      }
      // Reset only AFTER scheduling navigation, so a re-render here is harmless.
      resetShareIntent();
      return;
    }

    // Fallback after timeout: no share intent ever arrived.
    router.replace(session ? '/(app)' : '/(auth)/login');
  }, [loading, webUrl, timedOut, session, resetShareIntent]);

  // Timeout: if shareIntent never arrives, give up after 2s.
  useEffect(() => {
    if (webUrl) return;
    const t = setTimeout(() => setTimedOut(true), SHARE_INTENT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [webUrl]);

  return null;
}
