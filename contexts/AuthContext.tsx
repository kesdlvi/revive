import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    let email = emailOrUsername;

    // Check if input is a username (doesn't contain @) or email
    if (!emailOrUsername.includes('@')) {
      // It's a username, look up the email using a database function
      const { data: emailData, error: emailError } = await supabase.rpc('get_email_by_username', {
        username_param: emailOrUsername
      });

      if (emailError || !emailData) {
        return { error: { message: 'Invalid username or password' } };
      }

      email = emailData;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Sign up the user and pass username in metadata for the database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Pass username in metadata for trigger
        },
      },
    });

    if (authError) {
      return { error: authError };
    }

    // Profile will be automatically created by database trigger
    // We'll try to create it manually as a fallback, but if it fails due to RLS,
    // we assume the trigger will handle it (or already did)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username,
        });

      if (profileError) {
        // If it's a duplicate key error, profile already exists (trigger created it)
        if (profileError.code === '23505') {
          console.log('Profile already exists (created by trigger)');
        } 
        // If it's an RLS error, the trigger should handle it (or INSERT policy is missing)
        // We'll assume the trigger will create it, so we don't fail signup
        else if (profileError.code === '42501') {
          console.warn('RLS policy error - profile should be created by trigger. If profile is missing, check trigger setup.');
          // Don't fail signup - trigger should handle profile creation
        } 
        // Other errors are unexpected
        else {
          console.error('Unexpected error creating profile:', profileError);
          return { 
            error: { 
              message: profileError.message || 'Failed to create profile. Please try again.' 
            } 
          };
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

