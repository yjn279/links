import { useAuthStore } from './store';

/**
 * Convenience hook that re-exports the auth store with a stable selector.
 * Components import from here instead of directly from the store module.
 */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const clearError = useAuthStore((s) => s.clearError);

  return { session, loading, error, signIn, signUp, signOut, clearError };
}
