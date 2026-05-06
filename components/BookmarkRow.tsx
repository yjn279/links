import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import type { Bookmark } from '../src/types';
import { colors, motion, radii, shadows, spacing } from '../src/theme/tokens';
import { type as typePre } from '../src/theme/typography';

type Props = {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  animationIndex?: number;
};

function extractHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function BookmarkRow({ bookmark, onDelete, animationIndex = 0 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue<number>(motion.fadeInTranslateY);

  useEffect(() => {
    const delay = animationIndex * motion.staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.fadeInDuration }));
    translateY.value = withDelay(delay, withTiming(0, { duration: motion.fadeInDuration }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const openUrl = async () => {
    try {
      await WebBrowser.openBrowserAsync(bookmark.url);
    } catch {
      // ignore
    }
  };

  const openEdit = () => {
    router.push({ pathname: '/(app)/edit/[id]', params: { id: bookmark.id } });
  };

  const imageUri = bookmark.favicon_url ?? undefined;
  const host = extractHost(bookmark.url);

  return (
    <Animated.View style={[styles.animWrapper, animatedStyle]}>
      <Pressable
        onPress={openUrl}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {/* Left: favicon / link icon */}
        <View style={styles.iconCol}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.favicon} onError={() => {}} />
          ) : (
            <View style={styles.faviconPlaceholder}>
              <Feather name="link" size={16} color={colors.deepGold} />
            </View>
          )}
        </View>

        {/* Right: content */}
        <View style={styles.bodyCol}>
          {/* Host name small caps */}
          <Text style={styles.host} numberOfLines={1}>
            {host}
          </Text>

          {/* Title in Display font */}
          <Text style={styles.title} numberOfLines={2}>
            {bookmark.title ?? bookmark.url}
          </Text>

          {/* Description / memo */}
          {bookmark.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {bookmark.description}
            </Text>
          ) : null}

          {/* Tag chips */}
          {bookmark.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {bookmark.tags.map((t) => (
                <View key={t.id} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{t.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable onPress={openEdit} style={styles.actionBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit bookmark">
            <Feather name="edit-2" size={15} color={colors.greige} />
          </Pressable>
          <Pressable
            onPress={() => onDelete(bookmark.id)}
            style={styles.actionBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Delete bookmark"
          >
            <Feather name="trash-2" size={15} color={colors.terracotta} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animWrapper: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
    padding: spacing.base,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconCol: {
    marginTop: 2,
  },
  favicon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
  },
  faviconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.buttermilk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyCol: { flex: 1, gap: 3 },
  host: {
    ...typePre.caption,
    color: colors.greige,
  },
  title: {
    ...typePre.displaySmall,
    fontSize: 16,
    lineHeight: 20,
    color: colors.warmBlack,
  },
  description: {
    ...typePre.bodySmall,
    color: colors.greige,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagChip: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.buttermilk,
    borderWidth: 1,
    borderColor: colors.goldHairline,
  },
  tagText: {
    ...typePre.bodySmall,
    fontSize: 11,
    color: colors.deepGold,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: 2,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
