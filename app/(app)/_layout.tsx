import { Redirect, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useAuth } from '../../src/auth/use-auth';

export default function AppLayout() {
  const { session, loading, signOut } = useAuth();

  // Not authenticated — redirect to login
  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Links',
          headerRight: () => (
            <Pressable onPress={() => void signOut()} hitSlop={8} style={{ marginRight: 4 }}>
              <Text style={{ color: '#3f51b5', fontSize: 15 }}>Log Out</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="add"
        options={{ presentation: 'modal', title: 'Add Bookmark' }}
      />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Bookmark' }} />
    </Stack>
  );
}
