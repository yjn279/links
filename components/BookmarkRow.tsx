import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Bookmark } from '../src/types';

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
    router.push({ pathname: '/(app)/edit/[id]', params: { id: bookmark.id } });
  };

  const imageUri = bookmark.thumbnail_url ?? bookmark.favicon_url ?? undefined;

  return (
    <Pressable onPress={openUrl} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.favicon}
          onError={() => {}}
        />
      ) : (
        <View style={[styles.favicon, styles.faviconPlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {bookmark.title ?? bookmark.url}
        </Text>
        {bookmark.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {bookmark.description}
          </Text>
        ) : null}
        {bookmark.tags.length > 0 ? (
          <Text style={styles.tags} numberOfLines={1}>
            {bookmark.tags.map((t) => `#${t.name}`).join(' ')}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={openEdit} style={styles.actionBtn} hitSlop={8}>
          <Text style={styles.actionText}>&#x270E;</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(bookmark.id)} style={styles.actionBtn} hitSlop={8}>
          <Text style={[styles.actionText, styles.delete]}>&#x2715;</Text>
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
  favicon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#eaeaea',
  },
  faviconPlaceholder: {
    backgroundColor: '#ddd',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  description: { fontSize: 13, color: '#555', marginTop: 2 },
  tags: { fontSize: 12, color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: { fontSize: 18, color: '#555' },
  delete: { color: '#c0392b' },
});
