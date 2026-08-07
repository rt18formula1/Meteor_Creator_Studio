"use client";

import { create } from "zustand";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type AuthUser,
} from "@/lib/supabase/client";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  configured: isSupabaseConfigured(),
  init: () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      set({ loading: false, configured: false, user: null });
      return () => {};
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) set({ user: data.user ?? null, loading: false, configured: true });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  },
  signIn: async (email, password) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return "Supabase が未設定です。.env に URL と anon key を追加してください。";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },
  signUp: async (email, password) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return "Supabase が未設定です。.env に URL と anon key を追加してください。";
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  },
  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
