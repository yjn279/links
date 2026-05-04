import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookmarkRow } from '../components/BookmarkRow';
import { SortMenu, type SortOrder } from '../components/SortMenu';
import { TagFilterBar } from '../components/TagFilterBar';
import { useBookmarksStore } from '../src/store';
import type { Bookmark } from '../src/types';

export default function BookmarkListScreen() {
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const tags = useBookmarksStore((s) => s.tags);
  const loading = useBookmarksStore((s) => s.loading);
  const error = useBookmarksStore((s) => s.error);
  const lastSummarizeError = useBookmarksStore((s) => s.lastSummarizeError);
  const remove = useBookmarksStore((s) => s.remove);

  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('createdAt_desc');

  const toggleFilter = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilter = () => setFilterTags([]);

  const displayedBookmarks = useMemo(() => {
    let result: Bookmark[] = bookmarks;

    // AND filter by selected tags
    if (filterTags.length > 0) {
      result = result.filter((b) =>
        filterTags.every((ft) => b.tags.includes(ft)),
      );
    }

    // Sort
    const sorted = [...result];
    if (sortOrder === 'createdAt_desc') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortOrder === 'createdAt_asc') {
      sorted.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortOrder === 'title_asc') {
      sorted.sort((a, b) => {
        const ta = (a.title ?? a.url).toLowerCase();
        const tb = (b.title ?? b.url).toLowerCase();
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
    }
    return sorted;
  }, [bookmarks, filterTags, sortOrder]);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete bookmark?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(id) },
    ]);
  };

  if (loading && bookmarks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text>Loading…</Text>
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
      {lastSummarizeError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={2}>
            Summary unavailable: {lastSummarizeError}
          </Text>
        </View>
      ) : null}

      {/* Filter / Sort toolbar */}
      <View style={styles.toolbar}>
        <TagFilterBar
          tags={tags}
          selected={filterTags}
          onToggle={toggleFilter}
          onClear={clearFilter}
        />
        <View style={styles.sortRow}>
          <SortMenu value={sortOrder} onChange={setSortOrder} />
        </View>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyHint}>Tap the + button to add your first URL.</Text>
        </View>
      ) : displayedBookmarks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>該当なし</Text>
          <Text style={styles.emptyHint}>フィルタ条件に一致するブックマークがありません。</Text>
        </View>
      ) : (
        <FlatList
          data={displayedBookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookmarkRow bookmark={item} onDelete={confirmDelete} />
          )}
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/add')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: {},
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
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
