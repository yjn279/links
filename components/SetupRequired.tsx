import { StyleSheet, Text, View } from 'react-native';

/**
 * Displayed when EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY
 * are not configured.  Guides the developer through the setup steps.
 */
export default function SetupRequired() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Setup Required</Text>
      <Text style={styles.body}>
        The app could not find the required Supabase environment variables.
        Please complete the setup below before launching the app.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required variables</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup steps</Text>
        <Text style={styles.step}>1. Copy .env.example to .env.local in the project root:</Text>
        <Text style={styles.code}>{'cp .env.example .env.local'}</Text>
        <Text style={styles.step}>
          2. Open .env.local and replace the placeholder values with your
          Supabase project URL and anon key (found in Supabase Dashboard &gt;
          Settings &gt; API).
        </Text>
        <Text style={styles.step}>3. Restart Metro bundler:</Text>
        <Text style={styles.code}>{'npx expo start --clear'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  step: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1a1a1a',
    backgroundColor: '#ececec',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
});
