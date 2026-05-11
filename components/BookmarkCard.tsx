/**
 * BookmarkCard.tsx — vertical card with thumb gradient + pill + star + content
 * Mirrors design-spec/ui_kits/links-app/BookmarkCard.jsx + styles.css .bm-card/.bm-body/...
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SiteThumb } from './SiteThumb';
import { color, elevation, pickThumb, radius, sp, typeScale } from '../src/theme/tokens';
import { relativeTime } from '../src/lib/time';
import type { Bookmark } from '../src/types';

type Props = {
  bookmark: Bookmark;
  favorite: boolean;
  onToggleFav: (id: string) => void;
  onOpen?: (bookmark: Bookmark) => void;
};

/** Derive a display hostname from a URL string */
function siteFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0] ?? 'Web';
  } catch {
    return url.split('/')[0] ?? 'Web';
  }
}

export function BookmarkCard({ bookmark, favorite, onToggleFav, onOpen }: Props) {
  const thumbKey = pickThumb(bookmark.id);
  const site = bookmark.site_name ?? siteFromUrl(bookmark.url);
  const timeStr = relativeTime(bookmark.created_at);
  const tags = bookmark.tags.slice(0, 2);

  return (
    <Pressable
      onPress={() => onOpen?.(bookmark)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID="bm-card"
    >
      <SiteThumb
        thumbKey={thumbKey}
        site={site}
        favorite={favorite}
        onToggleFav={() => onToggleFav(bookmark.id)}
        imageUrl={bookmark.thumbnail_url}
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {bookmark.title ?? bookmark.url}
        </Text>
        {bookmark.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {bookmark.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {tags.map((t) => (
            <View key={t.id} style={styles.tag}>
              <Text style={styles.tagText}>{t.name}</Text>
            </View>
          ))}
          {tags.length > 0 && <View style={styles.sep} />}
          <Text style={styles.time}>{timeStr}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'column',
    flex: 1,
    ...elevation.e1,
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    backgroundColor: color.white,
  },
  body: {
    padding: 12,
    paddingBottom: 14,
    paddingHorizontal: 14,
    minWidth: 0,
    flex: 1,
  },
  title: {
    ...typeScale.h3,
    fontSize: 14,
    lineHeight: 14 * 1.35,
    color: color.ink,
  },
  desc: {
    ...typeScale.bodySm,
    fontSize: 12,
    lineHeight: 12 * 1.45,
    color: color.ink2,
    marginTop: sp[1],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: color.paper2,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    ...typeScale.caption,
    fontSize: 10,
    color: color.ink2,
  },
  sep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: color.ink4,
  },
  time: {
    ...typeScale.caption,
    fontSize: 11,
    color: color.ink3,
  },
});
