import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type SortOrder = 'createdAt_desc' | 'createdAt_asc' | 'title_asc';

const SORT_LABELS: Record<SortOrder, string> = {
  createdAt_desc: '登録日 新しい順',
  createdAt_asc: '登録日 古い順',
  title_asc: 'タイトル昇順',
};

type Props = {
  value: SortOrder;
  onChange: (order: SortOrder) => void;
};

export function SortMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const select = (order: SortOrder) => {
    onChange(order);
    setOpen(false);
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>⇅ {SORT_LABELS[value]}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>並び順</Text>
            {(Object.keys(SORT_LABELS) as SortOrder[]).map((order) => (
              <Pressable
                key={order}
                onPress={() => select(order)}
                style={[styles.menuItem, value === order && styles.menuItemActive]}
              >
                <Text
                  style={[styles.menuItemText, value === order && styles.menuItemTextActive]}
                >
                  {SORT_LABELS[order]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  triggerText: { fontSize: 13, color: '#333', fontWeight: '500' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  menuItemActive: { backgroundColor: '#eef0fb' },
  menuItemText: { fontSize: 15, color: '#333' },
  menuItemTextActive: { color: '#3f51b5', fontWeight: '600' },
});
