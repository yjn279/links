// SunburstBackdrop — decorative sunray pattern implemented with React Native
// Views (no react-native-svg dependency required).
// Each "ray" is a very narrow, semi-transparent View rotated from the centre.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../src/theme/tokens';

export type SunburstBackdropProps = {
  size?: number;
  rayCount?: number;
  color?: string;
  opacity?: number;
};

export function SunburstBackdrop({
  size = 280,
  rayCount = 24,
  color = colors.amber,
  opacity = 0.18,
}: SunburstBackdropProps) {
  const radius = size / 2;

  const rays = Array.from({ length: rayCount }, (_, i) => {
    const angleDeg = (360 / rayCount) * i;
    return (
      <View
        key={i}
        style={[
          styles.ray,
          {
            width: 2,
            height: radius,
            backgroundColor: color,
            opacity,
            position: 'absolute',
            top: 0,
            left: radius - 1,
            transformOrigin: `1px ${radius}px`,
            transform: [{ rotate: `${angleDeg}deg` }],
          },
        ]}
      />
    );
  });

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
      ]}
      pointerEvents="none"
    >
      {rays}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {},
});
