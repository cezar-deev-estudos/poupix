'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'mobills_demo_mode_active';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // 1. Verificar se estava em modo demo salvo
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo === 'true') {
      setIsDemoMode(true);
    }

    // 2. Verificar sessão do Supabase
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(prev => (prev?.access_token === session?.access_token ? prev : session));
      setUser(prev => (prev?.id === session?.user?.id ? prev : (session?.user ?? null)));
      if (session?.user) {
        setIsDemoMode(false);
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(prev => (prev?.access_token === session?.access_token ? prev : session));
      setUser(prev => (prev?.id === session?.user?.id ? prev : (session?.user ?? null)));
      if (session?.user) {
        setIsDemoMode(false);
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Cliente Supabase não configurado.' };

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }

    return {};
  };

  const signUpWithEmail = async (email: string, password: string, name: string): Promise<{ error?: string; needsEmailConfirmation?: boolean }> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Cliente Supabase não configurado.' };

    const { error, data } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Criar perfil preliminar no Supabase se usuário foi criado
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email || email.trim(),
        name: name.trim() || 'Usuário',
        role: 'member',
        currency: 'BRL',
        monthly_income_target: 0,
      } as any);

      // Se não há sessão ativa (confirmação de email obrigatória no Supabase)
      if (!data.session) {
        return { needsEmailConfirmation: true };
      }

      setUser(data.user);
      setSession(data.session);
      setIsDemoMode(false);
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }

    return {};
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoMode,
        loginWithEmail,
        signUpWithEmail,
        signOut,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
