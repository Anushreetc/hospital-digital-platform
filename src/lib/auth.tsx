import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { accountApi } from '../services/db';
import { Profile } from '../types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True until the stored session (if any) and profile have been loaded. */
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await accountApi.getMyProfile());
    } catch (err) {
      console.error('Failed to load profile', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (!cancelled) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setProfile(null);
      // Defer the profile query so it does not run inside the auth callback.
      setTimeout(() => loadProfile(s), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value: AuthState = {
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session),
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
