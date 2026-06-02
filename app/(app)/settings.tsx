import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/use-auth';
import { color, radius, sp, typeScale } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  const onLogout = () => {
    Alert.alert('Log out?', 'You will be signed out of your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          // Navigation handled by _layout.tsx Redirect when session becomes null
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.body}>
      {/* Account section */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>
          {session?.user.email ?? '—'}
        </Text>
      </View>

      {/* Logout */}
      <Pressable onPress={onLogout} style={styles.btnLogout}>
        <Text style={styles.btnLogoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.paper },
  body: { padding: sp[5], gap: sp[4] },
  sectionLabel: {
    ...typeScale.label,
    color: color.ink2,
    textTransform: 'uppercase',
    marginBottom: sp[1],
  },
  card: {
    backgroundColor: color.card,
    borderRadius: radius.md,
    padding: sp[4],
    gap: sp[1],
  },
  fieldLabel: { ...typeScale.caption, color: color.ink3 },
  fieldValue: { ...typeScale.body, color: color.ink },
  btnLogout: {
    marginTop: sp[3],
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  btnLogoutText: { ...typeScale.button, color: color.catDesign },
});
