
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Fetch user profile from public.users table
  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Fallback if profile doesn't exist yet (trigger might be slow)
        return {
          id: userId,
          email: email,
          name: email.split('@')[0],
          role: UserRole.USER,
        } as User;
      }

      return data as User;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const initAuth = async () => {
      try {
        // Race between auth check and 10s timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        setSession(session);
        mounted.current = true;

        // Timeout guard
        const timeoutTimer = setTimeout(async () => {
          if (mounted.current) {
            console.error('Auth initialization timeout');
            // Force cleanup if we time out
            await supabase.auth.signOut();
            localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL + '-auth-token');
            setLoading(false);
          }
        }, 10000); // 10s timeout

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!mounted.current) return;
          clearTimeout(timeoutTimer);
          setSession(session);
          if (session?.user) {
            fetchUserProfile(session.user.id, session.user.email!).then(profile => {
              if (mounted.current) {
                setUser(profile);
                setLoading(false);
              }
            });
          } else {
            setLoading(false);
          }
        }).catch(err => {
          console.error('Auth getSession error:', err);
          if (mounted.current) setLoading(false);
        });

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted.current) return;
          setSession(session);
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id, session.user.email!);
            setUser(profile);
          } else {
            setUser(null);
          }
        });

        return () => {
          mounted.current = false;
          clearTimeout(timeoutTimer);
          subscription.unsubscribe();
        };
      }, []);

  // Login function with password authentication
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);

    // Real Supabase Login with Password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updatedData: Partial<User>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update(updatedData)
      .eq('user_id', user.id);

    if (!error) {
      setUser(prev => prev ? { ...prev, ...updatedData } : null);
    } else {
      console.error("Failed to update user:", error);
    }
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, logout, updateUser }), [user, loading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
