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
import { signUp } from '../../src/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUp = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは 6 文字以上にしてください');
      return;
    }
    setLoading(true);
    const { error: authError } = await signUp(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
      Alert.alert('Sign up failed', authError);
    } else {
      Alert.alert(
        '登録完了',
        '確認メールを送りました。メール内のリンクをクリック後、ログインしてください。',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }],
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={styles.heading}>アカウント作成</Text>

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

        <Text style={styles.label}>パスワード（6 文字以上）</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          style={styles.input}
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSignUp}
          disabled={loading}
          style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
        >
          <Text style={styles.btnPrimaryText}>{loading ? '登録中…' : '登録'}</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>ログイン画面に戻る</Text>
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
