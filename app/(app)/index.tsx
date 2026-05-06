import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookmarkFilters } from '../../components/BookmarkFilters';
import { BookmarkRow } from '../../components/BookmarkRow';
import { useAuth } from '../../src/auth/use-auth';
import { applyFilters } from '../../src/bookmarks/filters';
import { useBookmarksStore } from '../../src/bookmarks/store';

export default function BookmarkListScreen() {
  const { session } = useAuth();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const tags = useBookmarksStore((s) => s.tags);
  const loading = useBookmarksStore((s) => s.loading);
  const error = useBookmarksStore((s) => s.error);
  const lastMetaError = useBookmarksStore((s) => s.lastMetaError);
  const load = useBookmarksStore((s) => s.load);
  const remove = useBookmarksStore((s) => s.remove);

  const [query, setQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (session) {
      void load();
    }
  }, [session, load]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete bookmark?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void remove(id).catch((e) => Alert.alert('Error', String(e))),
      },
    ]);
  };

  const filtered = applyFilters(bookmarks, { tagIds: selectedTagIds, query, sortAsc });

  if (loading && bookmarks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {lastMetaError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={2}>
            Meta fetch unavailable: {lastMetaError}
          </Text>
        </View>
      ) : null}

      {/* Search input */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search bookmarks..."
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
        clearButtonMode="while-editing"
      />

      {/* Tag filter chips + sort toggle */}
      <BookmarkFilters
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onChangeTagIds={setSelectedTagIds}
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc((v) => !v)}
      />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyHint}>Tap the + button to add your first URL.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookmarkRow bookmark={item} onDelete={confirmDelete} />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/(app)/add')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#111' },
  emptyHint: { fontSize: 14, color: '#666', textAlign: 'center' },
  errorText: { fontSize: 18, fontWeight: '600', color: '#c0392b' },
  errorDetail: { fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center' },
  banner: {
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1c40f',
  },
  bannerText: { fontSize: 12, color: '#7a5c00' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 34, lineHeight: 38, fontWeight: '300' },
});
