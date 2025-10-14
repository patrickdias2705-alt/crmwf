import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  active: boolean;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: Tenant | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Cleanup function to remove auth state
export const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (session: Session) => {
    try {
      console.log('Carregando dados do usuário para:', session.user.id);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          tenant_id,
          active,
          tenants (
            id,
            name,
            plan
          )
        `)
        .eq('id', session.user.id)
        .eq('active', true)
        .single();

      console.log('Resultado da consulta:', { data, error });

      if (error || !data) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUser(null);
        setTenant(null);
        return;
      }

      console.log('Dados do usuário carregados com sucesso:', data);
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        tenant_id: data.tenant_id,
        active: data.active,
      });

      setTenant(data.tenants as Tenant);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUser(null);
      setTenant(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('Usuário logado, carregando dados...');
          // Defer user data loading to prevent deadlocks
          setTimeout(() => {
            loadUserData(session);
          }, 0);
        } else {
          console.log('Usuário deslogado ou sem sessão');
          setUser(null);
          setTenant(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Verificando sessão existente:', session?.user?.id);
      setSession(session);
      if (session) {
        loadUserData(session);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && data.session) {
        // Force page reload for clean state
        window.location.href = '/';
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'An error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
      }
      
      // Force page reload for clean state with fallback
      try {
        // Try to navigate to auth page
        window.location.href = window.location.origin + '/auth';
      } catch (navError) {
        // Fallback: reload the page and let the router handle it
        console.warn('Navigation failed, reloading page:', navError);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Final fallback: reload the page
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    tenant,
    session,
    loading,
    signIn,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}