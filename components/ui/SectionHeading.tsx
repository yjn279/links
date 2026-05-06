import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export type SectionHeadingProps = TextProps & {
  children: React.ReactNode;
};

export function SectionHeading({ children, style, ...rest }: SectionHeadingProps) {
  const { colors, type: t, spacing } = useTheme();

  const styles = StyleSheet.create({
    heading: {
      ...t.sectionHeading,
      color: colors.warmBlack,
      marginBottom: spacing.sm,
    },
  });

  return (
    <Text style={[styles.heading, style]} {...rest}>
      {children}
    </Text>
  );
}
