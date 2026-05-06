import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tag } from '../src/types';

type Props = {
  allTags: Tag[];
  selectedTagIds: string[];
  onChangeTagIds: (ids: string[]) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
};

export function BookmarkFilters({
  allTags,
  selectedTagIds,
  onChangeTagIds,
  sortAsc,
  onToggleSort,
}: Props) {
  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChangeTagIds(selectedTagIds.filter((tid) => tid !== id));
    } else {
      onChangeTagIds([...selectedTagIds, id]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Pressable
          onPress={onToggleSort}
          style={[styles.chip, styles.sortChip]}
        >
          <Text style={styles.sortChipText}>
            {sortAsc ? 'Oldest first' : 'Newest first'}
          </Text>
        </Pressable>

        {allTags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <Pressable
              key={tag.id}
              onPress={() => toggleTag(tag.id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                #{tag.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: { backgroundColor: '#3f51b5', borderColor: '#3f51b5' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  sortChip: { backgroundColor: '#f0f0f0', borderColor: '#bbb' },
  sortChipText: { fontSize: 13, color: '#555', fontWeight: '600' },
});
