import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Bookmark } from '../src/types';
import { formatRelativeDate } from '../src/dateFormat';

type Props = {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
};

export function BookmarkRow({ bookmark, onDelete }: Props) {
  const openUrl = async () => {
    try {
      await WebBrowser.openBrowserAsync(bookmark.url);
    } catch {
      // ignore
    }
  };
  const openEdit = () => {
    router.push({ pathname: '/edit/[id]', params: { id: bookmark.id } });
  };

  return (
    <Pressable onPress={openUrl} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {/* Thumbnail (og:image) or favicon */}
      {bookmark.imageUrl ? (
        <Image
          source={{ uri: bookmark.imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          onError={() => {}}
        />
      ) : (
        <Image
          source={{ uri: bookmark.faviconUrl }}
          style={styles.favicon}
          contentFit="contain"
          onError={() => {}}
        />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {bookmark.title ?? bookmark.url}
        </Text>
        {bookmark.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {bookmark.summary}
          </Text>
        ) : null}
        {bookmark.tags.length > 0 ? (
          <Text style={styles.tags} numberOfLines={1}>
            {bookmark.tags.map((t) => `#${t}`).join(' ')}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatRelativeDate(bookmark.createdAt)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={openEdit} style={styles.actionBtn} hitSlop={8}>
          <Text style={styles.actionText}>✎</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(bookmark.id)} style={styles.actionBtn} hitSlop={8}>
          <Text style={[styles.actionText, styles.delete]}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowPressed: { backgroundColor: '#f2f2f2' },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#eaeaea',
  },
  favicon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#eaeaea',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  summary: { fontSize: 13, color: '#555', marginTop: 2 },
  tags: { fontSize: 12, color: '#666', marginTop: 4 },
  date: { fontSize: 11, color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: { fontSize: 18, color: '#555' },
  delete: { color: '#c0392b' },
});
