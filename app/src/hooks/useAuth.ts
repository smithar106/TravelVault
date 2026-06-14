import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';

export interface User {
  id: string;
  email: string;
  travelvault_email: string;
  subscription_status: 'free' | 'pro';
  quiz_completed: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await fetchUserData(session.session.user.id);
    } else {
      setLoading(false);
    }
    const complete = await storage.hasCompletedOnboarding();
    setOnboardingComplete(complete);
  }

  async function fetchUserData(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    setUser(data);
    setLoading(false);
  }

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await storage.setOnboardingComplete();
    setOnboardingComplete(true);
  }, []);

  return {
    user,
    loading,
    onboardingComplete,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
  };
}
