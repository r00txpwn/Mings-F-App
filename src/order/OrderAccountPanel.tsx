import { useState, useEffect } from 'react';
import { Loader2, LogOut, MapPin, Plus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { CustomerAddressRow, CustomerProfileRow } from '../types/online';
import type { Sale } from '../lib/supabase';
import { OrderAddressMap } from './OrderAddressMap';

interface OrderAccountPanelProps {
  user: User | null;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: unknown }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: unknown }>;
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
  googleMapsApiKey?: string;
  t: {
    orderSignInWithGoogle: string;
    orderOrDivider: string;
    orderSignOut: string;
    orderMyOrders: string;
    orderNoOrders: string;
    orderSavedAddresses: string;
    orderCreateAccountHint: string;
    orderYourName: string;
    orderYourPhone: string;
    orderSaveProfile: string;
    orderAddAddress: string;
    orderAddressLabel: string;
    orderAddressStreet: string;
    orderSendSmsCode: string;
    orderSmsCode: string;
    orderVerifySms: string;
    orderSmsSentHint: string;
    orderChangePhone: string;
    orderInvalidPhone: string;
    orderAccountPhone: string;
    orderMapSearchPlaceholder: string;
    orderMapPinHint: string;
    orderMapLoading: string;
    orderMapUnavailable: string;
    orderDeliveryAddress: string;
  };
}

function accountLabel(user: User): string {
  return user.phone ?? user.email ?? user.user_metadata?.email ?? '';
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export function OrderAccountPanel({
  user,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
  signOut,
  profile,
  addresses,
  dataLoading,
  onSaveProfile,
  onSaveAddress,
  orders,
  ordersLoading,
  onReloadOrders,
  googleMapsApiKey,
  t,
}: OrderAccountPanelProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [authErr, setAuthErr] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
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
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setAuthErr('');
    setAuthBusy(true);
    const res = await signInWithGoogle();
    if (res.error) setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    setAuthBusy(false);
  };

  const handleSendSms = async () => {
    setAuthErr('');
    setAuthBusy(true);
    const res = await sendPhoneOtp(phoneInput);
    if (res.error) {
      const msg = String((res.error as { message?: string }).message ?? res.error);
      setAuthErr(msg.includes('Invalid phone') ? t.orderInvalidPhone : msg);
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
    setOtpStep('otp');
    setOtp('');
  };

  const handleVerifySms = async () => {
    setAuthErr('');
    setAuthBusy(true);
    const res = await verifyPhoneOtp(phoneInput, otp);
    if (res.error) setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    setAuthBusy(false);
    if (!res.error) void onReloadOrders();
  };

  if (!user) {
    return (
      <div className="space-y-5 p-4">
        <p className="text-sm text-slate-400">{t.orderCreateAccountHint}</p>

        {/* Google Sign-In — primary */}
        <button
          type="button"
          disabled={authBusy}
          onClick={() => void handleGoogleSignIn()}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <GoogleLogo />
          {t.orderSignInWithGoogle}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-500">{t.orderOrDivider}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {authErr ? <p className="text-sm text-rose-400">{authErr}</p> : null}

        {/* Phone OTP — secondary */}
        {otpStep === 'phone' ? (
          <>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              placeholder="+994501234567"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
            />
            <button
              type="button"
              disabled={authBusy || !phoneInput.trim()}
              onClick={() => void handleSendSms()}
              className="w-full rounded-xl bg-cockpit-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {authBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t.orderSendSmsCode}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">{t.orderSmsSentHint}</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 font-mono text-lg tracking-widest text-white"
              placeholder={t.orderSmsCode}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
            />
            <button
              type="button"
              disabled={authBusy || otp.length < 4}
              onClick={() => void handleVerifySms()}
              className="w-full rounded-xl bg-cockpit-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {authBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t.orderVerifySms}
            </button>
            <button
              type="button"
              className="w-full text-sm text-cockpit-400 underline"
              onClick={() => { setOtpStep('phone'); setOtp(''); setAuthErr(''); }}
            >
              {t.orderChangePhone}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-200">{accountLabel(user)}</p>
          {user.phone && user.email ? (
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
        >
          <LogOut className="h-4 w-4" />
          {t.orderSignOut}
        </button>
      </div>

      {dataLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.orderYourName}</h3>
            <input
              className="mb-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={nameEdit}
              onChange={(e) => setNameEdit(e.target.value)}
              placeholder={t.orderYourName}
            />
            <p className="mb-1 text-xs text-slate-500">{t.orderAccountPhone}</p>
            <input
              className="mb-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
              value={phoneEdit}
              onChange={(e) => setPhoneEdit(e.target.value)}
              placeholder={t.orderYourPhone}
            />
            <button
              type="button"
              disabled={savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                await onSaveProfile({ full_name: nameEdit.trim() || null, phone: phoneEdit.trim() || null });
                setSavingProfile(false);
              }}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : t.orderSaveProfile}
            </button>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MapPin className="h-4 w-4" />
              {t.orderSavedAddresses}
            </h3>
            <ul className="mb-3 space-y-2">
              {addresses.map((a) => (
                <li key={a.id} className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm">
                  <span className="font-medium text-cockpit-300">{a.label}</span>
                  <p className="text-slate-300">{a.line1}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white"
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
                  pinHint={t.orderMapPinHint}
                  loadingLabel={t.orderMapLoading}
                  unavailableLabel={t.orderMapUnavailable}
                  addressLabel={`${t.orderDeliveryAddress} *`}
                />
              ) : (
                <input
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white"
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
                    label: addrLabel.trim() || 'Home',
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
                className="inline-flex items-center gap-1 rounded-lg bg-cockpit-600/80 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                {t.orderAddAddress}
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.orderMyOrders}</h3>
            {ordersLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-cockpit-500" />
            ) : orders.length === 0 ? (
              <p className="text-sm text-slate-500">{t.orderNoOrders}</p>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm"
                  >
                    <span className="font-mono font-semibold text-cockpit-400">#{o.display_number ?? '—'}</span>
                    <span className="text-slate-400">{o.order_status}</span>
                    <span className="font-mono text-slate-200">₼{Number(o.total_price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
