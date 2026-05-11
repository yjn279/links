/**
 * ViewToggle.tsx — Grid / List view toggle
 * Mirrors design-spec/ui_kits/links-app/styles.css .lib-view-toggle / .vt
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { color, elevation, radius } from '../src/theme/tokens';

export type ViewMode = 'grid' | 'list';

type Props = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.toggle}>
      <Pressable
        onPress={() => onChange('grid')}
        style={[styles.btn, mode === 'grid' && styles.btnActive]}
        accessibilityLabel="Grid view"
      >
        <Icon name="grid" size={16} color={mode === 'grid' ? color.ink : color.ink3} />
      </Pressable>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.btn, mode === 'list' && styles.btnActive]}
        accessibilityLabel="List view"
      >
        <Icon name="list" size={16} color={mode === 'list' ? color.ink : color.ink3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: color.paper2,
    borderRadius: radius.md,
    padding: 3,
  },
  btn: {
    width: 30,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: color.card,
    ...elevation.e1,
  },
});
