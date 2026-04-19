import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useBookmarksStore } from '../src/store';

export default function RootLayout() {
  const load = useBookmarksStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Links' }} />
        <Stack.Screen
          name="add"
          options={{ presentation: 'modal', title: 'Add bookmark' }}
        />
        <Stack.Screen name="edit/[id]" options={{ title: 'Edit bookmark' }} />
      </Stack>
    </>
  );
}
