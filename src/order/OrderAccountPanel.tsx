import { useState, useEffect } from 'react';
import { Loader2, LogOut, MapPin, Plus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { CustomerAddressRow, CustomerProfileRow } from '../types/online';
import type { Sale } from '../lib/supabase';
import { OrderAddressMap } from './OrderAddressMap';

interface OrderAccountPanelProps {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
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

export function OrderAccountPanel({
  user,
  signIn,
  signUp,
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
  const [authChannel, setAuthChannel] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleAuth = async (signup: boolean) => {
    setAuthErr('');
    if (!email.trim() || password.length < 6) {
      setAuthErr('Enter email and password (min 6 chars).');
      return;
    }
    setAuthBusy(true);
    const res = signup ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    if (res.error) setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    setAuthBusy(false);
    if (!res.error) {
      void onReloadOrders();
    }
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
    if (!res.error) {
      void onReloadOrders();
    }
  };

  if (!user) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-slate-400">{t.orderCreateAccountHint}</p>

        <div className="flex rounded-xl border border-white/10 p-0.5">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              authChannel === 'phone' ? 'bg-cockpit-600 text-white' : 'text-slate-400'
            }`}
            onClick={() => {
              setAuthChannel('phone');
              setAuthErr('');
            }}
          >
            {t.orderAuthSms}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
              authChannel === 'email' ? 'bg-cockpit-600 text-white' : 'text-slate-400'
            }`}
            onClick={() => {
              setAuthChannel('email');
              setAuthErr('');
            }}
          >
            {t.orderAuthEmail}
          </button>
        </div>

        {authErr ? <p className="text-sm text-rose-400">{authErr}</p> : null}

        {authChannel === 'email' ? (
          <>
            <input
              type="email"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              placeholder={t.orderEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              placeholder={t.orderPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void handleAuth(false)}
                className="flex-1 rounded-xl bg-cockpit-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {authBusy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t.orderSignIn}
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void handleAuth(true)}
                className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t.orderSignUp}
              </button>
            </div>
          </>
        ) : otpStep === 'phone' ? (
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
            <p className="text-xs text-slate-500">{t.orderInvalidPhone}</p>
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
              onClick={() => {
                setOtpStep('phone');
                setOtp('');
                setAuthErr('');
              }}
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
