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
  computer_name: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (employeeId: string, password: string) => Promise<{ error: any }>;
  signUp: (
    employeeId: string,
    password: string,
    fullName: string,
    department: string,
    unit: string,
    computerName?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isTechnician: boolean;
  isAdmin: boolean;
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

  // Login ด้วยเลขพนักงาน
  const signIn = async (employeeId: string, password: string) => {
    const email = `${employeeId}@repair.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // สมัครด้วยเลขพนักงาน + ชื่อ + ฝ่าย + หน่วยงาน + ชื่อเครื่อง
  const signUp = async (
    employeeId: string,
    password: string,
    fullName: string,
    department: string,
    unit: string,
    computerName?: string
  ) => {
    // เช็คเลขพนักงานซ้ำ
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
          computer_name: computerName || null,
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
        computer_name: computerName?.trim() || null,
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