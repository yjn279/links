import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
