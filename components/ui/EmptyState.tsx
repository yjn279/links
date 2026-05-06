import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { SunburstBackdrop } from './SunburstBackdrop';

export type EmptyStateProps = {
  title: string;
  hint?: string;
};

export function EmptyState({ title, hint }: EmptyStateProps) {
  const { colors, type: t, spacing } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.sm,
    },
    backdropWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.4,
    },
    title: {
      ...t.displaySmall,
      color: colors.warmBlack,
      textAlign: 'center',
    },
    hint: {
      ...t.body,
      color: colors.greige,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.backdropWrapper}>
        <SunburstBackdrop size={220} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
