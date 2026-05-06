import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  variant?: ButtonVariant;
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ variant = 'primary', label, loading = false, disabled, style, ...rest }: ButtonProps) {
  const { colors, radii, spacing, type: t } = useTheme();

  const styles = StyleSheet.create({
    base: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primary: {
      backgroundColor: colors.amber,
    },
    ghost: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.goldHairline,
    },
    danger: {
      backgroundColor: 'rgba(192, 57, 43, 0.08)',
      borderWidth: 1,
      borderColor: colors.terracotta,
    },
    disabled: { opacity: 0.55 },
    textPrimary: {
      ...t.button,
      color: colors.warmBlack,
    },
    textGhost: {
      ...t.button,
      color: colors.greige,
    },
    textDanger: {
      ...t.button,
      color: colors.terracotta,
    },
  });

  const variantStyle =
    variant === 'primary' ? styles.primary :
    variant === 'ghost' ? styles.ghost :
    styles.danger;

  const textStyle =
    variant === 'primary' ? styles.textPrimary :
    variant === 'ghost' ? styles.textGhost :
    styles.textDanger;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.8 },
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.warmBlack : colors.greige} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}
