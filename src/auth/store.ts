import { create } from 'zustand';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '../supabase';

type AuthState = {
  session: SupabaseSession | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, loading: false });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession });
    });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      // Immediately sync session so callers of `await signIn()` see a non-null
      // session without waiting for the async onAuthStateChange event.
      set({ session: data.session ?? null, loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      // session may be null when email confirmation is required; only set when
      // Supabase returns a session (confirmation-disabled or auto-confirm mode).
      set({ session: data.session ?? null, loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    await supabase.auth.signOut();
    set({ session: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
