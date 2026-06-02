/**
 * Component tests for app/(app)/settings.tsx
 *
 * Branches covered:
 *   (1) session.user.email is rendered on screen
 *   (2) Pressing "Log Out" triggers Alert.alert, and confirming calls signOut
 */

import React from 'react';
import { Alert, type AlertButton } from 'react-native';
import { act, create } from 'react-test-renderer';

// ---------- expo-router mock ----------
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

// ---------- auth store mock ----------
const mockSignOut = jest.fn();
let mockSession: { user: { email: string } } | null = {
  user: { email: 'test@example.com' },
};

jest.mock('../src/auth/store', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useAuthStore: (selector: any) =>
    selector({
      session: mockSession,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: mockSignOut,
      clearError: jest.fn(),
    }),
}));

import SettingsScreen from '../app/(app)/settings';

const render = () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<SettingsScreen />);
  });
  return tree;
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockSession = { user: { email: 'test@example.com' } };
    mockSignOut.mockClear();
  });

  it('renders session.user.email', () => {
    const tree = render();
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('test@example.com');
  });

  it('shows fallback when session is null', () => {
    mockSession = null;
    const tree = render();
    const json = JSON.stringify(tree.toJSON());
    // fallback "—" character
    expect(json).toContain('—');
  });

  it('pressing Log Out opens Alert and confirming calls signOut', async () => {
    type AlertArgs = [string, string, AlertButton[]];
    let capturedArgs: AlertArgs | null = null;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (title: string, message?: string, buttons?: AlertButton[]) => {
        capturedArgs = [title, message ?? '', buttons ?? []];
      },
    );

    const tree = render();
    const instance = tree.root;

    // Find all nodes that have an onPress prop — there is exactly one Pressable (Log Out)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pressableNodes = instance.findAll((node: any) => typeof node.props.onPress === 'function');
    expect(pressableNodes.length).toBeGreaterThan(0);

    const logoutNode = pressableNodes[0];

    act(() => {
      logoutNode.props.onPress();
    });

    // Alert should have been called once
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(capturedArgs![0]).toBe('Log out?');

    // Find the destructive "Log Out" button and press it
    const buttons: AlertButton[] = capturedArgs![2];
    const confirmBtn = buttons.find((b) => b.text === 'Log Out');
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      await confirmBtn!.onPress?.();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });
});
