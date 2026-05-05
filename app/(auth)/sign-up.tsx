import { router } from 'expo-router';
import { AuthForm } from '../../components/AuthForm';
import { useAuth } from '../../src/auth/use-auth';

export default function SignUpScreen() {
  const { signUp, loading, error, clearError } = useAuth();

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
    // On success, auth state change will trigger redirect in the layout
  };

  return (
    <AuthForm
      mode="sign-up"
      onSubmit={handleSignUp}
      onSwitchMode={() => {
        clearError();
        router.push('/(auth)/login');
      }}
      loading={loading}
      error={error}
    />
  );
}
