import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isLikelyE164, normalizePhoneE164 } from '../lib/phoneE164';
import { parseStaffRole, type StaffRole } from '../lib/staffRole';
import { isStaffBuild } from '../lib/buildTarget';
import { logStaffAuthEvent } from '../lib/logAuthEvent';

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
  /**
   * Set when staff membership could not be verified due to a network/API error
   * (not the same as “confirmed non-staff”).
   */
  staffLookupError: string | null;
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

const STAFF_CACHE_PREFIX = 'mings:staff-profile:';
const STAFF_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StaffFetchResult =
  | { kind: 'staff'; role: string }
  | { kind: 'not_staff' }
  | { kind: 'error'; message: string };

function staffCacheKey(userId: string): string {
  return `${STAFF_CACHE_PREFIX}${userId}`;
}

function readStaffCache(userId: string): { role: string } | null {
  try {
    const raw = localStorage.getItem(staffCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string; at?: number };
    if (!parsed.role || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > STAFF_CACHE_TTL_MS) return null;
    return { role: parsed.role };
  } catch {
    return null;
  }
}

function writeStaffCache(userId: string, role: string): void {
  try {
    localStorage.setItem(staffCacheKey(userId), JSON.stringify({ role, at: Date.now() }));
  } catch {
    // ignore quota / private mode
  }
}

function clearStaffCache(userId: string): void {
  try {
    localStorage.removeItem(staffCacheKey(userId));
  } catch {
    // ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStaffRow(userId: string): Promise<StaffFetchResult> {
  const maxAttempts = 3;
  let lastMessage = 'Network error';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(400 * 2 ** (attempt - 1));

    const { data, error } = await supabase.from('users').select('id, role').eq('id', userId).maybeSingle();

    if (error) {
      lastMessage = error.message || 'Network error';
      if (import.meta.env.DEV) {
        console.warn('[auth] fetchStaffRow failed:', lastMessage, `(attempt ${attempt + 1})`);
      }
      continue;
    }

    if (!data) return { kind: 'not_staff' };

    const roleRaw = (data as { role?: string | null }).role;
    const role = typeof roleRaw === 'string' && roleRaw.length > 0 ? roleRaw : 'staff';
    writeStaffCache(userId, role);
    return { kind: 'staff', role };
  }

  const cached = readStaffCache(userId);
  if (cached) {
    return { kind: 'staff', role: cached.role };
  }

  return { kind: 'error', message: lastMessage };
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
  const [staffLookupError, setStaffLookupError] = useState<string | null>(null);

  const isAdminUser = useMemo(() => isAdminForUserManagement(user, staffDbRole), [user, staffDbRole]);
  const staffRole = useMemo<StaffRole | null>(
    () => (staffDbRole ? parseStaffRole(staffDbRole) : null),
    [staffDbRole]
  );

  const applyStaffResult = useCallback((result: StaffFetchResult) => {
    if (result.kind === 'staff') {
      setIsStaff(true);
      setStaffDbRole(result.role);
      setStaffLookupError(null);
      return;
    }
    if (result.kind === 'not_staff') {
      setIsStaff(false);
      setStaffDbRole(null);
      setStaffLookupError(null);
      return;
    }
    // Network/API error: never impersonate a confirmed non-staff user without cache.
    setIsStaff(false);
    setStaffDbRole(null);
    setStaffLookupError(result.message);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        // Warm from last successful check so a flaky first paint does not flash "not staff".
        const warm = readStaffCache(nextUser.id);
        if (warm && !cancelled) {
          setIsStaff(true);
          setStaffDbRole(warm.role);
          setStaffLookupError(null);
        }
        const row = await fetchStaffRow(nextUser.id);
        if (!cancelled) applyStaffResult(row);
      } else if (!cancelled) {
        setIsStaff(false);
        setStaffDbRole(null);
        setStaffLookupError(null);
      }
      if (!cancelled) setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void applySession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' && s?.user?.id && isStaffBuild()) {
        void logStaffAuthEvent('login', s.user.id);
      }
      void applySession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyStaffResult]);

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
    const uid = user?.id;
    if (uid && isStaffBuild()) {
      await logStaffAuthEvent('logout', uid);
    }
    if (uid) clearStaffCache(uid);
    await supabase.auth.signOut();
  };

  const refetchIsStaff = useCallback(async () => {
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    const uid = s?.user?.id;
    if (!uid) {
      setIsStaff(false);
      setStaffDbRole(null);
      setStaffLookupError(null);
      return;
    }
    const row = await fetchStaffRow(uid);
    applyStaffResult(row);
  }, [applyStaffResult]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isStaff,
        isAdminUser,
        staffRole,
        staffLookupError,
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
