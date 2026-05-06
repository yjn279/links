import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tag } from '../src/types';
import { colors, radii, spacing } from '../src/theme/tokens';
import { type as typePre } from '../src/theme/typography';

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
          style={({ pressed }) => [styles.chip, styles.sortChip, pressed && styles.chipPressed]}
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
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
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
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.goldHairline,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.goldHairline,
    backgroundColor: colors.cream,
  },
  chipSelected: {
    backgroundColor: colors.buttermilk,
    borderColor: colors.deepGold,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { ...typePre.bodySmall, color: colors.warmBlack },
  chipTextSelected: { ...typePre.bodySmall, color: colors.deepGold, fontFamily: typePre.label.fontFamily },
  sortChip: { backgroundColor: colors.buttermilk, borderColor: colors.goldHairline },
  sortChipText: { ...typePre.bodySmall, color: colors.greige, fontFamily: typePre.label.fontFamily },
});
