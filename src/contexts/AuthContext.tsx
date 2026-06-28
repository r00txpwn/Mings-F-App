import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isLikelyE164, normalizePhoneE164 } from '../lib/phoneE164';
import { parseStaffRole, type StaffRole } from '../lib/staffRole';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when a row exists in `public.users` (staff/admin). False for customer-only auth.users. */
  isStaff: boolean;
  /**
   * True when this user may call the `user-management` Edge Function (same rules as the function:
   * JWT `app_metadata.role === 'admin'`, else `public.users.role === 'admin'`).
   */
  isAdminUser: boolean;
  /** Parsed `public.users.role` for the current staff user; `null` when not staff. */
  staffRole: StaffRole | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null | Error }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null | Error }>;
  /** SMS OTP via Supabase Auth (Twilio configured in project dashboard). */
  sendPhoneOtp: (phone: string) => Promise<{ error: AuthError | null | Error }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthError | null | Error }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: AuthError | null | Error }>;
  forgotPassword: (
    email: string,
    redirectPath?: string
  ) => Promise<{ error: AuthError | null | Error }>;
  signOut: () => Promise<void>;
  /** Re-check whether current user is present in `public.users`. */
  refetchIsStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchStaffRow(userId: string): Promise<{ isStaff: boolean; role: string | null }> {
  const { data, error } = await supabase.from('users').select('id, role').eq('id', userId).maybeSingle();
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[auth] fetchStaffRow failed:', error.message);
    }
    return { isStaff: false, role: null };
  }
  if (!data) return { isStaff: false, role: null };
  const roleRaw = (data as { role?: string | null }).role;
  const role = typeof roleRaw === 'string' && roleRaw.length > 0 ? roleRaw : 'staff';
  return { isStaff: true, role };
}

/** Mirrors `supabase/functions/user-management` admin gate (JWT claim first, then DB role). */
function isAdminForUserManagement(user: User | null, dbRole: string | null): boolean {
  if (!user) return false;
  const claimed = user.app_metadata?.role;
  if (claimed === 'admin') return true;
  if (claimed === undefined || claimed === null || claimed === '') {
    return dbRole === 'admin';
  }
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [staffDbRole, setStaffDbRole] = useState<string | null>(null);

  const isAdminUser = useMemo(() => isAdminForUserManagement(user, staffDbRole), [user, staffDbRole]);
  const staffRole = useMemo<StaffRole | null>(
    () => (staffDbRole ? parseStaffRole(staffDbRole) : null),
    [staffDbRole]
  );

  useEffect(() => {
    let cancelled = false;

    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        const row = await fetchStaffRow(nextUser.id);
        if (!cancelled) {
          setIsStaff(row.isStaff);
          setStaffDbRole(row.isStaff ? row.role : null);
        }
      } else if (!cancelled) {
        setIsStaff(false);
        setStaffDbRole(null);
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
    const { data: rateData, error: rateErr } = await supabase.rpc('rpc_request_phone_otp', {
      phone: normalized,
    });
    if (rateErr) return { error: rateErr };
    const first = Array.isArray(rateData) ? rateData[0] : null;
    if (first && first.allowed === false) {
      return {
        error: new Error(
          `Please wait ${Number(first.retry_after_seconds ?? 45)}s before requesting another code.`
        ),
      };
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

  const signInWithGoogle = async (redirectPath?: string) => {
    const origin = window.location.origin;
    const targetPath = redirectPath?.trim() ? redirectPath.trim() : window.location.pathname;
    const redirectTo = `${origin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}${window.location.search}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error };
  };

  const forgotPassword = async (email: string, redirectPath?: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { error: new Error('Enter a valid email address') };
    const origin = window.location.origin;
    const targetPath = redirectPath?.trim() ? redirectPath.trim() : '/order';
    const redirectTo = `${origin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
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
      setStaffDbRole(null);
      return;
    }
    const row = await fetchStaffRow(uid);
    setIsStaff(row.isStaff);
    setStaffDbRole(row.isStaff ? row.role : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isStaff,
        isAdminUser,
        staffRole,
        signIn,
        signUp,
        sendPhoneOtp,
        verifyPhoneOtp,
        signInWithGoogle,
        forgotPassword,
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
