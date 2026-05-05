import { router } from 'expo-router';
import { AuthForm } from '../../components/AuthForm';
import { useAuth } from '../../src/auth/use-auth';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
    // Navigation is handled by the auth layout redirect
  };

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      onSwitchMode={() => {
        clearError();
        router.push('/(auth)/sign-up');
      }}
      loading={loading}
      error={error}
    />
  );
}
