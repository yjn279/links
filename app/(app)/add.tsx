import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/use-auth';
import { useBookmarksStore } from '../../src/bookmarks/store';

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
      <View style={styles.body}>
        <Text style={styles.label}>URL</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={styles.input}
          autoFocus={!params.url}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable onPress={() => router.back()} style={[styles.btn, styles.btnCancel]}>
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.btn, styles.btnAdd, submitting && styles.btnDisabled]}
          >
            <Text style={[styles.btnText, styles.btnAddText]}>
              {submitting ? 'Adding...' : 'Add'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 20, gap: 10 },
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6 },
  btnCancel: { backgroundColor: '#eee' },
  btnAdd: { backgroundColor: '#3f51b5' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  btnAddText: { color: '#fff' },
});
