import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// Secure storage adapter for Supabase session persistence via expo-secure-store
// ---------------------------------------------------------------------------
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

// ---------------------------------------------------------------------------
// Auth configuration detection
// Same convention as isBackendConfigured() in src/api.ts
// ---------------------------------------------------------------------------
export function isAuthConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return !!url && !!key;
}

// ---------------------------------------------------------------------------
// Lazily initialised Supabase client (only created when auth is configured)
// ---------------------------------------------------------------------------
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isAuthConfigured()) return null;
  if (_supabase) return _supabase;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

  _supabase = createClient(url, key, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _supabase;
}

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getCurrentUserId(): Promise<string> {
  const session = await getCurrentSession();
  return session?.user.id ?? 'guest';
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Auth not configured' };
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Auth not configured' };
  const { error } = await client.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Auth not configured' };
  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    callback(null);
    return () => {};
  }
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
