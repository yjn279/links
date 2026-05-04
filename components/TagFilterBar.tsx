import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
};

/**
 * Horizontal scrollable chip bar for filtering bookmarks by tag (AND logic).
 * Shares color tokens with TagChipEditor.tsx (chip / chipSelected styles).
 */
export function TagFilterBar({ tags, selected, onToggle, onClear }: Props) {
  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {selected.length > 0 ? (
          <Pressable onPress={onClear} style={[styles.chip, styles.chipClear]}>
            <Text style={[styles.chipText, styles.chipClearText]}>✕ Clear</Text>
          </Pressable>
        ) : null}
        {tags.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => onToggle(tag)}
              style={[styles.chip, isActive && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextSelected]}>
                {tag}
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
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  scroll: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: { backgroundColor: '#3f51b5', borderColor: '#3f51b5' },
  chipClear: { backgroundColor: '#f5f5f5', borderColor: '#ccc' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  chipClearText: { color: '#555' },
});
