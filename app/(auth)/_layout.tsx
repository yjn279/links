import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/auth/use-auth';
import { colors } from '../../src/theme/tokens';
import { type as typePre } from '../../src/theme/typography';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Already logged in — redirect to main app
  if (!loading && session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.honeyCream },
        headerStyle: { backgroundColor: colors.honeyCream },
        headerTintColor: colors.warmBlack,
        headerTitleStyle: {
          ...typePre.sectionHeading,
          color: colors.warmBlack,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Log In', headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up', headerShown: false }} />
    </Stack>
  );
}
