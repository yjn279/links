import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signIn } from '../../src/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
      Alert.alert('Sign in failed', authError);
    }
    // Navigation is handled by _layout.tsx onAuthStateChange
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>Links にログイン</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          style={styles.input}
          placeholder="you@example.com"
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          style={styles.input}
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSignIn}
          disabled={loading}
          style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
        >
          <Text style={styles.btnPrimaryText}>{loading ? 'ログイン中…' : 'ログイン'}</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/sign-up')} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>アカウントを作成</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, padding: 24, gap: 10, justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: '#c0392b', fontSize: 13 },
  btn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#3f51b5', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: { alignItems: 'center', paddingVertical: 10 },
  btnSecondaryText: { color: '#3f51b5', fontSize: 15 },
});
