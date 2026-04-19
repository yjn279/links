import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
                style={[styles.chip, isSelected && styles.chipSelected]}
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
          autoCapitalize="none"
          onSubmitEditing={submitDraft}
          returnKeyType="done"
          style={styles.input}
        />
        <Pressable onPress={submitDraft} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  empty: { color: '#888', fontSize: 13, fontStyle: 'italic' },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: { backgroundColor: '#3f51b5', borderColor: '#3f51b5' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
});
