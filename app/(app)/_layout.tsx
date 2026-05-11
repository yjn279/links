import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/use-auth';
import { color } from '../../src/theme/tokens';

export default function AppLayout() {
  const { session, loading } = useAuth();

  // Not authenticated — redirect to login
  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          headerShown: true,
          title: 'Edit Bookmark',
          headerStyle: { backgroundColor: color.paper },
          headerTintColor: color.ink,
        }}
      />
    </Stack>
  );
}
