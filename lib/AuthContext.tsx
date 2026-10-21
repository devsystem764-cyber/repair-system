'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Profile = {
  id: string;
  full_name: string | null;
  role: 'user' | 'technician' | 'admin';
  department: string | null;
  unit: string | null;
  employee_id: string | null;
};

type AuthContextType = {
    signIn: (employeeId: string, password: string) => Promise<{ error: any }>;
  signUp: (
    employeeId: string,
    password: string,
    fullName: string,
    department: string,
    unit: string
  ) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

    const signIn = async (employeeId: string, password: string) => {
    // แปลงเลขพนักงานเป็นอีเมลภายในระบบ
    const email = `${employeeId}@repair.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    employeeId: string,
    password: string,
    fullName: string,
    department: string,
    unit: string
  ) => {
    // เช็คว่าเลขพนักงานซ้ำหรือยัง
    const { data: existing } = await supabase
      .from('profiles')
      .select('employee_id')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (existing) {
      return { error: { message: 'เลขประจำตัวพนักงานนี้มีในระบบแล้ว' } };
    }

    const email = `${employeeId}@repair.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          employee_id: employeeId,
          department,
          unit,
        },
      },
    });

    if (data.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        employee_id: employeeId,
        department,
        unit,
        role: 'user',
      });
    }

    return { error };
  };
  
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isTechnician = profile?.role === 'technician' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isTechnician,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // ตอน Build / SSR ให้คืนค่าว่างแทนการ throw error
    return {
      user: null,
      profile: null,
      session: null,
      loading: true,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      isTechnician: false,
      isAdmin: false,
    };
  }
  return context;
}