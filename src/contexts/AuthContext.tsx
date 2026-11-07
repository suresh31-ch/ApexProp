import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, ensureSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'Property Manager';
  organization: string;
}

export interface AuthResult {
  error?: string;
  code?: string;
  status?: number;
  session?: Session | null;
  requiresEmailConfirmation?: boolean;
  isEmailUnconfirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<AuthResult>;
  signUp: (email: string, pass: string, fullName?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; code?: string; status?: number }>;
  resendConfirmation: (email: string) => Promise<{ error?: string; code?: string; status?: number }>;
  reloadSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthInProgress = useRef(false);

  const fetchProfile = async (client: SupabaseClient, currentUser: User) => {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name || 'Property Manager',
          role: 'Property Manager',
          organization: data.organization || 'ApexProp Assets Group'
        });
      } else {
        const profilePayload = {
          id: currentUser.id,
          email: currentUser.email || 'manager@apexprop.ai',
          full_name: currentUser.user_metadata?.full_name || 'Property Manager',
          role: 'Property Manager' as const,
          organization: 'ApexProp Assets Group'
        };
        try {
          await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
        } catch (upsertErr) {
          console.warn('[AuthContext] Auto-provision profile notice:', upsertErr);
        }
        setProfile({
          id: profilePayload.id,
          email: profilePayload.email,
          fullName: profilePayload.full_name,
          role: 'Property Manager',
          organization: profilePayload.organization
        });
      }
    } catch {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || 'manager@apexprop.ai',
        fullName: currentUser.user_metadata?.full_name || 'Property Manager',
        role: 'Property Manager',
        organization: 'ApexProp Assets Group'
      });
    }
  };

  const reloadSession = async () => {
    setIsLoading(true);
    try {
      const client = await ensureSupabaseClient();
      if (!client) {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      const { data, error } = await client.auth.getSession();
      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchProfile(client, data.session.user);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session reload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const setupAuth = async () => {
      const client = await ensureSupabaseClient();
      if (!isMounted) return;

      if (client) {
        // In Supabase v2, onAuthStateChange immediately fires INITIAL_SESSION
        const { data: authListener } = client.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!isMounted) return;
            setSession(currentSession);
            setUser(currentSession?.user || null);
            if (currentSession?.user) {
              await fetchProfile(client, currentSession.user);
            } else {
              setProfile(null);
            }
            setIsLoading(false);
          }
        );

        unsubscribe = () => {
          authListener.subscription.unsubscribe();
        };
      } else {
        if (isMounted) setIsLoading(false);
      }
    };

    setupAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<AuthResult> => {
    if (isAuthInProgress.current) {
      return { error: 'An authentication request is already in progress.' };
    }
    const client = await ensureSupabaseClient();
    if (!client) {
      return { error: 'Authentication service is unavailable. Please check your connection.' };
    }
    isAuthInProgress.current = true;
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });
      if (error) {
        const isEmailUnconfirmed =
          error.message?.toLowerCase().includes('email not confirmed') ||
          (error as any).code === 'email_not_confirmed';
        return {
          error: error.message,
          code: (error as any).code,
          status: (error as any).status,
          isEmailUnconfirmed
        };
      }
      setSession(data.session);
      setUser(data.user);
      if (data.user) await fetchProfile(client, data.user);
      return { session: data.session };
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed';
      return {
        error: msg,
        code: err?.code,
        status: err?.status,
        isEmailUnconfirmed: msg.toLowerCase().includes('email not confirmed')
      };
    } finally {
      isAuthInProgress.current = false;
    }
  };

  const signUp = async (email: string, pass: string, fullName?: string): Promise<AuthResult> => {
    if (isAuthInProgress.current) {
      return { error: 'An authentication request is already in progress.' };
    }
    const client = await ensureSupabaseClient();
    if (!client) {
      return { error: 'Authentication service is unavailable. Please check your connection.' };
    }
    isAuthInProgress.current = true;
    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: fullName || 'Property Manager',
            role: 'Property Manager'
          }
        }
      });
      if (error) {
        return {
          error: error.message,
          code: (error as any).code,
          status: (error as any).status
        };
      }
      setSession(data.session);
      setUser(data.user);
      if (data.user) await fetchProfile(client, data.user);
      return {
        session: data.session,
        requiresEmailConfirmation: !data.session && Boolean(data.user)
      };
    } catch (err: any) {
      return {
        error: err?.message || 'Registration failed',
        code: err?.code,
        status: err?.status
      };
    } finally {
      isAuthInProgress.current = false;
    }
  };

  const resendConfirmation = async (email: string) => {
    if (isAuthInProgress.current) {
      return { error: 'A request is already in progress. Please wait.' };
    }
    const client = await ensureSupabaseClient();
    if (!client) {
      return { error: 'Authentication service is unavailable.' };
    }
    isAuthInProgress.current = true;
    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email.trim()
      });
      if (error) {
        return {
          error: error.message,
          code: (error as any).code,
          status: (error as any).status
        };
      }
      return {};
    } catch (err: any) {
      return {
        error: err?.message || 'Failed to resend confirmation email.',
        code: err?.code,
        status: err?.status
      };
    } finally {
      isAuthInProgress.current = false;
    }
  };

  const resetPassword = async (email: string) => {
    if (isAuthInProgress.current) {
      return { error: 'A request is already in progress. Please wait.' };
    }
    const client = await ensureSupabaseClient();
    if (!client) {
      return { error: 'Authentication service is unavailable.' };
    }
    isAuthInProgress.current = true;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      if (error) {
        return {
          error: error.message,
          code: (error as any).code,
          status: (error as any).status
        };
      }
      return {};
    } catch (err: any) {
      return {
        error: err?.message || 'Failed to send password reset email.',
        code: err?.code,
        status: err?.status
      };
    } finally {
      isAuthInProgress.current = false;
    }
  };

  const signOut = async () => {
    const client = await ensureSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured(),
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendConfirmation,
        reloadSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
