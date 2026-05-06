import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TagChipEditor } from '../../../components/TagChipEditor';
import { useAuth } from '../../../src/auth/use-auth';
import { useBookmarksStore } from '../../../src/bookmarks/store';

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
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>URL</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />

        <TagChipEditor
          existingTags={existingTags.map((t) => t.name)}
          selected={selectedTagNames}
          onChange={setSelectedTagNames}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable onPress={() => router.back()} style={[styles.btn, styles.btnCancel]}>
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={saving || deleting}
            style={[styles.btn, styles.btnSave, (saving || deleting) && styles.btnDisabled]}
          >
            <Text style={[styles.btnText, styles.btnSaveText]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onDelete}
          disabled={saving || deleting}
          style={[styles.btnDelete, (saving || deleting) && styles.btnDisabled]}
        >
          <Text style={styles.btnDeleteText}>{deleting ? 'Deleting...' : 'Delete Bookmark'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 20, gap: 10, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: '#c0392b', fontSize: 13, marginTop: 4 },
  missing: { padding: 20, color: '#666' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6 },
  btnCancel: { backgroundColor: '#eee' },
  btnSave: { backgroundColor: '#3f51b5' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  btnSaveText: { color: '#fff' },
  btnDelete: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  btnDeleteText: { color: '#c0392b', fontWeight: '600', fontSize: 15 },
});
