import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  habitualSleepTime: string;
}

interface SignUpResult {
  error: string | null;
  requiresEmailConfirmation: boolean;
  hasSession: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (updates: { fullName: string; habitualSleepTime: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (authUser: User | null): Promise<Profile | null> => {
    if (!authUser) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && data) {
        const typedProfile = data as Profile;
        setProfile(typedProfile);
        return typedProfile;
      }

      // Fallback: se o perfil ainda não foi criado pelo trigger, cria com segurança (role = 'user')
      const meta = authUser.user_metadata || {};
      const fallbackName =
        typeof meta.full_name === 'string' && meta.full_name.trim().length >= 2
          ? meta.full_name.trim()
          : (authUser.email || 'Sonhador').split('@')[0];
      const fallbackSleep =
        typeof meta.habitual_sleep_time === 'string' && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(meta.habitual_sleep_time)
          ? meta.habitual_sleep_time
          : '22:30';

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            full_name: fallbackName,
            email: (authUser.email || '').toLowerCase(),
            habitual_sleep_time: fallbackSleep,
            role: 'user',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (!insertError && inserted) {
        const typedProfile = inserted as Profile;
        setProfile(typedProfile);
        return typedProfile;
      }

      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await fetchProfile(data.session.user);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void fetchProfile(nextSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async ({ fullName, email, password, habitualSleepTime }: SignUpPayload): Promise<SignUpResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            habitual_sleep_time: habitualSleepTime,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
          return {
            error: 'Este e-mail já está cadastrado. Tente fazer login ou redefinir sua senha.',
            requiresEmailConfirmation: false,
            hasSession: false,
          };
        }
        if (msg.includes('password')) {
          return {
            error: 'A senha informada não atende aos requisitos mínimos de segurança (mínimo 6 caracteres).',
            requiresEmailConfirmation: false,
            hasSession: false,
          };
        }
        if (msg.includes('rate limit')) {
          return {
            error: 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.',
            requiresEmailConfirmation: false,
            hasSession: false,
          };
        }
        return {
          error: `Não foi possível concluir o cadastro: ${error.message}`,
          requiresEmailConfirmation: false,
          hasSession: false,
        };
      }

      // Quando a confirmação de e-mail está ativa no Supabase, e-mail duplicado retorna identities vazio
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          error: 'Este e-mail já está cadastrado. Tente fazer login ou redefinir sua senha.',
          requiresEmailConfirmation: false,
          hasSession: false,
        };
      }

      if (data.session?.user) {
        await fetchProfile(data.session.user);
        return {
          error: null,
          requiresEmailConfirmation: false,
          hasSession: true,
        };
      }

      return {
        error: null,
        requiresEmailConfirmation: true,
        hasSession: false,
      };
    },
    [fetchProfile]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed')) {
          return {
            error:
              'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou desative "Confirm email" no Supabase Auth.',
          };
        }
        // CT-02: Mensagem genérica que NÃO revela se o erro está no e-mail ou na senha
        return { error: 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.' };
      }

      if (data.user) {
        await fetchProfile(data.user);
      }

      return { error: null };
    },
    [fetchProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    return fetchProfile(user);
  }, [fetchProfile, user]);

  const updateProfile = useCallback(
    async ({ fullName, habitualSleepTime }: { fullName: string; habitualSleepTime: string }) => {
      if (!user) return { error: 'Usuário não autenticado.' };

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          habitual_sleep_time: habitualSleepTime,
        })
        .eq('id', user.id);

      if (error) {
        return { error: `Erro ao atualizar perfil: ${error.message}` };
      }

      await fetchProfile(user);
      return { error: null };
    },
    [user, fetchProfile]
  );

  const value: AuthContextValue = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
