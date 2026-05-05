import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/auth/store';
import { useSafeShareIntent, handleSharedUrl } from '../src/share-intent';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);
  const session = useAuthStore((s) => s.session);

  // Share intent listener — no-op in Expo Go / web
  const { shareIntent, resetShareIntent } = useSafeShareIntent();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync();
    }
  }, [loading]);

  // Handle incoming shared URLs once auth state is resolved
  useEffect(() => {
    if (loading) return;
    const url = shareIntent?.webUrl;
    if (url) {
      handleSharedUrl(url, !!session);
      resetShareIntent();
    }
  }, [shareIntent, loading, session, resetShareIntent]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
