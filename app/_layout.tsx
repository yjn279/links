import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ShareIntentProvider } from 'expo-share-intent';
import { useAuthStore } from '../src/auth/store';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { colors } from '../src/theme/tokens';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const authLoading = useAuthStore((s) => s.loading);

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
  });

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    // Hide splash only when both auth init and font loading are complete
    if (!authLoading && (fontsLoaded || fontError !== null)) {
      void SplashScreen.hideAsync();
    }
  }, [authLoading, fontsLoaded, fontError]);

  // Don't render the UI until fonts are ready (prevents flash of unstyled text)
  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <ThemeProvider>
      <ShareIntentProvider>
        <StatusBar style="dark" backgroundColor={colors.honeyCream} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.honeyCream } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="shareintent" options={{ headerShown: false }} />
        </Stack>
      </ShareIntentProvider>
    </ThemeProvider>
  );
}
