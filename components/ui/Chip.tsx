import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export type ChipVariant = 'default' | 'selected' | 'add';

export type ChipProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, variant = 'default', style, ...rest }: ChipProps) {
  const { colors, radii, spacing, type: t } = useTheme();

  const styles = StyleSheet.create({
    chip: {
      paddingVertical: spacing.xs + 1,
      paddingHorizontal: spacing.md - 2,
      borderRadius: radii.pill,
      borderWidth: variant === 'add' ? 1.5 : 1,
      borderColor: variant === 'selected' ? colors.deepGold : colors.goldHairline,
      backgroundColor: variant === 'selected' ? colors.buttermilk : colors.cream,
    },
    text: {
      ...t.bodySmall,
      color:
        variant === 'selected' ? colors.deepGold :
        variant === 'add' ? colors.greige :
        colors.warmBlack,
      fontFamily:
        variant === 'selected' ? t.label.fontFamily : t.bodySmall.fontFamily,
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }, style]}
      accessibilityRole="button"
      {...rest}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
