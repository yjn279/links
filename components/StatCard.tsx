/**
 * StatCard.tsx — compact horizontal stat card
 * Mirrors design-spec/ui_kits/links-app/StatCard.jsx + styles.css .stat-card
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, elevation, radius, sp, typeScale } from '../src/theme/tokens';

type Props = {
  label: string;
  value: number | string;
  delta?: string;
  deltaUp?: boolean;
};

export function StatCard({ label, value, delta, deltaUp = false }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.num}>{value}</Text>
      <View style={styles.meta}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {delta ? (
          <Text style={[styles.delta, deltaUp && styles.deltaUp]}>{delta}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    ...elevation.e1,
  },
  num: {
    ...typeScale.stat,
    fontSize: 28,
    lineHeight: 28,
    letterSpacing: -0.28,
    color: color.ink,
    flexShrink: 0,
  },
  meta: {
    flexDirection: 'column',
    gap: sp[1],
    minWidth: 0,
    flex: 1,
  },
  label: {
    ...typeScale.label,
    fontSize: 10,
    letterSpacing: 0.8,
    color: color.ink3,
    textTransform: 'uppercase',
  },
  delta: {
    ...typeScale.caption,
    fontSize: 11,
    color: color.ink3,
  },
  deltaUp: {
    color: color.catTravel,
  },
});
