import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { BookmarkFilters } from '../../components/BookmarkFilters';
import { BookmarkRow } from '../../components/BookmarkRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { SunburstBackdrop } from '../../components/ui/SunburstBackdrop';
import { useAuth } from '../../src/auth/use-auth';
import { applyFilters } from '../../src/bookmarks/filters';
import { useBookmarksStore } from '../../src/bookmarks/store';
import { colors, motion, radii, shadows, spacing } from '../../src/theme/tokens';
import { type as typePre } from '../../src/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const searchFocused = useRef(false);

  const fabScale = useSharedValue(1);

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

  const onFabPress = () => {
    // Scale animation + haptic
    fabScale.value = withTiming(motion.fabScaleDown, { duration: motion.fabScaleDuration / 2 }, () => {
      fabScale.value = withTiming(1, { duration: motion.fabScaleDuration / 2 });
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(app)/add');
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const filtered = applyFilters(bookmarks, { tagIds: selectedTagIds, query, sortAsc });

  if (loading && bookmarks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Decorative sunburst in header area */}
      <View style={styles.headerDecoration} pointerEvents="none">
        <SunburstBackdrop size={300} opacity={0.07} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heroTitle}>Links</Text>
          <Text style={styles.heroSubtitle}>
            {bookmarks.length === 0
              ? 'Your bookmarks'
              : `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`}
          </Text>
        </View>
      </View>

      {/* Meta error banner */}
      {lastMetaError ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText} numberOfLines={2}>
            Meta fetch unavailable: {lastMetaError}
          </Text>
        </View>
      ) : null}

      {/* Search input */}
      <View style={styles.searchWrapper}>
        <Feather name="search" size={15} color={colors.greige} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search bookmarks…"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
          placeholderTextColor={colors.greige}
          clearButtonMode="while-editing"
          onFocus={() => { searchFocused.current = true; }}
          onBlur={() => { searchFocused.current = false; }}
        />
      </View>

      {/* Tag filter chips + sort toggle */}
      <BookmarkFilters
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onChangeTagIds={setSelectedTagIds}
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc((v) => !v)}
      />

      {/* List or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          title={query || selectedTagIds.length > 0 ? 'No results' : 'No bookmarks yet'}
          hint={
            query || selectedTagIds.length > 0
              ? 'Try adjusting your search or filters.'
              : 'Tap the + button to add your first URL.'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <BookmarkRow bookmark={item} onDelete={confirmDelete} animationIndex={index} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Amber FAB */}
      <AnimatedPressable
        style={[styles.fab, fabAnimatedStyle]}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="Add bookmark"
      >
        <Feather name="plus" size={28} color={colors.warmBlack} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.honeyCream },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.honeyCream,
  },
  loadingText: { ...typePre.body, color: colors.greige },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.honeyCream,
    gap: spacing.sm,
  },
  errorText: { ...typePre.sectionHeading, color: colors.terracotta },
  errorDetail: { ...typePre.bodySmall, color: colors.greige, textAlign: 'center' },
  headerDecoration: {
    position: 'absolute',
    top: -40,
    right: -40,
    pointerEvents: 'none',
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.base,
  },
  heroTitle: {
    ...typePre.displayHero,
    color: colors.warmBlack,
  },
  heroSubtitle: {
    ...typePre.bodySmall,
    color: colors.greige,
    marginTop: spacing.xs,
  },
  banner: {
    backgroundColor: colors.buttermilk,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.goldHairline,
  },
  bannerText: { ...typePre.bodySmall, color: colors.deepGold },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.goldHairline,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    backgroundColor: colors.cream,
    ...shadows.card,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    ...typePre.body,
    color: colors.warmBlack,
    padding: 0,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.fab,
  },
});
