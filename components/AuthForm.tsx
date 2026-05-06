import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SunburstBackdrop } from './ui/SunburstBackdrop';
import { colors, spacing } from '../src/theme/tokens';
import { type as typePre } from '../src/theme/typography';

type Mode = 'login' | 'sign-up';

type Props = {
  mode: Mode;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchMode: () => void;
  loading: boolean;
  error: string | null;
};

export function AuthForm({ mode, onSubmit, onSwitchMode, loading, error }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    await onSubmit(email.trim(), password);
  };

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Background decoration */}
      <View style={styles.backdropWrap} pointerEvents="none">
        <SunburstBackdrop size={400} opacity={0.12} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Display title */}
        <Text style={styles.title}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back.' : 'Create your account.'}
        </Text>

        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          editable={!loading}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          variant="primary"
          label={isLogin ? 'Log In' : 'Create Account'}
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          style={styles.primaryBtn}
        />

        {/* Loading indicator (inside button handles it, keep this for compat) */}
        {loading && false ? <ActivityIndicator color={colors.deepGold} /> : null}

        <Pressable
          onPress={onSwitchMode}
          disabled={loading}
          style={styles.switchBtn}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.honeyCream },
  backdropWrap: {
    position: 'absolute',
    top: -60,
    right: -60,
    opacity: 0.6,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typePre.displayTitle,
    color: colors.warmBlack,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typePre.body,
    color: colors.greige,
    marginBottom: spacing.lg,
  },
  label: {
    ...typePre.label,
    color: colors.greige,
    marginBottom: spacing.xs - 2,
    marginTop: spacing.xs,
  },
  error: {
    ...typePre.bodySmall,
    color: colors.terracotta,
    paddingHorizontal: spacing.xs,
  },
  primaryBtn: {
    marginTop: spacing.sm,
  },
  switchBtn: { marginTop: spacing.base, alignItems: 'center' },
  switchText: {
    ...typePre.bodySmall,
    color: colors.deepGold,
    textDecorationLine: 'underline',
  },
});
