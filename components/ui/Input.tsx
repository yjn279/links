import React, { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export type InputProps = TextInputProps & {
  /** Optional ref forwarding is handled by passing ref via TextInputProps */
};

export function Input({ style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colors, radii, spacing, type: t } = useTheme();

  const styles = StyleSheet.create({
    wrapper: {
      borderRadius: radii.md,
      borderWidth: 1.5,
      borderColor: focused ? colors.deepGold : colors.goldHairline,
      backgroundColor: colors.cream,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      // Gold glow ring on focus (Android: elevation, iOS: shadow)
      shadowColor: focused ? colors.deepGold : colors.transparent,
      shadowOpacity: focused ? 0.25 : 0,
      shadowRadius: focused ? 4 : 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: focused ? 3 : 0,
    },
    input: {
      ...t.body,
      color: colors.warmBlack,
      padding: 0,
    },
  });

  return (
    <View style={[styles.wrapper, style as object]}>
      <TextInput
        placeholderTextColor={colors.greige}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}
