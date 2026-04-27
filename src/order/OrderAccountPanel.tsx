import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, Loader2, LogOut, Mail, MapPin, Phone, Plus, UserCircle2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type {
  CustomerAddressAccessMethod,
  CustomerAddressLeaveAt,
  CustomerAddressRow,
  CustomerAddressType,
  CustomerProfileRow,
} from '../types/online';
import type { Sale } from '../lib/supabase';
import { isLikelyE164, maskPhoneForOtp, normalizePhoneE164 } from '../lib/phoneE164';
import { OrderAddressMap } from './OrderAddressMap';
import { OrderCompactSelect } from './OrderCompactSelect';
import { ORDER_ADDRESS_TYPE_CONFIG } from './addressTypeConfig';
import { supabase } from '../lib/supabase';
import { Price } from '../components/Price';

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
  onSaveProfile: (
    p: Partial<Pick<CustomerProfileRow, 'full_name' | 'phone' | 'phone_verified_at'>>
  ) => Promise<void>;
  onSaveAddress: (input: {
    label: string;
    line1: string;
    address_type?: CustomerAddressType | null;
    building_name?: string | null;
    entrance?: string | null;
    apartment?: string | null;
    floor?: string | null;
    door_name_or_number?: string | null;
    company_name?: string | null;
    leave_at?: CustomerAddressLeaveAt | null;
    access_method?: CustomerAddressAccessMethod | null;
    intercom_name_or_number?: string | null;
    door_code?: string | null;
    access_other_instructions?: string | null;
    courier_instructions?: string | null;
    lat?: number | null;
    lng?: number | null;
    entry_point_lat?: number | null;
    entry_point_lng?: number | null;
    is_default?: boolean;
    id?: string;
  }) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  orders: Sale[];
  ordersLoading: boolean;
  onReloadOrders: () => void;
  onReorder: (order: Sale) => void;
  loyaltyEnabled?: boolean;
  loyaltyRewardEveryOrders?: number;
  /** When set, address form uses map + Places (same as checkout). */
  googleMapsApiKey?: string;
  t: {
    orderNavAccount: string;
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
    orderChangePhone: string;
    orderInvalidPhone: string;
    orderAccountPhone: string;
    orderMapSearchPlaceholder: string;
    orderMapPinHint: string;
    orderMapLoading: string;
    orderMapUnavailable: string;
    orderDeliveryAddress: string;
    orderReorder: string;
    orderProfileSection: string;
    orderAddressesSection: string;
    orderOrdersSection: string;
    orderAddressApartment: string;
    orderAddressFloor: string;
    orderAddressTypeTitle: string;
    orderAddressTypeApartment: string;
    orderAddressTypeHouse: string;
    orderAddressTypeOffice: string;
    orderAddressTypeHotel: string;
    orderAddressTypeOther: string;
    orderAddressBuildingName: string;
    orderAddressEntrance: string;
    orderAddressDoorNameOrNumber: string;
    orderAddressCompanyName: string;
    orderAddressLeaveAt: string;
    orderAddressLeaveAtOffice: string;
    orderAddressLeaveAtReception: string;
    orderAddressAccessMethod: string;
    orderAccessIntercom: string;
    orderAccessDoorCode: string;
    orderAccessDoorOpen: string;
    orderAddressIntercomNameOrNumber: string;
    orderAddressDoorCode: string;
    orderAddressAccessOtherInstructions: string;
    orderDeliveryNotesLabel: string;
    orderDeliveryNotesPlaceholder: string;
    orderAddressEdit: string;
    orderAddressDelete: string;
    orderAddressSetDefault: string;
    orderAddressCancelEdit: string;
    orderAddressSaveChanges: string;
    orderAddressDeleteConfirm: string;
    orderAddressDefaultBadge: string;
    orderAddressHomeLabel: string;
    orderOrderDate: string;
    orderFulfillmentLabel: string;
    orderFulfillmentDelivery: string;
    orderFulfillmentTakeaway: string;
    orderTrackOrder: string;
    orderViewDetails: string;
    orderHideDetails: string;
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
  onDeleteAddress,
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
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [nameEdit, setNameEdit] = useState('');
  const [phoneEdit, setPhoneEdit] = useState('');
  const [addrLabel, setAddrLabel] = useState(t.orderAddressHomeLabel);
  const [addrLine, setAddrLine] = useState('');
  const [addrApartment, setAddrApartment] = useState('');
  const [addrFloor, setAddrFloor] = useState('');
  const [addrType, setAddrType] = useState<CustomerAddressType>('apartment');
  const [addrBuildingName, setAddrBuildingName] = useState('');
  const [addrEntrance, setAddrEntrance] = useState('');
  const [addrDoorNameOrNumber, setAddrDoorNameOrNumber] = useState('');
  const [addrCompanyName, setAddrCompanyName] = useState('');
  const [addrLeaveAt, setAddrLeaveAt] = useState<CustomerAddressLeaveAt>('office');
  const [addrAccessMethod, setAddrAccessMethod] = useState<CustomerAddressAccessMethod>('intercom');
  const [addrIntercomNameOrNumber, setAddrIntercomNameOrNumber] = useState('');
  const [addrDoorCode, setAddrDoorCode] = useState('');
  const [addrAccessOtherInstructions, setAddrAccessOtherInstructions] = useState('');
  const [addrCourierInstructions, setAddrCourierInstructions] = useState('');
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [settingDefaultAddressId, setSettingDefaultAddressId] = useState<string | null>(null);
  const [phoneSmsBlurred, setPhoneSmsBlurred] = useState(false);
  const [phoneProfileBlurred, setPhoneProfileBlurred] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [showAnonAuthForm, setShowAnonAuthForm] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const smsPhoneNorm = normalizePhoneE164(phoneInput.trim());
  const addressTypeConfig = ORDER_ADDRESS_TYPE_CONFIG[addrType];
  const smsPhoneInvalid = phoneInput.trim().length > 0 && !isLikelyE164(smsPhoneNorm);
  const smsShowInvalidHint = phoneSmsBlurred && smsPhoneInvalid && !authErr;
  const smsInputError = phoneSmsBlurred && smsPhoneInvalid;

  const profilePhoneNorm = normalizePhoneE164(phoneEdit.trim());
  const profilePhoneInvalid = phoneEdit.trim().length > 0 && !isLikelyE164(profilePhoneNorm);
  const profileShowInvalidHint = phoneProfileBlurred && profilePhoneInvalid;
  const profileInputError = phoneProfileBlurred && profilePhoneInvalid;

  useEffect(() => {
    if (profile) {
      setNameEdit(profile.full_name ?? '');
      setPhoneEdit(profile.phone ? normalizePhoneE164(profile.phone) : '');
    } else {
      setNameEdit('');
      setPhoneEdit('');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setOtpStep('phone');
      setOtp('');
      setResendSeconds(30);
    }
  }, [user]);

  useEffect(() => {
    if (otpStep === 'phone') {
      setPhoneSmsBlurred(false);
      setResendSeconds(30);
    }
  }, [otpStep]);

  useEffect(() => {
    if (otpStep !== 'otp' || resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [otpStep, resendSeconds]);

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

  const handleSendSms = async () => {
    setAuthErr('');
    setAuthNotice('');
    setAuthBusy(true);
    const res = await sendPhoneOtp(normalizePhoneE164(phoneInput.trim()));
    if (res.error) {
      const msg = String((res.error as { message?: string }).message ?? res.error);
      setAuthErr(msg.includes('Invalid phone') ? t.orderInvalidPhone : msg);
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
    setOtpStep('otp');
    setOtp('');
    setResendSeconds(30);
  };

  const handleVerifySms = async () => {
    setAuthErr('');
    setAuthNotice('');
    setAuthBusy(true);
    const res = await verifyPhoneOtp(normalizePhoneE164(phoneInput.trim()), otp);
    if (res.error) setAuthErr(String((res.error as { message?: string }).message ?? res.error));
    setAuthBusy(false);
    if (!res.error) {
      await onSaveProfile({
        phone: normalizePhoneE164(phoneInput.trim()),
        phone_verified_at: new Date().toISOString(),
      });
      void onReloadOrders();
    }
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

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel(t.orderAddressHomeLabel);
    setAddrLine('');
    setAddrApartment('');
    setAddrFloor('');
    setAddrType('apartment');
    setAddrBuildingName('');
    setAddrEntrance('');
    setAddrDoorNameOrNumber('');
    setAddrCompanyName('');
    setAddrLeaveAt('office');
    setAddrAccessMethod('intercom');
    setAddrIntercomNameOrNumber('');
    setAddrDoorCode('');
    setAddrAccessOtherInstructions('');
    setAddrCourierInstructions('');
    setAddrLat(null);
    setAddrLng(null);
  };

  const beginEditAddress = (address: CustomerAddressRow) => {
    setEditingAddressId(address.id);
    setAddrLabel(address.label);
    setAddrLine(address.line1);
    setAddrType(address.address_type ?? 'apartment');
    setAddrBuildingName(address.building_name?.trim() ?? '');
    setAddrEntrance(address.entrance?.trim() ?? '');
    setAddrApartment(address.apartment?.trim() ?? '');
    setAddrFloor(address.floor?.trim() ?? '');
    setAddrDoorNameOrNumber(address.door_name_or_number?.trim() ?? '');
    setAddrCompanyName(address.company_name?.trim() ?? '');
    setAddrLeaveAt(address.leave_at ?? 'office');
    setAddrAccessMethod(address.access_method ?? 'intercom');
    setAddrIntercomNameOrNumber(address.intercom_name_or_number?.trim() ?? '');
    setAddrDoorCode(address.door_code?.trim() ?? '');
    setAddrAccessOtherInstructions(address.access_other_instructions?.trim() ?? '');
    setAddrCourierInstructions(address.courier_instructions?.trim() ?? '');
    setAddrLat(address.lat);
    setAddrLng(address.lng);
    setActiveSection('addresses');
  };

  useEffect(() => {
    if (!editingAddressId && !addrLabel.trim()) {
      setAddrLabel(t.orderAddressHomeLabel);
    }
  }, [editingAddressId, addrLabel, t.orderAddressHomeLabel]);

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

          <p className="ming-eyebrow mb-2">Ming&apos;s · {t.orderNavAccount}</p>
          <h2 className="ming-display text-[26px] leading-tight text-ming-bone">
            {t.orderNavAccount}
          </h2>
          <p className="mt-1.5 text-sm text-ming-ash">{t.orderCreateAccountHint}</p>

          {!showAnonAuthForm ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-ming-ash">
                {t.orderCreateAccountHint}
              </p>
              <button
                type="button"
                className="ming-btn-primary w-full justify-center"
                onClick={() => setShowAnonAuthForm(true)}
              >
                {t.orderSignIn}
              </button>
            </div>
          ) : null}

          {showAnonAuthForm ? (
            <>
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
                  className={`ming-input-focus-neutral${smsInputError ? ' ming-input-error' : ''}`}
                  placeholder="+994 50 123 45 67"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onFocus={() => setPhoneSmsBlurred(false)}
                  onBlur={() => setPhoneSmsBlurred(true)}
                  aria-invalid={smsInputError}
                />
                {smsShowInvalidHint ? (
                  <p className="text-[12px] text-ming-gold">{t.orderInvalidPhone}</p>
                ) : null}
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
                <p className="text-sm text-ming-ash">
                  {t.orderSmsSentHint.replace('{phone}', maskPhoneForOtp(phoneInput))}
                </p>
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
                  className="inline-flex w-full justify-center rounded-lg px-2 py-1.5 text-xs font-semibold text-ming-ash transition-colors hover:text-ming-bone disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={authBusy || resendSeconds > 0}
                  onClick={() => void handleSendSms()}
                >
                  {resendSeconds > 0
                    ? t.orderSmsResendWait.replace('{seconds}', String(resendSeconds))
                    : t.orderSmsResend}
                </button>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-ming-ash transition-colors hover:text-ming-bone"
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
            </>
          ) : null}
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
          <div className="ming-card p-2">
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                  activeSection === 'profile'
                    ? 'bg-ming-red/15 text-ming-bone'
                    : 'text-ming-ash hover:bg-white/[0.04] hover:text-ming-bone'
                }`}
              >
                {t.orderProfileSection}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('addresses')}
                className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                  activeSection === 'addresses'
                    ? 'bg-ming-red/15 text-ming-bone'
                    : 'text-ming-ash hover:bg-white/[0.04] hover:text-ming-bone'
                }`}
              >
                {t.orderAddressesSection}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('orders')}
                className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                  activeSection === 'orders'
                    ? 'bg-ming-red/15 text-ming-bone'
                    : 'text-ming-ash hover:bg-white/[0.04] hover:text-ming-bone'
                }`}
              >
                {t.orderOrdersSection}
              </button>
            </div>
          </div>

          {activeSection === 'profile' ? (
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
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className={`ming-input-focus-neutral${profileInputError ? ' ming-input-error' : ''}`}
                    value={phoneEdit}
                    onChange={(e) => setPhoneEdit(e.target.value)}
                    onFocus={() => setPhoneProfileBlurred(false)}
                    onBlur={() => setPhoneProfileBlurred(true)}
                    placeholder={t.orderYourPhone}
                    aria-invalid={profileInputError}
                  />
                  {profileShowInvalidHint ? (
                    <p className="text-[12px] text-ming-gold">{t.orderInvalidPhone}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={async () => {
                    setSavingProfile(true);
                    await onSaveProfile({
                      full_name: nameEdit.trim() || null,
                      phone: phoneEdit.trim() === '' ? null : normalizePhoneE164(phoneEdit),
                    });
                    setSavingProfile(false);
                  }}
                  className="ming-btn-ghost"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : t.orderSaveProfile}
                </button>
              </div>
            </section>
          ) : null}

          {activeSection === 'addresses' ? (
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
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ming-red" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ming-bone">{a.label}</p>
                          <p className="mt-0.5 text-[13px] text-ming-ash">{a.line1}</p>
                          {a.apartment ? (
                            <p className="text-[12px] text-ming-ash">{t.orderAddressApartment}: {a.apartment}</p>
                          ) : null}
                          {a.floor ? (
                            <p className="text-[12px] text-ming-ash">{t.orderAddressFloor}: {a.floor}</p>
                          ) : null}
                        </div>
                        {a.is_default ? (
                          <span className="shrink-0 rounded-full bg-ming-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ming-gold">
                            {t.orderAddressDefaultBadge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => beginEditAddress(a)}
                          className="ming-btn-ghost px-3 py-2 text-[12px]"
                        >
                          {t.orderAddressEdit}
                        </button>
                        {!a.is_default ? (
                          <button
                            type="button"
                            disabled={settingDefaultAddressId === a.id}
                            onClick={async () => {
                              setSettingDefaultAddressId(a.id);
                              await onSaveAddress({
                                id: a.id,
                                label: a.label,
                                line1: a.line1,
                                address_type: a.address_type ?? null,
                                building_name: a.building_name ?? null,
                                entrance: a.entrance ?? null,
                                apartment: a.apartment ?? null,
                                floor: a.floor ?? null,
                                door_name_or_number: a.door_name_or_number ?? null,
                                company_name: a.company_name ?? null,
                                leave_at: a.leave_at ?? null,
                                access_method: a.access_method ?? null,
                                intercom_name_or_number: a.intercom_name_or_number ?? null,
                                door_code: a.door_code ?? null,
                                access_other_instructions: a.access_other_instructions ?? null,
                                courier_instructions: a.courier_instructions ?? null,
                                lat: a.lat,
                                lng: a.lng,
                                entry_point_lat: a.entry_point_lat ?? null,
                                entry_point_lng: a.entry_point_lng ?? null,
                                is_default: true,
                              });
                              setSettingDefaultAddressId(null);
                            }}
                            className="ming-btn-ghost px-3 py-2 text-[12px]"
                          >
                            {t.orderAddressSetDefault}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={deletingAddressId === a.id}
                          onClick={async () => {
                            if (!window.confirm(t.orderAddressDeleteConfirm)) return;
                            setDeletingAddressId(a.id);
                            await onDeleteAddress(a.id);
                            if (editingAddressId === a.id) resetAddressForm();
                            setDeletingAddressId(null);
                          }}
                          className="ming-btn-ghost px-3 py-2 text-[12px] text-ming-red hover:text-ming-red"
                        >
                          {t.orderAddressDelete}
                        </button>
                      </div>
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <OrderCompactSelect
                    ariaLabel={t.orderAddressTypeTitle}
                    value={addrType}
                    onChange={(next) => setAddrType(next as CustomerAddressType)}
                    options={[
                      { value: 'apartment', label: t.orderAddressTypeApartment },
                      { value: 'house', label: t.orderAddressTypeHouse },
                      { value: 'office', label: t.orderAddressTypeOffice },
                      { value: 'hotel', label: t.orderAddressTypeHotel },
                      { value: 'other', label: t.orderAddressTypeOther },
                    ]}
                  />
                  {addressTypeConfig.showBuildingName ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressBuildingName}
                      value={addrBuildingName}
                      onChange={(e) => setAddrBuildingName(e.target.value)}
                      autoComplete="off"
                    />
                  ) : null}
                  {addressTypeConfig.showEntrance ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressEntrance}
                      value={addrEntrance}
                      onChange={(e) => setAddrEntrance(e.target.value)}
                      autoComplete="off"
                    />
                  ) : null}
                  {addressTypeConfig.showApartmentUnit ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressApartment}
                      value={addrApartment}
                      onChange={(e) => setAddrApartment(e.target.value)}
                      autoComplete="address-line2"
                    />
                  ) : null}
                  {addressTypeConfig.showFloor ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressFloor}
                      value={addrFloor}
                      onChange={(e) => setAddrFloor(e.target.value)}
                      autoComplete="off"
                    />
                  ) : null}
                  {addressTypeConfig.showDoorNameOrNumber ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressDoorNameOrNumber}
                      value={addrDoorNameOrNumber}
                      onChange={(e) => setAddrDoorNameOrNumber(e.target.value)}
                      autoComplete="off"
                    />
                  ) : null}
                  {addressTypeConfig.showCompanyName ? (
                    <input
                      className="ming-input"
                      placeholder={t.orderAddressCompanyName}
                      value={addrCompanyName}
                      onChange={(e) => setAddrCompanyName(e.target.value)}
                      autoComplete="organization"
                    />
                  ) : null}
                  {addressTypeConfig.showLeaveAt ? (
                    <OrderCompactSelect
                      ariaLabel={t.orderAddressLeaveAt}
                      value={addrLeaveAt}
                      onChange={(next) => setAddrLeaveAt(next as CustomerAddressLeaveAt)}
                      options={[
                        { value: 'office', label: t.orderAddressLeaveAtOffice },
                        { value: 'reception', label: t.orderAddressLeaveAtReception },
                      ]}
                    />
                  ) : null}
                </div>
                {addressTypeConfig.showAccessMethod ? (
                  <div className="space-y-2 rounded-xl border border-white/[0.06] bg-ming-ink/40 p-3">
                    <label className="ming-label mb-1.5 block">{t.orderAddressAccessMethod}</label>
                    <OrderCompactSelect
                      ariaLabel={t.orderAddressAccessMethod}
                      value={addrAccessMethod}
                      onChange={(next) => setAddrAccessMethod(next as CustomerAddressAccessMethod)}
                      options={[
                        { value: 'intercom', label: t.orderAccessIntercom },
                        { value: 'door_code', label: t.orderAccessDoorCode },
                        { value: 'door_open', label: t.orderAccessDoorOpen },
                        { value: 'other', label: t.orderAddressTypeOther },
                      ]}
                    />
                    {addrAccessMethod === 'intercom' ? (
                      <input
                        className="ming-input"
                        placeholder={t.orderAddressIntercomNameOrNumber}
                        value={addrIntercomNameOrNumber}
                        onChange={(e) => setAddrIntercomNameOrNumber(e.target.value)}
                        autoComplete="off"
                      />
                    ) : null}
                    {addrAccessMethod === 'door_code' ? (
                      <input
                        className="ming-input"
                        placeholder={t.orderAddressDoorCode}
                        value={addrDoorCode}
                        onChange={(e) => setAddrDoorCode(e.target.value)}
                        autoComplete="off"
                      />
                    ) : null}
                    {addrAccessMethod === 'other' ? (
                      <textarea
                        className="ming-input min-h-[74px] resize-y"
                        placeholder={t.orderAddressAccessOtherInstructions}
                        value={addrAccessOtherInstructions}
                        onChange={(e) => setAddrAccessOtherInstructions(e.target.value)}
                      />
                    ) : null}
                  </div>
                ) : null}
                {addressTypeConfig.showCourierNotes ? (
                  <textarea
                    className="ming-input min-h-[74px] resize-y"
                    placeholder={t.orderDeliveryNotesPlaceholder}
                    value={addrCourierInstructions}
                    onChange={(e) => setAddrCourierInstructions(e.target.value)}
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingAddr || !addrLine.trim()}
                    onClick={async () => {
                      setSavingAddr(true);
                      await onSaveAddress({
                        id: editingAddressId ?? undefined,
                        label: addrLabel.trim() || t.orderAddressHomeLabel,
                        line1: addrLine.trim(),
                        address_type: addrType,
                        building_name: addressTypeConfig.showBuildingName ? addrBuildingName.trim() || undefined : undefined,
                        entrance: addressTypeConfig.showEntrance ? addrEntrance.trim() || undefined : undefined,
                        apartment: addressTypeConfig.showApartmentUnit ? addrApartment.trim() || undefined : undefined,
                        floor: addressTypeConfig.showFloor ? addrFloor.trim() || undefined : undefined,
                        door_name_or_number: addressTypeConfig.showDoorNameOrNumber
                          ? addrDoorNameOrNumber.trim() || undefined
                          : undefined,
                        company_name: addressTypeConfig.showCompanyName ? addrCompanyName.trim() || undefined : undefined,
                        leave_at: addressTypeConfig.showLeaveAt ? addrLeaveAt : undefined,
                        access_method: addressTypeConfig.showAccessMethod ? addrAccessMethod : undefined,
                        intercom_name_or_number:
                          addressTypeConfig.showAccessMethod && addrAccessMethod === 'intercom'
                            ? addrIntercomNameOrNumber.trim() || undefined
                            : undefined,
                        door_code:
                          addressTypeConfig.showAccessMethod && addrAccessMethod === 'door_code'
                            ? addrDoorCode.trim() || undefined
                            : undefined,
                        access_other_instructions:
                          addressTypeConfig.showAccessMethod && addrAccessMethod === 'other'
                            ? addrAccessOtherInstructions.trim() || undefined
                            : undefined,
                        courier_instructions: addressTypeConfig.showCourierNotes
                          ? addrCourierInstructions.trim() || undefined
                          : undefined,
                        lat: addrLat,
                        lng: addrLng,
                        entry_point_lat: addrLat,
                        entry_point_lng: addrLng,
                        is_default: addresses.length === 0 || undefined,
                      });
                      resetAddressForm();
                      setSavingAddr(false);
                    }}
                    className="ming-btn-primary"
                  >
                    {savingAddr ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {editingAddressId ? t.orderAddressSaveChanges : t.orderAddAddress}
                      </>
                    )}
                  </button>
                  {editingAddressId ? (
                    <button type="button" onClick={resetAddressForm} className="ming-btn-ghost">
                      {t.orderAddressCancelEdit}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === 'orders' ? (
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
                    const isExpanded = expandedOrderId === o.id;
                    const saleItems = Array.isArray(o.sale_items) ? o.sale_items : [];
                    const trackUrl =
                      o.track_token && typeof o.track_token === 'string'
                        ? `${window.location.origin}/track?token=${encodeURIComponent(o.track_token)}`
                        : null;
                    const orderDate = o.created_at ?? o.sale_date;
                    const fulfillmentLabel =
                      o.source === 'online_delivery' ? t.orderFulfillmentDelivery : t.orderFulfillmentTakeaway;

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
                          <Price amount={o.total_price} className="ming-mono text-[14px] font-semibold text-ming-bone" />
                        </div>
                        <div className="mt-2 space-y-1 text-[12px] text-ming-ash">
                          <p>
                            {t.orderOrderDate}:{' '}
                            <span className="text-ming-bone">
                              {orderDate ? new Date(orderDate).toLocaleString() : '—'}
                            </span>
                          </p>
                          <p>
                            {t.orderFulfillmentLabel}: <span className="text-ming-bone">{fulfillmentLabel}</span>
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onReorder(o)}
                            className="ming-btn-ghost px-3 py-2 text-[12px]"
                          >
                            {t.orderReorder}
                          </button>
                          {trackUrl ? (
                            <a href={trackUrl} className="ming-btn-ghost px-3 py-2 text-[12px]">
                              {t.orderTrackOrder}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId((prev) => (prev === o.id ? null : o.id))}
                            className="ming-btn-ghost px-3 py-2 text-[12px]"
                          >
                            {isExpanded ? (
                              <span className="inline-flex items-center gap-1">
                                <ChevronUp className="h-3 w-3" />
                                {t.orderHideDetails}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <ChevronDown className="h-3 w-3" />
                                {t.orderViewDetails}
                              </span>
                            )}
                          </button>
                        </div>
                        {isExpanded ? (
                          <ul className="mt-3 space-y-1 rounded-lg border border-white/[0.06] bg-ming-ink/40 p-2 text-[12px] text-ming-ash">
                            {saleItems.length > 0 ? (
                              saleItems.map((item) => (
                                <li key={item.id}>
                                  <span className="text-ming-bone">{item.quantity}×</span> {item.product_name}
                                </li>
                              ))
                            ) : (
                              <li>—</li>
                            )}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

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
