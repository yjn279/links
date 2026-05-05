import { router, useLocalSearchParams } from 'expo-router';
import { AuthForm } from '../../components/AuthForm';
import { useAuth } from '../../src/auth/use-auth';
import { useAuthStore } from '../../src/auth/store';

export default function SignUpScreen() {
  const { signUp, loading, error, clearError } = useAuth();
  const { pendingUrl } = useLocalSearchParams<{ pendingUrl?: string }>();

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
    // Check for success: no error in the store after signUp
    const afterError = useAuthStore.getState().error;
    if (!afterError && pendingUrl) {
      router.replace({ pathname: '/(app)/add', params: { url: pendingUrl } });
    }
    // If no pendingUrl, auth state change will trigger redirect in the layout
  };

  return (
    <AuthForm
      mode="sign-up"
      onSubmit={handleSignUp}
      onSwitchMode={() => {
        clearError();
        router.push(
          pendingUrl
            ? { pathname: '/(auth)/login', params: { pendingUrl } }
            : '/(auth)/login'
        );
      }}
      loading={loading}
      error={error}
    />
  );
}
