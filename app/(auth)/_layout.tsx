import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/use-auth';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Already logged in — redirect to main app
  if (!loading && session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Log In', headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up', headerShown: false }} />
    </Stack>
  );
}
