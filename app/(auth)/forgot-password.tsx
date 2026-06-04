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
import { supabase } from '../../src/supabase';
import { color, sp, radius } from '../../src/theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: 'links://reset-password',
    });

    setLoading(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.body}>
          <Text style={styles.title}>メールを送信しました</Text>
          <Text style={styles.description}>
            確認メールを送りました。メール内のリンクからパスワードを再設定してください。
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={styles.title}>パスワードをお忘れですか？</Text>
        <Text style={styles.description}>
          登録済みのメールアドレスを入力してください。パスワード再設定用のリンクを送信します。
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
          editable={!loading}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          testID="forgot-email-input"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.btn, loading && styles.btnDisabled]}
          testID="forgot-submit-btn"
        >
          {loading ? (
            <ActivityIndicator color={color.white} />
          ) : (
            <Text style={styles.btnText}>送信</Text>
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
