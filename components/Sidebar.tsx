/**
 * Sidebar.tsx — Liquid Glass side panel with scrim
 * Mirrors design-spec/ui_kits/links-app/Sidebar.jsx + styles.css .sidebar/.sb-*
 */
import React, { useEffect } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { Icon } from './Icon';
import { color, radius, SIDEBAR_COLLECTIONS, sp, typeScale } from '../src/theme/tokens';

export type SidebarView = 'all' | 'recent' | 'favorites' | 'trending' | string;

type StatItem = { n: number; delta?: string };
type Stats = {
  total: StatItem;
  recent: StatItem;
  favorites: StatItem;
  trending: StatItem;
};

type Props = {
  open: boolean;
  view: SidebarView;
  onSelect: (view: SidebarView) => void;
  onClose: () => void;
  onSettings: () => void;
  stats: Stats;
};

export function Sidebar({ open, view, onSelect, onClose, onSettings, stats }: Props) {
  const translateX = React.useRef(new Animated.Value(-320)).current;
  const scrimOpacity = React.useRef(new Animated.Value(0)).current;
  const [scrimVisible, setScrimVisible] = React.useState(open);

  useEffect(() => {
    if (open) setScrimVisible(true);
    Animated.timing(translateX, {
      toValue: open ? 0 : -320,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(scrimOpacity, {
      toValue: open ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (!open) setScrimVisible(false);
    });
  }, [open, translateX, scrimOpacity]);

  const handleSelect = (id: SidebarView) => {
    onSelect(id);
    onClose();
  };

  const NavItem = ({
    id,
    icon,
    label,
    count,
    dotColor,
  }: {
    id: SidebarView;
    icon?: Parameters<typeof Icon>[0]['name'];
    label: string;
    count?: number;
    dotColor?: string;
  }) => {
    const active = view === id;
    return (
      <Pressable
        onPress={() => handleSelect(id)}
        style={[styles.item, active && styles.itemActive]}
      >
        {dotColor ? (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        ) : icon ? (
          <Icon name={icon} size={18} color={active ? color.ink : color.ink2} />
        ) : null}
        <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
        {count != null && (
          <Text style={[styles.itemCount, active && styles.itemCountActive]}>{count}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <>
      {/* Scrim */}
      {scrimVisible ? (
        <TouchableWithoutFeedback onPress={onClose} accessible={false}>
          <Animated.View
            style={[
              styles.scrim,
              { opacity: scrimOpacity },
              !open && { pointerEvents: 'none' as const },
            ]}
          />
        </TouchableWithoutFeedback>
      ) : null}

      {/* Sidebar panel */}
      <Animated.View
        style={[styles.sidebarWrapper, { transform: [{ translateX }] }]}
      >
        <GlassSurface tint="strong" borderRadius={0} style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.head}>
              <View style={styles.brand}>
                <View style={styles.brandMark}>
                  <Icon name="bookmark" size={20} color={color.ink} />
                </View>
                <Text style={styles.brandName}>Links</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close menu">
                <Icon name="x" size={18} color={color.ink2} />
              </Pressable>
            </View>

            {/* Navigation */}
            <View style={styles.nav}>
              <NavItem id="all"       icon="layers"   label="All Links"  count={stats.total.n} />
              <NavItem id="recent"    icon="clock"    label="Recent"     count={stats.recent.n} />
              <NavItem id="favorites" icon="star"     label="Favorites"  count={stats.favorites.n} />
              <NavItem id="trending"  icon="trending" label="Trending"   count={stats.trending.n} />
            </View>

            {/* Collections */}
            <View style={styles.group}>
              <Text style={styles.groupLabel}>COLLECTIONS</Text>
              <Icon name="plus" size={16} color={color.ink3} />
            </View>
            <View style={styles.nav}>
              {SIDEBAR_COLLECTIONS.map((c) => (
                <NavItem
                  key={c.id}
                  id={`col:${c.id}`}
                  label={c.name}
                  count={c.count}
                  dotColor={c.color}
                />
              ))}
            </View>

            {/* Footer */}
            <View style={styles.foot}>
              <Pressable
                style={styles.item}
                onPress={() => {
                  onSettings();
                  onClose();
                }}
              >
                <Icon name="settings" size={18} color={color.ink2} />
                <Text style={styles.itemLabel}>Settings</Text>
              </Pressable>
            </View>
          </ScrollView>
        </GlassSurface>
      </Animated.View>
    </>
  );
}

const SIDEBAR_WIDTH = 320;

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31,26,20,0.30)',
    zIndex: 18,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      : {}),
  },
  sidebarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    maxWidth: '88%',
    zIndex: 19,
  },
  sidebar: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderTopRightRadius: radius['3xl'],
    borderBottomRightRadius: radius['3xl'],
    borderLeftWidth: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    marginBottom: 4,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    ...typeScale.h2,
    fontSize: 26,
    color: color.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flexDirection: 'column',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: color.amber,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemLabel: {
    flex: 1,
    ...typeScale.body,
    color: color.ink,
  },
  itemLabelActive: {
    fontWeight: '600',
    color: color.ink,
  },
  itemCount: {
    ...typeScale.bodySm,
    color: color.ink3,
  },
  itemCountActive: {
    color: color.ink,
    opacity: 0.8,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 8,
  },
  groupLabel: {
    flex: 1,
    ...typeScale.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: color.ink3,
  },
  foot: {
    marginTop: sp[3],
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
});
