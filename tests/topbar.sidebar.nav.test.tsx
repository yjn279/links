/**
 * Navigation handler tests for TopBar and Sidebar components.
 *
 * Branches covered:
 *   (1) TopBar avatar press fires onAccount once
 *   (2) Sidebar Settings press fires onSettings and onClose
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';

// ---------- expo-router mock (unused directly but imported transitively) ----------
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

// ---------- safe area insets mock ----------
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// ---------- GlassSurface mock (native blur) ----------
jest.mock('../components/GlassSurface', () => {
  const { View } = require('react-native');
  const GlassSurface = ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={style}>{children}</View>
  );
  GlassSurface.displayName = 'GlassSurface';
  return { GlassSurface };
});

// ---------- Icon mock ----------
jest.mock('../components/Icon', () => {
  const { View } = require('react-native');
  const Icon = ({ name }: { name: string }) => <View testID={`icon-${name}`} />;
  Icon.displayName = 'Icon';
  return { Icon };
});

const defaultStats = {
  total:     { n: 10 },
  recent:    { n: 3 },
  favorites: { n: 2 },
  trending:  { n: 1 },
};

describe('TopBar avatar navigation', () => {
  it('pressing avatar calls onAccount once', () => {
    const onAccount = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <TopBar
          onMenu={jest.fn()}
          onAdd={jest.fn()}
          onAccount={onAccount}
          query=""
          setQuery={jest.fn()}
          userInitial="T"
        />,
      );
    });

    const avatarNode = tree.root.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any) =>
        node.props.accessibilityLabel === 'Account' &&
        typeof node.props.onPress === 'function',
    );

    act(() => {
      avatarNode.props.onPress();
    });

    expect(onAccount).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar Settings navigation', () => {
  it('pressing Settings calls onSettings and onClose', () => {
    const onSettings = jest.fn();
    const onClose = jest.fn();
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Sidebar
          open={true}
          view="all"
          onSelect={jest.fn()}
          onClose={onClose}
          onSettings={onSettings}
          stats={defaultStats}
        />,
      );
    });

    // Find the Pressable that contains a "Settings" text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pressableNodes = tree.root.findAll(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node: any) =>
        node.type === 'View' || node.type?.displayName === 'Pressable'
          ? false
          : typeof node.props.onPress === 'function',
    );

    // Find the Settings pressable: it's the one containing "Settings" label
    // We search by finding a pressable whose subtree contains the text "Settings"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsPressable = tree.root.findAll((node: any) => {
      if (typeof node.props.onPress !== 'function') return false;
      try {
        const texts = node.findAll(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child: any) => child.type === 'Text' && child.props.children === 'Settings',
        );
        return texts.length > 0;
      } catch {
        return false;
      }
    });

    expect(settingsPressable.length).toBeGreaterThan(0);

    act(() => {
      settingsPressable[0].props.onPress();
    });

    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
