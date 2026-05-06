import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useAuth } from '../../src/auth/use-auth';
import { useBookmarksStore } from '../../src/bookmarks/store';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { type as typePre } from '../../src/theme/typography';

export default function AddBookmarkScreen() {
  const { session } = useAuth();
  const add = useBookmarksStore((s) => s.add);
  const params = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(params.url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Update URL field if share-intent injects a url param after mount
  useEffect(() => {
    if (params.url) {
      setUrl(params.url);
    }
  }, [params.url]);

  const onSubmit = async () => {
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError('URL is required');
      return;
    }
    if (!session) {
      setError('Not logged in');
      return;
    }
    setSubmitting(true);
    try {
      await add(trimmed, session.user.id);
      router.back();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeading style={styles.formHeading}>Add a URL</SectionHeading>

        <Text style={styles.fieldLabel}>URL</Text>
        <Input
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          autoFocus={!params.url}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button
            variant="ghost"
            label="Cancel"
            onPress={() => router.back()}
            style={styles.actionBtn}
          />
          <Button
            variant="primary"
            label={submitting ? 'Adding…' : 'Add'}
            onPress={onSubmit}
            loading={submitting}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  formHeading: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.goldHairline,
    paddingTop: spacing.base,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radii.lg,
  },
});
