
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
  const mounted = React.useRef(true);

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

      // Map database fields to User interface
      // Database has: user_id, email, name, role, is_admin
      // User interface expects: id, email, name, role
      return {
        id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,  // Ensure role is cast to UserRole enum
      } as User;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    mounted.current = true;

    const initAuth = async () => {
      const MAX_RETRIES = 2;
      const AUTH_TIMEOUT = 10000; // Reduced from 15s to 10s to fit within loader timeout

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Calculate timeout with exponential backoff
          const timeout = AUTH_TIMEOUT * Math.pow(1.5, attempt);

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth initialization timeout')), timeout)
          );

          const sessionPromise = supabase.auth.getSession();

          const { data: { session } } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;

          if (!mounted.current) return;

          setSession(session);
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id, session.user.email!);
            if (mounted.current) {
              setUser(profile);
            }
          }

          // Success - exit retry loop
          break;
        } catch (error) {
          console.error(`Auth initialization failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);

          if (attempt === MAX_RETRIES) {
            // Final attempt failed
            if (mounted.current) {
              // Check if there's a valid cached session before forcing logout
              const cachedSession = localStorage.getItem(`sb-${new URL(import.meta.env.VITE_SUPABASE_URL || '').hostname}-auth-token`);

              if (!cachedSession) {
                // Only force cleanup if no cached session exists
                try {
                  await supabase.auth.signOut();
                } catch (signOutError) {
                  console.error('Error during forced sign out:', signOutError);
                }

                // Clear all possible session storage keys
                const storageKeys = Object.keys(localStorage);
                storageKeys.forEach(key => {
                  if (key.includes('supabase') || key.includes('sb-')) {
                    localStorage.removeItem(key);
                  }
                });
              }
            }
          } else {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      if (mounted.current) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      console.log('[AUTH] State change:', event);

      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.user.email!);
        if (mounted.current) setUser(profile);
      } else {
        if (mounted.current) setUser(null);
      }
      if (mounted.current) setLoading(false);
    });

    return () => {
      mounted.current = false;
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
    try {
      // Save current route for redirect after re-login
      const currentPath = window.location.hash.replace('#', '');
      if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.setItem('park-eazy-redirect-after-login', currentPath);
      }

      console.log('[AUTH] Logging out...');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[AUTH] Logout error:', error);
        // Continue with cleanup even if signOut fails
      }

      // Clear user state
      setUser(null);
      setSession(null);

      // Clear all Supabase-related items from localStorage
      const storageKeys = Object.keys(localStorage);
      storageKeys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      console.log('[AUTH] Logout complete');
    } catch (error) {
      console.error('[AUTH] Unexpected logout error:', error);
      // Force cleanup even on error
      setUser(null);
      setSession(null);
    }
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
