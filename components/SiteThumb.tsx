/**
 * SiteThumb.tsx — thumbnail background with gradient + glow + site pill + favorite star
 * Mirrors design-spec/ui_kits/links-app/BookmarkCard.jsx thumbnail section + styles.css .bm-thumb*
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { color, radius, THUMB_GRADIENTS, ThumbKey } from '../src/theme/tokens';

type Props = {
  thumbKey: ThumbKey;
  site: string;
  favorite: boolean;
  onToggleFav: () => void;
};

export function SiteThumb({ thumbKey, site, favorite, onToggleFav }: Props) {
  const gradientColors = THUMB_GRADIENTS[thumbKey] ?? THUMB_GRADIENTS.violet;

  return (
    <View style={styles.thumb}>
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* glow */}
      <View style={styles.glow} pointerEvents="none" />

      {/* site pill */}
      <View style={styles.pill}>
        <Text style={styles.pillText}>{site}</Text>
      </View>

      {/* favorite star */}
      <Pressable
        onPress={(e) => {
          // prevent card tap from firing
          e.stopPropagation?.();
          onToggleFav();
        }}
        style={({ pressed }) => [styles.fav, pressed && styles.favPressed]}
        accessibilityLabel={favorite ? 'Unfavorite' : 'Favorite'}
        hitSlop={4}
      >
        <Icon name={favorite ? 'star-fill' : 'star'} size={16} color={favorite ? color.amber : color.ink2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    aspectRatio: 16 / 10,
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    inset: 0,
    // radial gradient approximated as a translucent highlight in top-right
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // We fake the radial glow with a View that has opacity
    ...(Platform.OS === 'web'
      ? {
          background:
            'radial-gradient(220px 120px at 75% 0%, rgba(255,255,255,0.30) 0%, transparent 60%)',
        }
      : { backgroundColor: 'rgba(255,255,255,0.10)' }),
  },
  pill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.pill,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      : {}),
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: color.ink,
    lineHeight: 16,
  },
  fav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      : {}),
  },
  favPressed: {
    transform: [{ scale: 0.92 }],
  },
});
