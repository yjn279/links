import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Tag } from '../src/types';
import type { SortKey } from '../src/bookmarks/filters';
import { color, radius, sp, typeScale } from '../src/theme/tokens';

const SORT_KEYS: { key: SortKey; label: string }[] = [
  { key: 'created_at',  label: '登録日' },
  { key: 'updated_at',  label: '更新日' },
  { key: 'title',       label: 'タイトル' },
  { key: 'site_name',   label: 'サイト' },
];

type Props = {
  allTags: Tag[];
  selectedTagIds: string[];
  onChangeTagIds: (ids: string[]) => void;
  sortKey: SortKey;
  onChangeSortKey: (key: SortKey) => void;
  sortAsc: boolean;
  onToggleSortAsc: () => void;
};

export function FilterSortBar({
  allTags,
  selectedTagIds,
  onChangeTagIds,
  sortKey,
  onChangeSortKey,
  sortAsc,
  onToggleSortAsc,
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
      {/* Sort key selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Asc/Desc toggle */}
        <Pressable
          onPress={onToggleSortAsc}
          style={styles.sortToggle}
          accessibilityLabel={sortAsc ? '昇順' : '降順'}
          accessibilityRole="button"
        >
          <Text style={styles.sortToggleText}>
            {sortAsc ? '↑ 昇順' : '↓ 降順'}
          </Text>
        </Pressable>

        {SORT_KEYS.map(({ key, label }) => {
          const active = sortKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChangeSortKey(key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Tag chips — only shown when tags exist */}
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {allTags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => toggleTag(tag.id)}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`#${tag.name}`}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  #{tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line2,
    marginBottom: sp[3],
    gap: sp[2],
    paddingBottom: sp[2],
  },
  row: {
    flexDirection: 'row',
    gap: sp[2],
    paddingHorizontal: 0,
  },
  // Sort direction toggle
  sortToggle: {
    paddingVertical: 5,
    paddingHorizontal: sp[3],
    borderRadius: radius.pill,
    backgroundColor: color.paper2,
    borderWidth: 1,
    borderColor: color.line2,
  },
  sortToggleText: {
    ...typeScale.bodySm,
    color: color.ink2,
    fontWeight: '600',
  },
  // Sort key / tag chips (shared base)
  chip: {
    paddingVertical: 5,
    paddingHorizontal: sp[3],
    borderRadius: radius.pill,
    backgroundColor: color.paper2,
    borderWidth: 1,
    borderColor: color.line2,
  },
  chipText: {
    ...typeScale.bodySm,
    color: color.ink2,
  },
  // Active sort key chip
  chipActive: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  chipTextActive: {
    color: color.white,
    fontWeight: '600',
  },
  // Selected tag chip
  chipSelected: {
    backgroundColor: color.amber,
    borderColor: color.amberPress,
  },
  chipTextSelected: {
    color: color.ink,
    fontWeight: '600',
  },
});
