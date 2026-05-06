import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../src/theme/tokens';
import { type as typePre } from '../src/theme/typography';

type Props = {
  existingTags: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
};

export function TagChipEditor({ existingTags, selected, onChange }: Props) {
  const [draft, setDraft] = useState('');

  const allChips = useMemo(() => {
    const set = new Set<string>([...existingTags, ...selected]);
    return Array.from(set).sort();
  }, [existingTags, selected]);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const submitDraft = () => {
    const name = draft.trim().toLowerCase();
    if (!name) return;
    if (!selected.includes(name)) {
      onChange([...selected, name]);
    }
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      <View style={styles.chipWrap}>
        {allChips.length === 0 ? (
          <Text style={styles.empty}>No tags yet. Add one below.</Text>
        ) : (
          allChips.map((tag) => {
            const isSelected = selected.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggle(tag)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="new tag"
          placeholderTextColor={colors.greige}
          autoCapitalize="none"
          onSubmitEditing={submitDraft}
          returnKeyType="done"
          style={styles.input}
        />
        <Pressable
          onPress={submitDraft}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typePre.label, color: colors.warmBlack },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { ...typePre.bodySmall, color: colors.greige, fontStyle: 'italic' },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.goldHairline,
  },
  chipSelected: {
    backgroundColor: colors.buttermilk,
    borderColor: colors.deepGold,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { ...typePre.bodySmall, color: colors.warmBlack },
  chipTextSelected: {
    ...typePre.bodySmall,
    color: colors.deepGold,
    fontFamily: typePre.label.fontFamily,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.xs },
  input: {
    flex: 1,
    ...typePre.body,
    color: colors.warmBlack,
    borderWidth: 1.5,
    borderColor: colors.goldHairline,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream,
  },
  addBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  addBtnText: { ...typePre.label, color: colors.warmBlack },
});
