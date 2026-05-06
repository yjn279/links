import { Redirect, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useAuth } from '../../src/auth/use-auth';
import { colors } from '../../src/theme/tokens';
import { type as typePre } from '../../src/theme/typography';

export default function AppLayout() {
  const { session, loading, signOut } = useAuth();

  // Not authenticated — redirect to login
  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.honeyCream },
        headerTintColor: colors.warmBlack,
        headerTitleStyle: {
          ...typePre.sectionHeading,
          color: colors.warmBlack,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.honeyCream },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'modal',
          title: 'New Bookmark',
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { ...typePre.sectionHeading, color: colors.warmBlack },
          headerRight: () => (
            <Pressable onPress={() => void signOut()} hitSlop={8} style={{ marginRight: 4 }}>
              <Text style={{ ...typePre.label, color: colors.greige }}>Log Out</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Bookmark',
          headerRight: () => (
            <Pressable onPress={() => void signOut()} hitSlop={8} style={{ marginRight: 4 }}>
              <Text style={{ ...typePre.label, color: colors.greige }}>Log Out</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
