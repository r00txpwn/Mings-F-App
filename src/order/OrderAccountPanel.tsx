import { useState, useEffect } from 'react';
import { Clock, Loader2, LogOut, Mail, MapPin, Phone, Plus, UserCircle2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { CustomerAddressRow, CustomerProfileRow } from '../types/online';
import type { Sale } from '../lib/supabase';
import { OrderAddressMap } from './OrderAddressMap';
import { supabase } from '../lib/supabase';

interface OrderAccountPanelProps {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: unknown }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: unknown }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: unknown }>;
  forgotPassword: (email: string, redirectPath?: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  profile: CustomerProfileRow | null;
  addresses: CustomerAddressRow[];
  dataLoading: boolean;
  onSaveProfile: (p: Partial<Pick<CustomerProfileRow, 'full_name' | 'phone'>>) => Promise<void>;
  onSaveAddress: (input: {
    label: string;
    line1: string;
    lat?: number | null;
    lng?: number | null;
    is_default?: boolean;
  }) => Promise<void>;
  orders: Sale[];
  ordersLoading: boolean;
  onReloadOrders: () => void;
  onReorder: (order: Sale) => void;
  loyaltyEnabled?: boolean;
  loyaltyRewardEveryOrders?: number;
  /** When set, address form uses map + Places (same as checkout). */
  googleMapsApiKey?: string;
  t: {
    orderSignIn: string;
    orderSignUp: string;
    orderSignOut: string;
    orderMyOrders: string;
    orderNoOrders: string;
    orderSavedAddresses: string;
    orderEmail: string;
    orderPassword: string;
    orderCreateAccountHint: string;
    orderYourName: string;
    orderYourPhone: string;
    orderSaveProfile: string;
    orderAddAddress: string;
    orderAddressLabel: string;
    orderAddressStreet: string;
    orderAuthEmail: string;
    orderAuthSms: string;
    orderAuthGoogle: string;
    orderForgotPassword: string;
    orderForgotPasswordSent: string;
    orderSignUpInlinePrompt: string;
    orderSignUpInlineAction: string;
    orderEmailConfirmAfterSignup: string;
    orderResetPasswordTitle: string;
    orderResetPasswordHint: string;
    orderResetPasswordNew: string;
    orderResetPasswordConfirm: string;
    orderResetPasswordSubmit: string;
    orderResetPasswordSuccess: string;
    orderResetPasswordMismatch: string;
    orderSendSmsCode: string;
    orderSmsCode: string;
    orderVerifySms: string;
    orderSmsSentHint: string;
    orderSmsResend: string;
    orderSmsResendWait: string;
    orderSmsCodeExpiredHint: string;
    orderSmsCodeSentConfirmation: string;
    orderChangePhone: string;
    orderInvalidPhone: string;
    orderAccountPhone: string;
    orderMapSearchPlaceholder: string;
    orderMapPinHint: string;
    orderMapLoading: string;
    orderMapUnavailable: string;
    orderDeliveryAddress: string;
    orderReorder: string;
    orderMapNoResults: string;
    orderMapSearchFailed: string;
    orderMapSelectFailed: string;
    orderMapLoadFailed: string;
    orderProfileSection: string;
    orderAddressDefaultBadge: string;
    orderAddressHomeLabel: string;
  };
}

function accountLabel(user: User): string {
  return user.phone ?? user.email ?? user.user_metadata?.email ?? '';
}

function formatOrderStatus(status: string): { label: string; tone: 'pending' | 'active' | 'done' | 'muted' } {
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('delivered')) return { label: status, tone: 'done' };
  if (s.includes('cancel') || s.includes('fail')) return { label: status, tone: 'muted' };
  if (s.includes('pending') || s.includes('await')) return { label: status, tone: 'pending' };
  return { label: status, tone: 'active' };
}

export function OrderAccountPanel({
  user,
  signIn,
  signUp,
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle,
  forgotPassword,
  signOut,
  profile,
  addresses,
  dataLoading,
  onSaveProfile,
  onSaveAddress,
  orders,
  ordersLoading,
  onReloadOrders,
  onReorder,
  loyaltyEnabled = false,
  loyaltyRewardEveryOrders = 10,
  googleMapsApiKey,
  t,
}: OrderAccountPanelProps) {
  const [authChannel, setAuthChannel] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [authErr, setAuthErr] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [otpResendAfter, setOtpResendAfter] = useState(0);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [nameEdit, setNameEdit] = useState('');
  const [phoneEdit, setPhoneEdit] = useState('');
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine, setAddrLine] = useState('');
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (profile) {
      setNameEdit(profile.full_name ?? '');
      setPhoneEdit(profile.phone ?? '');
    } else {
      setNameEdit('');
      setPhoneEdit('');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setOtpStep('phone');
      setOtp('');
      setOtpResendAfter(0);
    }
  }, [user]);

  useEffect(() => {
    if (otpResendAfter <= 0) return;
    const id = window.setInterval(() => {
      setOtpResendAfter((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [otpResendAfter]);

  useEffect(() => {
    if (authNotice !== t.orderSmsCodeSentConfirmation) return;
    const noticeTimer = window.setTimeout(() => {
      setAuthNotice('');
    }, 2000);
    return () => window.clearTimeout(noticeTimer);
  }, [authNotice, t.orderSmsCodeSentConfirmation]);

  const mapAuthErrorMessage = (raw: string): string => {
    const msg = raw.toLowerCase();
    if (msg.includes('invalid phone')) return t.orderInvalidPhone;
    if (msg.includes('before requesting another code')) {
      return t.orderSmsResendWait.replace('{seconds}', String(Math.max(1, otpResendAfter || 1)));
    }
    if (msg.includes('expired') || msg.includes('otp') || msg.includes('code')) {
      return t.orderSmsCodeExpiredHint;
    }
    return raw;
  };

  useEffect(() => {
    const detectRecoveryMode = () => {
      const query = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#')
        ? new URLSearchParams(window.location.hash.slice(1))
        : new URLSearchParams();
      const authType = query.get('type') ?? hash.get('type');
      setRecoveryMode(authType === 'recovery');
    };
    detectRecoveryMode();
    window.addEventListener('hashchange', detectRecoveryMode);
    return () => window.removeEventListener('hashchange', detectRecoveryMode);
  }, []);

  const handleAuth = async (signup: boolean) => {
    setAuthErr('');
    setAuthNotice('');
    if (!email.trim() || password.length < 6) {
      setAuthErr('Enter email and password (min 6 chars).');
      return;
    }
    setAuthBusy(true);
    const res = signup ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    if (res.error) setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    if (!res.error && signup) setAuthNotice(t.orderEmailConfirmAfterSignup);
    setAuthBusy(false);
    if (!res.error) void onReloadOrders();
  };

  const handleSendSms = async (resend = false) => {
    setAuthErr('');
    setAuthNotice('');
    setAuthBusy(true);
    const res = await sendPhoneOtp(phoneInput);
    if (res.error) {
      const msg = String((res.error as { message?: string }).message ?? res.error);
      const retryMatch = /wait\s+(\d+)s/i.exec(msg);
      if (retryMatch) {
        setOtpResendAfter(Number(retryMatch[1]));
      }
      setAuthErr(mapAuthErrorMessage(msg));
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
    setOtpStep('otp');
    setOtp('');
    setOtpResendAfter(45);
    if (resend) {
      setAuthNotice(t.orderSmsCodeSentConfirmation);
    }
  };

  const handleVerifySms = async () => {
    setAuthErr('');
    setAuthNotice('');
    setAuthBusy(true);
    const res = await verifyPhoneOtp(phoneInput, otp);
    if (res.error) {
      const msg = String((res.error as { message?: string }).message ?? res.error);
      setAuthErr(mapAuthErrorMessage(msg));
    }
    setAuthBusy(false);
    if (!res.error) void onReloadOrders();
  };

  const handleForgotPassword = async () => {
    setAuthErr('');
    setAuthNotice('');
    if (!email.trim()) {
      setAuthErr('Enter email and password (min 6 chars).');
      return;
    }
    setAuthBusy(true);
    const res = await forgotPassword(email.trim(), '/order');
    if (res.error) {
      setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    } else {
      setAuthNotice(t.orderForgotPasswordSent);
    }
    setAuthBusy(false);
  };

  const handleResetPassword = async () => {
    setAuthErr('');
    setAuthNotice('');
    if (newPassword.length < 6 || confirmPassword.length < 6) {
      setAuthErr('Enter email and password (min 6 chars).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthErr(t.orderResetPasswordMismatch);
      return;
    }
    setResetBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAuthErr(error.message);
      setResetBusy(false);
      return;
    }
    setResetBusy(false);
    setRecoveryMode(false);
    setNewPassword('');
    setConfirmPassword('');
    setAuthNotice(t.orderResetPasswordSuccess);
    if (window.location.hash) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  if (recoveryMode) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        <div className="ming-card-raised relative overflow-hidden p-6">
          <p className="ming-eyebrow mb-2">Ming&apos;s · Security</p>
          <h2 className="ming-display text-[26px] leading-tight text-ming-bone">{t.orderResetPasswordTitle}</h2>
          <p className="mt-1.5 text-sm text-ming-ash">{t.orderResetPasswordHint}</p>

          {authErr ? (
            <p className="mt-4 rounded-xl border border-ming-red/40 bg-ming-red/10 px-3 py-2 text-[13px] text-ming-red">
              {authErr}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            <input
              type="password"
              className="ming-input"
              placeholder={t.orderResetPasswordNew}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <input
              type="password"
              className="ming-input"
              placeholder={t.orderResetPasswordConfirm}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              disabled={resetBusy}
              onClick={() => void handleResetPassword()}
              className="ming-btn-primary w-full justify-center"
            >
              {resetBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : t.orderResetPasswordSubmit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6">
        <div className="ming-card-raised relative overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-ming-red/20 blur-3xl" />

          <p className="ming-eyebrow mb-2">Ming&apos;s · Sign in</p>
          <h2 className="ming-display text-[26px] leading-tight text-ming-bone">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-ming-ash">{t.orderCreateAccountHint}</p>

          <div className="ming-segmented mt-5 w-full">
            <button
              type="button"
              className={`ming-segmented-btn flex-1 justify-center ${
                authChannel === 'phone' ? 'ming-segmented-btn-active' : ''
              }`}
              onClick={() => {
                setAuthChannel('phone');
                setAuthErr('');
              }}
            >
              <Phone className="h-4 w-4" />
              {t.orderAuthSms}
            </button>
            <button
              type="button"
              className={`ming-segmented-btn flex-1 justify-center ${
                authChannel === 'email' ? 'ming-segmented-btn-active' : ''
              }`}
              onClick={() => {
                setAuthChannel('email');
                setAuthErr('');
              }}
            >
              <Mail className="h-4 w-4" />
              {t.orderAuthEmail}
            </button>
          </div>

          {authErr ? (
            <p className="mt-4 rounded-xl border border-ming-red/40 bg-ming-red/10 px-3 py-2 text-[13px] text-ming-red">
              {authErr}
            </p>
          ) : null}
          {authChannel === 'phone' && otpStep === 'otp' && authErr === t.orderSmsCodeExpiredHint ? (
            <button
              type="button"
              className="ming-btn-ghost mt-2 w-full justify-center"
              disabled={authBusy || !phoneInput.trim()}
              onClick={() => void handleSendSms(true)}
            >
              {authBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : t.orderSmsResend}
            </button>
          ) : null}
          {authNotice ? (
            <p className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-300">
              {authNotice}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={authBusy}
              onClick={async () => {
                setAuthErr('');
                setAuthBusy(true);
                const res = await signInWithGoogle('/order');
                if (res.error) {
                  setAuthErr(String((res.error as { message?: string }).message ?? res.error));
                }
                setAuthBusy(false);
              }}
              className="ming-btn-ghost w-full justify-center"
            >
              {t.orderAuthGoogle}
            </button>

            <div className="h-px w-full bg-white/10" />

            {authChannel === 'email' ? (
              <>
                <input
                  type="email"
                  className="ming-input"
                  placeholder={t.orderEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <input
                  type="password"
                  className="ming-input"
                  placeholder={t.orderPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void handleAuth(false)}
                  className="ming-btn-primary w-full justify-center"
                >
                  {authBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : t.orderSignIn}
                </button>
                <div className="flex items-center justify-start">
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleForgotPassword()}
                    className="ming-btn-link px-0 py-0 text-[13px]"
                  >
                    {t.orderForgotPassword}
                  </button>
                </div>
                <p className="text-center text-[13px] text-ming-ash">
                  {t.orderSignUpInlinePrompt}{' '}
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleAuth(true)}
                    className="ming-btn-link inline-flex px-0 py-0 text-[13px]"
                  >
                    {t.orderSignUpInlineAction}
                  </button>
                </p>
              </>
            ) : otpStep === 'phone' ? (
              <>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="ming-input"
                  placeholder="+994 50 123 45 67"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
                <p className="text-[12px] text-ming-mute">{t.orderInvalidPhone}</p>
                <button
                  type="button"
                  disabled={authBusy || !phoneInput.trim()}
                  onClick={() => void handleSendSms()}
                  className="ming-btn-primary w-full"
                >
                  {authBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : t.orderSendSmsCode}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-ming-ash">{t.orderSmsSentHint}</p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="ming-input ming-mono text-center text-xl tracking-[0.5em]"
                  placeholder={t.orderSmsCode}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
                <button
                  type="button"
                  disabled={authBusy || otp.length < 4}
                  onClick={() => void handleVerifySms()}
                  className="ming-btn-primary w-full"
                >
                  {authBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : t.orderVerifySms}
                </button>
                <button
                  type="button"
                  className="ming-btn-link w-full justify-center"
                  onClick={() => {
                    setOtpStep('phone');
                    setOtp('');
                    setAuthErr('');
                  }}
                >
                  {t.orderChangePhone}
                </button>
                <button
                  type="button"
                  className="ming-btn-link w-full justify-center"
                  disabled={authBusy || otpResendAfter > 0}
                  onClick={() => void handleSendSms()}
                >
                  {otpResendAfter > 0
                    ? t.orderSmsResendWait.replace('{seconds}', String(otpResendAfter))
                    : t.orderSmsResend}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-28 sm:px-6">
      {/* Account header */}
      <div className="ming-card mb-5 flex items-center gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ming-red/15 text-ming-red">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ming-bone">{accountLabel(user)}</p>
          {user.phone && user.email ? (
            <p className="truncate text-[12px] text-ming-ash">{user.email}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-ming-ash transition-colors hover:border-ming-red/40 hover:bg-ming-red/10 hover:text-ming-red"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t.orderSignOut}
        </button>
      </div>

      {dataLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-ming-red" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile */}
          <section className="ming-card p-5">
            <p className="ming-eyebrow mb-3">{t.orderProfileSection}</p>
            <div className="space-y-3">
              <div>
                <label className="ming-label mb-1.5 block">{t.orderYourName}</label>
                <input
                  className="ming-input"
                  value={nameEdit}
                  onChange={(e) => setNameEdit(e.target.value)}
                  placeholder={t.orderYourName}
                />
              </div>
              <div>
                <label className="ming-label mb-1.5 block">{t.orderAccountPhone}</label>
                <input
                  className="ming-input"
                  value={phoneEdit}
                  onChange={(e) => setPhoneEdit(e.target.value)}
                  placeholder={t.orderYourPhone}
                />
              </div>
              <button
                type="button"
                disabled={savingProfile}
                onClick={async () => {
                  setSavingProfile(true);
                  await onSaveProfile({ full_name: nameEdit.trim() || null, phone: phoneEdit.trim() || null });
                  setSavingProfile(false);
                }}
                className="ming-btn-ghost"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : t.orderSaveProfile}
              </button>
            </div>
          </section>

          {/* Addresses */}
          <section className="ming-card p-5">
            <p className="ming-eyebrow mb-3 flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {t.orderSavedAddresses}
            </p>
            {addresses.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {addresses.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ming-red" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ming-bone">{a.label}</p>
                      <p className="mt-0.5 text-[13px] text-ming-ash">{a.line1}</p>
                    </div>
                    {a.is_default ? (
                      <span className="shrink-0 rounded-full bg-ming-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ming-gold">
                        {t.orderAddressDefaultBadge}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="space-y-3 rounded-xl border border-dashed border-white/10 p-3">
              <input
                className="ming-input"
                placeholder={t.orderAddressLabel}
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
              />
              {googleMapsApiKey ? (
                <OrderAddressMap
                  apiKey={googleMapsApiKey}
                  lat={addrLat}
                  lng={addrLng}
                  address={addrLine}
                  onLocationChange={({ lat, lng, address }) => {
                    setAddrLat(lat);
                    setAddrLng(lng);
                    setAddrLine(address);
                  }}
                  onAddressChange={(v) => setAddrLine(v)}
                  searchPlaceholder={t.orderMapSearchPlaceholder}
                  noResultsLabel={t.orderMapNoResults}
                  searchFailedLabel={t.orderMapSearchFailed}
                  selectFailedLabel={t.orderMapSelectFailed}
                  mapsLoadFailedLabel={t.orderMapLoadFailed}
                  pinHint={t.orderMapPinHint}
                  loadingLabel={t.orderMapLoading}
                  unavailableLabel={t.orderMapUnavailable}
                  addressLabel={`${t.orderDeliveryAddress} *`}
                />
              ) : (
                <input
                  className="ming-input"
                  placeholder={t.orderAddressStreet}
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                />
              )}
              <button
                type="button"
                disabled={savingAddr || !addrLine.trim()}
                onClick={async () => {
                  setSavingAddr(true);
                  await onSaveAddress({
                    label: addrLabel.trim() || t.orderAddressHomeLabel,
                    line1: addrLine.trim(),
                    lat: addrLat,
                    lng: addrLng,
                    is_default: addresses.length === 0,
                  });
                  setAddrLine('');
                  setAddrLat(null);
                  setAddrLng(null);
                  setSavingAddr(false);
                }}
                className="ming-btn-primary w-full"
              >
                {savingAddr ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t.orderAddAddress}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Orders */}
          <section className="ming-card p-5">
            <p className="ming-eyebrow mb-3 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {t.orderMyOrders}
            </p>
            {ordersLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-ming-red" />
            ) : orders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-ming-ash">
                {t.orderNoOrders}
              </p>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => {
                  const { label, tone } = formatOrderStatus(String(o.order_status ?? '—'));
                  const toneClass =
                    tone === 'done'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : tone === 'active'
                      ? 'bg-ming-flame/15 text-ming-flame'
                      : tone === 'pending'
                      ? 'bg-ming-gold/15 text-ming-gold'
                      : 'bg-white/[0.05] text-ming-ash';
                  return (
                    <li key={o.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="ming-mono text-[14px] font-bold text-ming-bone">
                          #{o.display_number ?? '—'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${toneClass}`}
                        >
                          {label}
                        </span>
                        <span className="ming-mono text-[14px] font-semibold text-ming-bone">
                          {Number(o.total_price).toFixed(2)} ₼
                        </span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onReorder(o)}
                          className="ming-btn-ghost px-3 py-2 text-[12px]"
                        >
                          {t.orderReorder}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {loyaltyEnabled ? (
            <section className="ming-card p-5">
              <p className="ming-eyebrow mb-3">Loyalty</p>
              <p className="text-sm text-ming-ash">
                {`Progress: ${orders.length % Math.max(1, loyaltyRewardEveryOrders)} / ${Math.max(1, loyaltyRewardEveryOrders)}`}
              </p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
