import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { type Session } from '@supabase/supabase-js';
import { isAuthConfigured, getCurrentSession, onAuthStateChange, signOut } from '../src/auth';
import { useBookmarksStore } from '../src/store';

export default function RootLayout() {
  const load = useBookmarksStore((s) => s.load);
  const setCurrentUser = useBookmarksStore((s) => s.setCurrentUser);
  const authConfigured = isAuthConfigured();

  // null = unknown (checking session), undefined = guest (no auth), Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(
    authConfigured ? null : undefined,
  );
  const initialised = useRef(false);

  useEffect(() => {
    if (!authConfigured) {
      // Guest mode: load bookmarks immediately
      void load();
      return;
    }

    // Resolve initial session before subscribing
    void getCurrentSession().then((s) => {
      setSession(s);
      const userId = s?.user.id ?? 'guest';
      void setCurrentUser(userId);
      initialised.current = true;
    });

    const unsubscribe = onAuthStateChange((s) => {
      setSession(s);
      const userId = s?.user.id ?? 'guest';
      if (initialised.current) {
        void setCurrentUser(userId);
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While resolving initial session, render nothing (splash stays visible).
  if (authConfigured && session === null) {
    return null;
  }

  const isLoggedIn = !!session;

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        {authConfigured && !isLoggedIn ? (
          // Auth screens
          <>
            <Stack.Screen name="(auth)/sign-in" options={{ title: 'ログイン', headerShown: false }} />
            <Stack.Screen name="(auth)/sign-up" options={{ title: 'アカウント作成', headerShown: false }} />
          </>
        ) : (
          // App screens
          <>
            <Stack.Screen
              name="index"
              options={{
                title: 'Links',
                headerRight: authConfigured ? () => <SignOutButton /> : undefined,
              }}
            />
            <Stack.Screen
              name="add"
              options={{ presentation: 'modal', title: 'Add bookmark' }}
            />
            <Stack.Screen name="edit/[id]" options={{ title: 'Edit bookmark' }} />
          </>
        )}
      </Stack>
    </>
  );
}

function SignOutButton() {
  const handleSignOut = () => {
    Alert.alert('サインアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => { void signOut(); },
      },
    ]);
  };

  return (
    <Pressable onPress={handleSignOut} style={signOutStyles.btn}>
      <Text style={signOutStyles.text}>ログアウト</Text>
    </Pressable>
  );
}

const signOutStyles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { color: '#c0392b', fontSize: 14 },
});
