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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    await supabase.auth.signOut();
    set({ session: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
