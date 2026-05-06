import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ShareIntentProvider } from 'expo-share-intent';
import { useAuthStore } from '../src/auth/store';
import { isSupabaseConfigured } from '../src/supabase';
import SetupRequired from '../components/SetupRequired';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      // Hide splash even when env vars are missing so the screen is not stuck.
      void SplashScreen.hideAsync();
      return;
    }
    void initialize();
  }, [configured, initialize]);

  useEffect(() => {
    if (configured && !loading) {
      void SplashScreen.hideAsync();
    }
  }, [configured, loading]);

  if (!configured) {
    return <SetupRequired />;
  }

  return (
    <ShareIntentProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="shareintent" options={{ headerShown: false }} />
      </Stack>
    </ShareIntentProvider>
  );
}
