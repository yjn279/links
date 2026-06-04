import { router, useLocalSearchParams } from 'expo-router';
import { AuthForm } from '../../components/AuthForm';
import { useAuth } from '../../src/auth/use-auth';
import { useAuthStore } from '../../src/auth/store';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuth();
  const { pendingUrl } = useLocalSearchParams<{ pendingUrl?: string }>();

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
    // Check for success: no error in the store after signIn
    const afterError = useAuthStore.getState().error;
    if (!afterError && pendingUrl) {
      router.replace({ pathname: '/(app)/add', params: { url: pendingUrl } });
    }
    // If no pendingUrl, navigation is handled by the auth layout redirect
  };

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      onSwitchMode={() => {
        clearError();
        router.push(
          pendingUrl
            ? { pathname: '/(auth)/sign-up', params: { pendingUrl } }
            : '/(auth)/sign-up'
        );
      }}
      onForgotPassword={() => {
        clearError();
        router.push('/(auth)/forgot-password');
      }}
      loading={loading}
      error={error}
    />
  );
}
