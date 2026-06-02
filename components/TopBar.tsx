/**
 * TopBar.tsx — sticky header chrome
 * Mirrors design-spec/ui_kits/links-app/TopBar.jsx + styles.css .topbar/.ic-btn/.search/.fab/.avatar
 */
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { color, radius, sp, typeScale } from '../src/theme/tokens';

type Props = {
  onMenu: () => void;
  onAdd: () => void;
  onAccount: () => void;
  query: string;
  setQuery: (q: string) => void;
  userInitial?: string;
};

export function TopBar({ onMenu, onAdd, onAccount, query, setQuery, userInitial = 'L' }: Props) {
  const [menuPressed, setMenuPressed] = useState(false);
  const [bellPressed, setBellPressed] = useState(false);
  const [fabPressed, setFabPressed] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topbar, { paddingTop: insets.top + sp[1] }]}>
      {/* Hamburger */}
      <Pressable
        onPress={onMenu}
        onPressIn={() => setMenuPressed(true)}
        onPressOut={() => setMenuPressed(false)}
        style={[styles.icBtn, menuPressed && styles.icBtnHover]}
        accessibilityLabel="Menu"
        hitSlop={4}
      >
        <Icon name="menu" size={22} color={color.ink} />
      </Pressable>

      {/* Search pill */}
      <View style={styles.search}>
        <Icon name="search" size={16} color={color.ink3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search link"
          placeholderTextColor={color.ink3}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* FAB — amber add button */}
      <Pressable
        onPress={onAdd}
        onPressIn={() => setFabPressed(true)}
        onPressOut={() => setFabPressed(false)}
        style={[styles.fab, fabPressed && styles.fabPressed]}
        accessibilityLabel="Add bookmark"
        hitSlop={4}
      >
        <Icon name="plus" size={22} color={color.ink} />
      </Pressable>

      {/* Bell with notification dot */}
      <Pressable
        onPressIn={() => setBellPressed(true)}
        onPressOut={() => setBellPressed(false)}
        style={[styles.icBtn, bellPressed && styles.icBtnHover]}
        accessibilityLabel="Notifications"
        hitSlop={4}
      >
        <Icon name="bell" size={20} color={color.ink} />
        <View style={styles.dot} />
      </Pressable>

      {/* Avatar */}
      <Pressable
        onPress={onAccount}
        style={styles.avatar}
        accessibilityLabel="Account"
        hitSlop={4}
      >
        <Text style={styles.avatarText}>{userInitial}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 14,
    backgroundColor: color.paper,
    zIndex: 5,
    // sticky handled by parent ScrollView stickyHeaderIndices or position
    // paddingTop is applied inline via useSafeAreaInsets() to handle Dynamic Island
  },
  icBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icBtnHover: {
    backgroundColor: color.paper2,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: color.catRecipes,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp[2],
    backgroundColor: color.paper2,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: typeScale.body.fontSize,
    color: color.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as object : {}),
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C9B492',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typeScale.button,
    fontSize: 13,
    color: color.paper,
  },
});
