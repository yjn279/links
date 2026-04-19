import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TagChipEditor } from '../../components/TagChipEditor';
import { useBookmarksStore } from '../../src/store';
import type { Bookmark } from '../../src/types';

export default function EditBookmarkScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const existingTags = useBookmarksStore((s) => s.tags);
  const update = useBookmarksStore((s) => s.update);

  const original = bookmarks.find((b) => b.id === id);

  const [url, setUrl] = useState(original?.url ?? '');
  const [summary, setSummary] = useState(original?.summary ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(original?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (original) {
      setUrl(original.url);
      setSummary(original.summary ?? '');
      setSelectedTags(original.tags);
    }
    // We only want to re-initialize fields when the routed bookmark id
    // changes, not on every store update that returns a new `original`
    // reference.
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
    setSaving(true);
    try {
      const updated: Bookmark = {
        ...original,
        url: trimmed,
        summary: summary.trim() ? summary.trim() : null,
        tags: selectedTags,
      };
      await update(updated);
      router.back();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
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

        <Text style={styles.label}>Summary</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.multiline]}
          placeholder="(auto-generated or your own note)"
        />

        <TagChipEditor
          existingTags={existingTags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable onPress={() => router.back()} style={[styles.btn, styles.btnCancel]}>
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.btn, styles.btnSave, saving && styles.btnDisabled]}
          >
            <Text style={[styles.btnText, styles.btnSaveText]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
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
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: '#c0392b', fontSize: 13, marginTop: 4 },
  missing: { padding: 20, color: '#666' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6 },
  btnCancel: { backgroundColor: '#eee' },
  btnSave: { backgroundColor: '#3f51b5' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  btnSaveText: { color: '#fff' },
});
