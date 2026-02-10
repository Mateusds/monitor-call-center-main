import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'supervisor' | 'operador';

export interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  cargo: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: UserRole[];
  requires_password_change: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      setProfile({
        ...profileData,
        roles: rolesData.map(r => r.role as UserRole),
        requires_password_change: profileData.requires_password_change ?? false
      });
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil do usuário');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto
          }
        }
      });

      if (error) throw error;
      
      toast.success('Conta criada com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast.success('Login realizado com sucesso!');
      return { data, error: null };
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return profile?.roles.includes(role) ?? false;
  };

  const isAdmin = () => hasRole('admin');
  const isSupervisor = () => hasRole('supervisor');
  const isOperador = () => hasRole('operador');

  const updatePasswordChangeStatus = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ requires_password_change: false })
      .eq('id', user.id);
      
    if (!error) {
      setProfile(prev => prev ? { ...prev, requires_password_change: false } : null);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isSupervisor,
    isOperador,
    updatePasswordChangeStatus
  };
}