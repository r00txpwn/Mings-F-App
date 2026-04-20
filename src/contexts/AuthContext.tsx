import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isLikelyE164, normalizePhoneE164 } from '../lib/phoneE164';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when a row exists in `public.users` (staff/admin). False for customer-only auth.users. */
  isStaff: boolean;
  role: 'admin' | 'manager' | 'staff' | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null | Error }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null | Error }>;
  /** SMS OTP via Supabase Auth (Twilio configured in project dashboard). */
  sendPhoneOtp: (phone: string) => Promise<{ error: AuthError | null | Error }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthError | null | Error }>;
  /**
   * Google OAuth via Supabase Auth (provider configured in project dashboard).
   * `redirectTo` defaults to the current surface's origin + pathname so users
   * land back where they started the sign-in.
   */
  signInWithGoogle: (
    redirectTo?: string,
  ) => Promise<{ error: AuthError | null | Error }>;
  signOut: () => Promise<void>;
  /** Re-check whether current user is present in `public.users`. */
  refetchIsStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type StaffInfo = { isStaff: boolean; role: 'admin' | 'manager' | 'staff' | null };

async function fetchStaffInfo(userId: string): Promise<StaffInfo> {
  const { data, error } = await supabase.from('users').select('id, role').eq('id', userId).maybeSingle();
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[auth] fetchStaffInfo failed:', error.message);
    }
    return { isStaff: false, role: null };
  }
  if (!data) return { isStaff: false, role: null };
  return {
    isStaff: true,
    role: (data.role as 'admin' | 'manager' | 'staff') ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [role, setRole] = useState<'admin' | 'manager' | 'staff' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        const { isStaff: staff, role: nextRole } = await fetchStaffInfo(nextUser.id);
        if (!cancelled) {
          setIsStaff(staff);
          setRole(nextRole);
        }
      } else if (!cancelled) {
        setIsStaff(false);
        setRole(null);
      }
      if (!cancelled) setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void applySession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const sendPhoneOtp = async (phone: string) => {
    const normalized = normalizePhoneE164(phone);
    if (!isLikelyE164(normalized)) {
      return { error: new Error('Invalid phone number. Use country code, e.g. +994…') };
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: {
        shouldCreateUser: true,
      },
    });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const normalized = normalizePhoneE164(phone);
    if (!isLikelyE164(normalized)) {
      return { error: new Error('Invalid phone number') };
    }
    const code = token.replace(/\D/g, '');
    if (code.length < 4) {
      return { error: new Error('Enter the code from SMS') };
    }
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: code,
      type: 'sms',
    });
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const target =
      redirectTo ?? `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: target },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refetchIsStaff = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    const uid = s?.user?.id;
    if (!uid) {
      setIsStaff(false);
      setRole(null);
      return;
    }
    const { isStaff: staff, role: nextRole } = await fetchStaffInfo(uid);
    setIsStaff(staff);
    setRole(nextRole);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isStaff,
        role,
        signIn,
        signUp,
        sendPhoneOtp,
        verifyPhoneOtp,
        signInWithGoogle,
        signOut,
        refetchIsStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
