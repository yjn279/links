import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BookmarkCard } from '../../components/BookmarkCard';
import { EmptyLibraryState } from '../../components/EmptyLibraryState';
import { Sidebar } from '../../components/Sidebar';
import type { SidebarView } from '../../components/Sidebar';
import { StatCard } from '../../components/StatCard';
import { TopBar } from '../../components/TopBar';
import { ViewToggle } from '../../components/ViewToggle';
import type { ViewMode } from '../../components/ViewToggle';
import { useAuth } from '../../src/auth/use-auth';
import { applyFilters } from '../../src/bookmarks/filters';
import { useBookmarksStore } from '../../src/bookmarks/store';
import { color, sp, typeScale } from '../../src/theme/tokens';
import type { Bookmark } from '../../src/types';

export default function LibraryScreen() {
  const { session } = useAuth();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const loading = useBookmarksStore((s) => s.loading);
  const loadingMore = useBookmarksStore((s) => s.loadingMore);
  const error = useBookmarksStore((s) => s.error);
  const load = useBookmarksStore((s) => s.load);
  const loadMore = useBookmarksStore((s) => s.loadMore);

  const { width } = useWindowDimensions();
  // list mode always uses 1 column; grid mode uses width-based columns
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const numColumns = viewMode === 'list' ? 1 : width < 380 ? 1 : 2;

  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      void load();
    }
  }, [session, load]);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openBookmark = (_b: Bookmark) => {
    // Future: open detail or URL
  };

  const renderItem = useCallback(
    ({ item }: { item: Bookmark }) => (
      <View style={numColumns === 2 ? styles.gridCell : styles.listCell}>
        <BookmarkCard
          bookmark={item}
          favorite={favorites.has(item.id)}
          onToggleFav={toggleFav}
          onOpen={openBookmark}
        />
      </View>
    ),
    [numColumns, favorites],
  );

  // Apply sidebar view filter before text/tag filter
  const viewedBookmarks = bookmarks.filter((b) => {
    if (sidebarView === 'all') return true;
    if (sidebarView === 'favorites') return favorites.has(b.id);
    if (sidebarView === 'recent') {
      const age = Date.now() - new Date(b.created_at).getTime();
      return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
    }
    if (sidebarView === 'trending') return b.tags.length >= 1;
    return true;
  });

  const filtered = applyFilters(viewedBookmarks, {
    tagIds: [],
    query,
    sortAsc: false,
  });

  // Compute live stats
  const stats = {
    total:     { n: bookmarks.length,                           delta: '+12 this week' },
    favorites: { n: favorites.size,                             delta: '+3 today' },
    trending:  { n: bookmarks.filter((b) => b.tags.length >= 1).length, delta: '5 new' },
    recent:    {
      n: bookmarks.filter((b) => Date.now() - new Date(b.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length,
      delta: 'Last 7 days',
    },
  };

  if (loading && bookmarks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  const ListHeader = (
    <View style={styles.lib}>
      {/* H1 */}
      <Text style={styles.libH1}>Your Library</Text>

      {/* 2x2 stat grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard label="Total"     value={stats.total.n}     delta={stats.total.delta}     deltaUp />
          <StatCard label="Favorites" value={stats.favorites.n} delta={stats.favorites.delta} deltaUp />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Trending"  value={stats.trending.n}  delta={stats.trending.delta} />
          <StatCard label="Recent"    value={stats.recent.n}    delta={stats.recent.delta} />
        </View>
      </View>

      {/* Section head */}
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitle}>
          <Text style={styles.libH2} numberOfLines={1}>Bookmarks</Text>
          <Text style={styles.libCount} numberOfLines={1}>{filtered.length} items</Text>
        </View>
        <View style={styles.viewToggleWrap}>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </View>
      </View>
    </View>
  );

  const ListFooter = loadingMore ? (
    <View style={styles.footer} testID="loading-more-spinner">
      <ActivityIndicator size="small" color={color.ink3} />
    </View>
  ) : null;

  return (
    <View style={styles.app}>
      <Sidebar
        open={sidebarOpen}
        view={sidebarView}
        onSelect={setSidebarView}
        onClose={() => setSidebarOpen(false)}
        stats={stats}
      />

      {/* Sticky TopBar rendered outside FlatList for reliable sticky behavior */}
      <TopBar
        onMenu={() => setSidebarOpen(true)}
        onAdd={() => router.push('/(app)/add')}
        query={query}
        setQuery={setQuery}
        userInitial={session?.user.email?.[0]?.toUpperCase() ?? 'L'}
      />

      <FlatList
        key={`cols-${numColumns}`}
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns === 2 ? styles.columnWrapper : undefined}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={<EmptyLibraryState query={query || undefined} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        windowSize={11}
        initialNumToRender={20}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: color.paper,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  lib: {
    paddingTop: sp[1],
  },
  libH1: {
    ...typeScale.h1,
    fontSize: 44,
    lineHeight: 44 * 1.05,
    letterSpacing: 0.025 * 44,
    color: color.ink,
    marginTop: 8,
    marginBottom: 22,
  },
  statsGrid: {
    gap: 10,
    marginBottom: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  viewToggleWrap: {
    flexShrink: 0,
  },
  libH2: {
    ...typeScale.h3,
    fontSize: 18,
    color: color.ink,
    flexShrink: 0,
  },
  libCount: {
    ...typeScale.caption,
    color: color.ink3,
    flexShrink: 1,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
  },
  listCell: {
    flex: 1,
    marginBottom: 12,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.paper,
    padding: 24,
    gap: 8,
  },
  loadingText: {
    ...typeScale.body,
    color: color.ink3,
  },
  errorText: {
    ...typeScale.h3,
    color: color.catDesign,
  },
  errorDetail: {
    ...typeScale.bodySm,
    color: color.ink3,
    marginTop: 4,
    textAlign: 'center',
  },
});
