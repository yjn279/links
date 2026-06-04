/**
 * Component tests for app/(auth)/forgot-password.tsx
 *
 * Branches covered:
 *   (a) submit with valid email → resetPasswordForEmail called with correct args
 *   (b) submit with valid email → success → completion message shown
 *   (c) submit with empty email → resetPasswordForEmail not called
 *   (d) API error → error message shown
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';

// NOTE: jest.mock is hoisted before variable declarations.
// Define mocks inside the factory using jest.fn() directly, then
// access them via jest.requireMock after import.
jest.mock('../src/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

import ForgotPasswordScreen from '../app/(auth)/forgot-password';

// Retrieve mock references after imports
const mockAuth = (jest.requireMock('../src/supabase') as { supabase: { auth: { resetPasswordForEmail: jest.Mock } } }).supabase.auth;

/** Find the first node matching testID in the instance tree */
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
    tree = create(<ForgotPasswordScreen />);
  });
  return tree;
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    mockAuth.resetPasswordForEmail.mockClear();
  });

  it('(a) calls resetPasswordForEmail with email and redirectTo links://reset-password', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const tree = render();

    const emailInput = findTextInput(tree.root, 'forgot-email-input');
    expect(emailInput).not.toBeNull();
    act(() => {
      emailInput!.props.onChangeText('test@example.com');
    });

    const submitBtn = findByTestId(tree.root, 'forgot-submit-btn');
    expect(submitBtn).not.toBeNull();
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'links://reset-password',
    });
  });

  it('(b) shows completion message after successful submit', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const tree = render();

    const emailInput = findTextInput(tree.root, 'forgot-email-input');
    act(() => {
      emailInput!.props.onChangeText('test@example.com');
    });

    const submitBtn = findByTestId(tree.root, 'forgot-submit-btn');
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    const json = tree.toJSON();
    const rendered = JSON.stringify(json);
    expect(rendered).toContain('確認メールを送りました');
  });

  it('(c) does not call resetPasswordForEmail when email is empty', async () => {
    const tree = render();

    const submitBtn = findByTestId(tree.root, 'forgot-submit-btn');
    expect(submitBtn).not.toBeNull();
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('(d) shows error message when API returns error', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: 'User not found' },
    });
    const tree = render();

    const emailInput = findTextInput(tree.root, 'forgot-email-input');
    act(() => {
      emailInput!.props.onChangeText('unknown@example.com');
    });

    const submitBtn = findByTestId(tree.root, 'forgot-submit-btn');
    await act(async () => {
      await submitBtn!.props.onPress();
    });

    const json = tree.toJSON();
    const rendered = JSON.stringify(json);
    expect(rendered).toContain('User not found');
  });
});
