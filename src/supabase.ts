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

/** Returns true when both required env vars are non-empty. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return url.length > 0 && key.length > 0;
}

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, creating it on first call.
 * Throws if env vars are not configured — callers must guard with
 * `isSupabaseConfigured()` before calling this in a boot context.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  _client = createClient(url, key, {
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
