import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBookmarksStore } from '../src/store';

export default function AddBookmarkScreen() {
  const add = useBookmarksStore((s) => s.add);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    setSubmitting(true);
    try {
      await add(url.trim());
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
          autoFocus
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
              {submitting ? 'Adding…' : 'Add'}
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
