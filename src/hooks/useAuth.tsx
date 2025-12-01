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
      setLoading(true);
      
      // Primeiro, buscar dados básicos do usuário
      // Remover o filtro .eq('active', true) temporariamente para debug
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          tenant_id,
          active
        `)
        .eq('id', session.user.id)
        .single();

      console.log('Resultado da consulta do usuário:', { data: userData, error: userError });

      if (userError) {
        console.error('Erro ao carregar dados do usuário:', userError);
        // Se o erro for "PGRST116" (não encontrado), o usuário não existe na tabela
        if (userError.code === 'PGRST116') {
          console.error('Usuário não encontrado na tabela users');
          setUser(null);
          setTenant(null);
          setLoading(false);
          return;
        }
      }

      if (!userData) {
        console.error('Dados do usuário não encontrados');
        setUser(null);
        setTenant(null);
        setLoading(false);
        return;
      }

      // Verificar se o usuário está ativo
      if (!userData.active) {
        console.warn('Usuário encontrado mas está inativo:', userData);
        // Mesmo assim, vamos permitir o acesso para debug
        // setUser(null);
        // setTenant(null);
        // setLoading(false);
        // return;
      }

      // Se o usuário tem tenant_id, buscar dados do tenant
      let tenantData: Tenant | null = null;
      if (userData.tenant_id) {
        try {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, plan')
            .eq('id', userData.tenant_id)
            .single();

          if (!tenantError && tenant) {
            tenantData = tenant as Tenant;
            console.log('Dados do tenant carregados:', tenantData);
          } else {
            console.warn('Tenant não encontrado para o usuário:', userData.tenant_id, tenantError);
            // Continuar sem tenant - não é crítico
          }
        } catch (tenantErr) {
          console.warn('Erro ao carregar tenant (continuando sem tenant):', tenantErr);
          // Continuar sem tenant - não é crítico
        }
      } else {
        console.warn('Usuário não tem tenant_id associado');
      }

      console.log('Dados do usuário carregados com sucesso:', userData);
      // Sempre definir o usuário se os dados existirem, mesmo sem tenant
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        tenant_id: userData.tenant_id || '',
        active: userData.active,
      });

      setTenant(tenantData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Em caso de erro inesperado, tentar usar dados da sessão como fallback
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message, error.stack);
      }
      setLoading(false);
      // Não definir user como null aqui - deixar que o ProtectedRoute trate
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
          setLoading(true);
          // Defer user data loading to prevent deadlocks
          setTimeout(() => {
            loadUserData(session);
          }, 0);
        } else {
          console.log('Usuário deslogado ou sem sessão');
          setUser(null);
          setTenant(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Verificando sessão existente:', session?.user?.id);
      setSession(session);
      if (session) {
        loadUserData(session);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Erro ao verificar sessão:', error);
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
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
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