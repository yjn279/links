import { Redirect } from 'expo-router';

// Root index redirects to the app group which handles auth gating.
export default function RootIndex() {
  return <Redirect href="/(app)" />;
}
