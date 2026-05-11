/**
 * EmptyLibraryState.tsx — 0 results empty state
 * Mirrors design-spec/ui_kits/links-app/LibraryView.jsx lines 41-46 + styles.css .lib-empty
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { color, sp, typeScale } from '../src/theme/tokens';

type Props = {
  query?: string;
};

export function EmptyLibraryState({ query }: Props) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={28} color={color.ink4} />
      {query ? (
        <Text style={styles.text}>No links match &ldquo;{query}&rdquo;</Text>
      ) : (
        <>
          <Text style={styles.text}>No bookmarks yet</Text>
          <Text style={styles.hint}>Tap the + button to add your first URL.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: sp[8],
    alignItems: 'center',
    gap: 10,
  },
  text: {
    ...typeScale.bodySm,
    color: color.ink3,
  },
  hint: {
    ...typeScale.bodySm,
    color: color.ink4,
    textAlign: 'center',
  },
});
