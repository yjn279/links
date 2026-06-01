/**
 * Component tests for app/reset-password.tsx
 *
 * Branches covered:
 *   (a) submit with valid password → updateUser called with correct args
 *   (b) submit with valid password → success → router.replace('/(app)')
 *   (c) submit with empty password → updateUser not called
 *   (d) API error → error message shown
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';

jest.mock('../src/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

import ResetPasswordScreen from '../app/reset-password';

const mockAuth = (jest.requireMock('../src/supabase') as { supabase: { auth: { updateUser: jest.Mock } } }).supabase.auth;
const mockRouter = (jest.requireMock('expo-router') as { router: { push: jest.Mock; replace: jest.Mock } }).router;

function findByTestId(root: ReactTestInstance, testId: string): ReactTestInstance | null {
  const all = root.findAll((n) => n.props?.testID === testId);
  return all[0] ?? null;
}

function findTextInput(root: ReactTestInstance, testId: string): ReactTestInstance | null {
  const all = root.findAll((n) => (n.type as unknown) === 'TextInput' && n.props?.testID === testId);
  return all[0] ?? null;
}

const render = () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ResetPasswordScreen />);
  });
  return tree;
};

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    mockAuth.updateUser.mockClear();
    mockRouter.replace.mockClear();
    mockRouter.push.mockClear();
  });

  it('(a) calls updateUser with new password', async () => {
    mockAuth.updateUser.mockResolvedValueOnce({ error: null });
    const tree = render();

    const passwordInput = findTextInput(tree.root, 'reset-password-input');
    expect(passwordInput).not.toBeNull();
    act(() => {
      passwordInput!.props.onChangeText('newpassword123');
    });

    const submitBtn = findByTestId(tree.root, 'reset-submit-btn');
    expect(submitBtn).not.toBeNull();
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    expect(mockAuth.updateUser).toHaveBeenCalledTimes(1);
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
  });

  it('(b) navigates to /(app) after successful update', async () => {
    mockAuth.updateUser.mockResolvedValueOnce({ error: null });
    const tree = render();

    const passwordInput = findTextInput(tree.root, 'reset-password-input');
    act(() => {
      passwordInput!.props.onChangeText('newpassword123');
    });

    const submitBtn = findByTestId(tree.root, 'reset-submit-btn');
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/(app)');
  });

  it('(c) does not call updateUser when password is empty', async () => {
    const tree = render();

    const submitBtn = findByTestId(tree.root, 'reset-submit-btn');
    expect(submitBtn).not.toBeNull();
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    expect(mockAuth.updateUser).not.toHaveBeenCalled();
  });

  it('(d) shows error message when API returns error', async () => {
    mockAuth.updateUser.mockResolvedValueOnce({
      error: { message: 'Password should be at least 6 characters.' },
    });
    const tree = render();

    const passwordInput = findTextInput(tree.root, 'reset-password-input');
    act(() => {
      passwordInput!.props.onChangeText('abc');
    });

    const submitBtn = findByTestId(tree.root, 'reset-submit-btn');
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    const json = tree.toJSON();
    const rendered = JSON.stringify(json);
    expect(rendered).toContain('Password should be at least 6 characters.');
  });
});
