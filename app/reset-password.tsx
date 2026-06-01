import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/supabase';
import { color, sp, radius } from '../src/theme/tokens';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    const trimmed = password.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error: supabaseError } = await supabase.auth.updateUser({ password: trimmed });

    setLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    router.replace('/(app)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={styles.title}>新しいパスワードを設定</Text>
        <Text style={styles.description}>
          新しいパスワードを入力してください。
        </Text>

        <Text style={styles.label}>新しいパスワード</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="新しいパスワード"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!loading}
          onSubmitEditing={handleUpdate}
          returnKeyType="done"
          testID="reset-password-input"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleUpdate}
          disabled={loading}
          style={[styles.btn, loading && styles.btnDisabled]}
          testID="reset-submit-btn"
        >
          {loading ? (
            <ActivityIndicator color={color.white} />
          ) : (
            <Text style={styles.btnText}>パスワードを更新</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.paper },
  body: {
    flex: 1,
    justifyContent: 'center',
    padding: sp[6],
    gap: sp[2],
  },
  title: { fontSize: 28, fontWeight: '700', color: color.ink, marginBottom: sp[2] },
  description: { fontSize: 15, color: color.ink2, marginBottom: sp[2] },
  label: { fontSize: 14, fontWeight: '600', color: color.ink2, marginTop: sp[1] },
  input: {
    borderWidth: 1,
    borderColor: color.line2,
    borderRadius: radius.sm,
    paddingHorizontal: sp[3],
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: color.white,
  },
  error: { color: '#c0392b', fontSize: 13, marginTop: sp[1] },
  btn: {
    marginTop: sp[2],
    paddingVertical: 13,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: color.amber,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: color.ink, fontWeight: '700', fontSize: 16 },
});
