import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const storageAdapter = Platform.OS === 'web'
  ? {
      getItem: (key: string) =>
        typeof globalThis.localStorage !== 'undefined'
          ? globalThis.localStorage.getItem(key)
          : null,
      setItem: (key: string, value: string) => {
        if (typeof globalThis.localStorage !== 'undefined') {
          globalThis.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof globalThis.localStorage !== 'undefined') {
          globalThis.localStorage.removeItem(key);
        }
      },
    }
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

// Public demo Supabase project. Anyone who clones the repo can run the app
// with zero setup — sign-up creates a per-user account whose data is isolated
// by Row Level Security. To use your own project instead, set
// EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in `.env.local`.
const DEMO_SUPABASE_URL = 'https://tsyojfeunxqpvxpgknrq.supabase.co';
const DEMO_SUPABASE_ANON_KEY = 'sb_publishable_KokgJ-OE4J17qMASTsaUDw_N0YFZ1QH';

function resolveUrl(): string {
  const env = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return env.length > 0 ? env : DEMO_SUPABASE_URL;
}

function resolveAnonKey(): string {
  const env = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return env.length > 0 ? env : DEMO_SUPABASE_ANON_KEY;
}

/** Returns true when a usable URL+key pair is available (env or demo fallback). */
export function isSupabaseConfigured(): boolean {
  return resolveUrl().length > 0 && resolveAnonKey().length > 0;
}

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, creating it on first call.
 * Falls back to the public demo project when env vars are unset, so callers
 * (including the boot-time guard) get a working client by default.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  _client = createClient(resolveUrl(), resolveAnonKey(), {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

/**
 * Backward-compatible named export.
 * All call-sites that do `import { supabase } from '../supabase'` continue to
 * work unchanged.  The Proxy defers the real createClient() call to the first
 * property access, so merely importing this module no longer throws when env
 * vars are absent.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});
