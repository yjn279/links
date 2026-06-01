import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ShareIntentProvider } from 'expo-share-intent';
import { useAuthStore } from '../src/auth/store';
import { isSupabaseConfigured } from '../src/supabase';
import SetupRequired from '../components/SetupRequired';
import AndroidShareHandler from '../components/AndroidShareHandler';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);
  const configured = isSupabaseConfigured();

  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!configured) {
      // Hide splash even when env vars are missing so the screen is not stuck.
      void SplashScreen.hideAsync();
      return;
    }
    void initialize();
  }, [configured, initialize]);

  useEffect(() => {
    if (configured && !loading && fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [configured, loading, fontsLoaded]);

  if (!configured) {
    return <SetupRequired />;
  }

  return (
    <ShareIntentProvider options={{ resetOnBackground: false }}>
      <AndroidShareHandler />
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
