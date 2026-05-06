import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export type CardProps = ViewProps & {
  children: React.ReactNode;
};

export function Card({ children, style, ...rest }: CardProps) {
  const { colors, radii, spacing, shadows } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cream,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.goldHairline,
      padding: spacing.base,
      ...shadows.card,
    },
  });

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}
