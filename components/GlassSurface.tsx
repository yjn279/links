/**
 * GlassSurface.tsx — Liquid Glass common component
 * - Native (iOS/Android): expo-blur BlurView + semi-transparent overlay
 * - Web: backdropFilter + WebkitBackdropFilter inline style
 *
 * Source: design-spec/colors_and_type.css lines 35-41
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { glass, radius } from '../src/theme/tokens';

type Tint = 'normal' | 'strong';

type Props = {
  tint?: Tint;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

export function GlassSurface({
  tint = 'normal',
  borderRadius = radius['2xl'],
  style,
  children,
}: Props) {
  const bg = tint === 'strong' ? glass.tintStrong : glass.tint;

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.base,
          {
            borderRadius,
            backgroundColor: bg,
            // @ts-expect-error web-only style properties
            backdropFilter: `saturate(140%) blur(${glass.blurAmount}px)`,
            WebkitBackdropFilter: `saturate(140%) blur(${glass.blurAmount}px)`,
            borderColor: glass.border,
            borderWidth: 1,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Native: BlurView fills absolute behind content, overlay provides tint
  return (
    <View style={[styles.base, { borderRadius, borderColor: glass.border, borderWidth: 1 }, style]}>
      <BlurView
        intensity={50}
        tint="light"
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bg, borderRadius }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    // elevation shadow (e3)
    shadowColor: '#1F1A14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
