import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TagChipEditor } from '../../../components/TagChipEditor';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SectionHeading } from '../../../components/ui/SectionHeading';
import { useAuth } from '../../../src/auth/use-auth';
import { useBookmarksStore } from '../../../src/bookmarks/store';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { type as typePre } from '../../../src/theme/typography';

export default function EditBookmarkScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;

  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const existingTags = useBookmarksStore((s) => s.tags);
  const update = useBookmarksStore((s) => s.update);
  const remove = useBookmarksStore((s) => s.remove);

  const original = bookmarks.find((b) => b.id === id);

  const [url, setUrl] = useState(original?.url ?? '');
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(
    original?.tags.map((t) => t.name) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (original) {
      setUrl(original.url);
      setSelectedTagNames(original.tags.map((t) => t.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original?.id]);

  if (!original) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>Bookmark not found.</Text>
      </View>
    );
  }

  const onSave = async () => {
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
    setSaving(true);
    try {
      await update(id, { url: trimmed }, selectedTagNames, session.user.id);
      router.back();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete bookmark?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await remove(id);
            router.back();
          } catch (e) {
            Alert.alert('Error', String(e instanceof Error ? e.message : e));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
        <SectionHeading style={styles.formHeading}>Refine Bookmark</SectionHeading>

        <Text style={styles.fieldLabel}>URL</Text>
        <Input
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TagChipEditor
          existingTags={existingTags.map((t) => t.name)}
          selected={selectedTagNames}
          onChange={setSelectedTagNames}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Primary + secondary actions */}
        <View style={styles.actions}>
          <Button
            variant="ghost"
            label="Cancel"
            onPress={() => router.back()}
            disabled={saving || deleting}
            style={styles.actionBtn}
          />
          <Button
            variant="primary"
            label={saving ? 'Saving…' : 'Save'}
            onPress={onSave}
            loading={saving}
            disabled={saving || deleting}
            style={styles.actionBtn}
          />
        </View>

        {/* Destructive action — visually separated */}
        <View style={styles.dangerZone}>
          <Button
            variant="danger"
            label={deleting ? 'Deleting…' : 'Delete Bookmark'}
            onPress={onDelete}
            loading={deleting}
            disabled={saving || deleting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.honeyCream },
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
  missing: { ...typePre.body, padding: spacing.lg, color: colors.greige },
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
  dangerZone: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.goldHairline,
    paddingTop: spacing.base,
  },
});
