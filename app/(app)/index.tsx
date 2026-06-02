import { openBrowserAsync } from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BookmarkCard } from '../../components/BookmarkCard';
import { EmptyLibraryState } from '../../components/EmptyLibraryState';
import { FilterSortBar } from '../../components/FilterSortBar';
import { Sidebar } from '../../components/Sidebar';
import type { SidebarView } from '../../components/Sidebar';
import { StatCard } from '../../components/StatCard';
import { TopBar } from '../../components/TopBar';
import { ViewToggle } from '../../components/ViewToggle';
import type { ViewMode } from '../../components/ViewToggle';
import { useAuth } from '../../src/auth/use-auth';
import { isOpenableUrl } from '../../src/lib/url';
import { applyFilters } from '../../src/bookmarks/filters';
import type { SortKey } from '../../src/bookmarks/filters';
import { useBookmarksStore } from '../../src/bookmarks/store';
import { color, sp, typeScale } from '../../src/theme/tokens';
import type { Bookmark } from '../../src/types';

export default function LibraryScreen() {
  const { session } = useAuth();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const loading = useBookmarksStore((s) => s.loading);
  const error = useBookmarksStore((s) => s.error);
  const load = useBookmarksStore((s) => s.load);

  const { width } = useWindowDimensions();
  const numColumns = width < 380 ? 1 : 2;

  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sidebarView, setSidebarView] = useState<SidebarView>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const tags = useBookmarksStore((s) => s.tags);

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
    tagIds: selectedTagIds,
    query,
    sortKey,
    sortAsc,
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

  // Build rows for the grid layout
  const gridItems: (Bookmark | null)[][] = [];
  if (viewMode === 'grid' && numColumns === 2) {
    for (let i = 0; i < filtered.length; i += 2) {
      gridItems.push([filtered[i] ?? null, filtered[i + 1] ?? null]);
    }
  }

  const openBookmark = (b: Bookmark) => {
    if (isOpenableUrl(b.url)) {
      void openBrowserAsync(b.url);
    } else {
      Alert.alert('開けません', 'このリンクは開けません。');
    }
  };

  const editBookmark = (b: Bookmark) => {
    router.push({ pathname: '/(app)/edit/[id]', params: { id: b.id } });
  };

  return (
    <View style={styles.app}>
      <Sidebar
        open={sidebarOpen}
        view={sidebarView}
        onSelect={setSidebarView}
        onClose={() => setSidebarOpen(false)}
        onSettings={() => router.push('/(app)/settings')}
        stats={stats}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.main}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* TopBar — sticky */}
        <TopBar
          onMenu={() => setSidebarOpen(true)}
          onAdd={() => router.push('/(app)/add')}
          onAccount={() => router.push('/(app)/settings')}
          query={query}
          setQuery={setQuery}
          userInitial={session?.user.email?.[0]?.toUpperCase() ?? 'L'}
        />

        {/* Library content */}
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

          {/* Filter and sort controls */}
          <FilterSortBar
            allTags={tags}
            selectedTagIds={selectedTagIds}
            onChangeTagIds={setSelectedTagIds}
            sortKey={sortKey}
            onChangeSortKey={setSortKey}
            sortAsc={sortAsc}
            onToggleSortAsc={() => setSortAsc((v) => !v)}
          />

          {/* Bookmark list */}
          {filtered.length === 0 ? (
            <EmptyLibraryState query={query || undefined} />
          ) : viewMode === 'grid' && numColumns === 2 ? (
            <View style={styles.gridContainer}>
              {gridItems.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((item, colIdx) =>
                    item ? (
                      <View key={item.id} style={styles.gridCell}>
                        <BookmarkCard
                          bookmark={item}
                          favorite={favorites.has(item.id)}
                          onToggleFav={toggleFav}
                          onOpen={openBookmark}
                          onLongPress={editBookmark}
                        />
                      </View>
                    ) : (
                      <View key={`empty-${rowIdx}-${colIdx}`} style={styles.gridCell} />
                    ),
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((item) => (
                <BookmarkCard
                  key={item.id}
                  bookmark={item}
                  favorite={favorites.has(item.id)}
                  onToggleFav={toggleFav}
                  onOpen={openBookmark}
                  onLongPress={editBookmark}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: color.paper,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  main: {
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
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  gridCell: {
    flex: 1,
  },
  listContainer: {
    gap: 12,
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

