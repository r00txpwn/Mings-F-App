import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Bike,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CreditCard,
  Loader2,
  MapPin,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import type {
  CustomerAddressAccessMethod,
  CustomerAddressLeaveAt,
  CustomerAddressRow,
  CustomerAddressType,
  DeliveryZoneRow,
  OnlineFulfillmentType,
  OnlinePaymentMethod,
} from '../types/online';
import { isLikelyE164, maskPhoneForOtp, normalizePhoneE164 } from '../lib/phoneE164';
import { OrderAddressMap } from './OrderAddressMap';
import { OrderCompactSelect } from './OrderCompactSelect';
import { OrderCheckbox } from './OrderCheckbox';
import { ORDER_ADDRESS_TYPE_CONFIG } from './addressTypeConfig';
import { Price } from '../components/Price';
import { formatMoneyWithSymbol } from '../lib/money';

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface OrderCheckoutViewProps {
  fulfillment: OnlineFulfillmentType;
  showTakeaway: boolean;
  showDelivery: boolean;
  onFulfillmentChange: (f: OnlineFulfillmentType) => void;
  serverAllowsDelivery: boolean;

  customerPhone: string;
  customerName: string;
  onCustomerPhoneChange: (v: string) => void;
  onCustomerNameChange: (v: string) => void;

  userLoggedIn: boolean;
  sendPhoneOtp: (phone: string) => Promise<{ error: unknown }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: unknown }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: unknown }>;
  requirePhoneVerification: boolean;
  onPhoneVerified: (normalizedPhone: string) => Promise<void> | void;
  savedAddresses: CustomerAddressRow[];
  selectedSavedAddressId: string | null;
  onSelectSavedAddressId: (id: string | null) => void;
  saveAddressForNext: boolean;
  onSaveAddressForNextChange: (v: boolean) => void;
  saveAddressLabel: string;
  onSaveAddressLabelChange: (v: string) => void;

  deliveryAddress: string;
  deliveryAddressType: CustomerAddressType;
  deliveryBuildingName: string;
  deliveryEntrance: string;
  deliveryApartment: string;
  deliveryFloor: string;
  deliveryDoorNameOrNumber: string;
  deliveryCompanyName: string;
  deliveryLeaveAt: CustomerAddressLeaveAt;
  deliveryAccessMethod: CustomerAddressAccessMethod;
  deliveryIntercomNameOrNumber: string;
  deliveryDoorCode: string;
  deliveryAccessOtherInstructions: string;
  deliveryNotes: string;
  lat: number | null;
  lng: number | null;
  onLocationChange: (loc: { lat: number | null; lng: number | null; address: string }) => void;
  onAddressChange: (v: string) => void;
  onDeliveryAddressTypeChange: (v: CustomerAddressType) => void;
  onDeliveryBuildingNameChange: (v: string) => void;
  onDeliveryEntranceChange: (v: string) => void;
  onDeliveryApartmentChange: (v: string) => void;
  onDeliveryFloorChange: (v: string) => void;
  onDeliveryDoorNameOrNumberChange: (v: string) => void;
  onDeliveryCompanyNameChange: (v: string) => void;
  onDeliveryLeaveAtChange: (v: CustomerAddressLeaveAt) => void;
  onDeliveryAccessMethodChange: (v: CustomerAddressAccessMethod) => void;
  onDeliveryIntercomNameOrNumberChange: (v: string) => void;
  onDeliveryDoorCodeChange: (v: string) => void;
  onDeliveryAccessOtherInstructionsChange: (v: string) => void;
  onDeliveryNotesChange: (v: string) => void;
  googleMapsApiKey?: string;
  onUseLocation: () => void;
  geoStatus: string | null;

  zoneMatch: DeliveryZoneRow | null;

  paymentMethod: OnlinePaymentMethod;
  onPaymentMethodChange: (m: OnlinePaymentMethod) => void;
  saveCardForFuture: boolean;
  onSaveCardForFutureChange: (v: boolean) => void;
  payWithWallet: boolean;
  onPayWithWalletChange: (v: boolean) => void;
  savedCardsCount: number;
  isScheduled: boolean;
  scheduledFor: string | null;
  availableScheduleSlots: string[];
  onScheduledChange: (v: boolean) => void;
  onScheduledForChange: (iso: string | null) => void;
  promoCode: string;
  onPromoCodeChange: (v: string) => void;
  tipAmount: number;
  onTipAmountChange: (v: number) => void;
  orderNotes: string;
  onOrderNotesChange: (v: string) => void;

  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;

  submitting: boolean;
  submitError: string | null;
  submitBlockers: string[];
  canSubmit: boolean;
  onSubmit: () => void;

  onBack: () => void;

  labels: CheckoutLabels;
}

export interface CheckoutLabels {
  back: string;
  checkout: string;
  contact: string;
  stepFulfillment: string;
  stepAddress: string;
  stepTiming: string;
  stepPayment: string;
  stepReview: string;
  optional: string;
  phone: string;
  email: string;
  nameOptional: string;
  pickupOrDelivery: string;
  takeaway: string;
  delivery: string;
  deliveryAddress: string;
  selectSaved: string;
  addressDismiss: string;
  useLocation: string;
  outsideZone: string;
  inZonePrefix: string;
  deliveryFeeLabel: string;
  subtotal: string;
  total: string;
  payment: string;
  payCod: string;
  payCash: string;
  payEpoint: string;
  payCardWithWallet: string;
  saveCardForFuture: string;
  savedCardsAvailable: string;
  placeOrder: string;
  takeawayDisabled: string;
  onlineDisabled: string;
  deliveryDisabledHint: string;
  saveAddressForNext: string;
  saveAddressLabel: string;
  saveAddressSignInHint: string;
  mapSearch: string;
  mapPinHint: string;
  mapLoading: string;
  mapUnavailable: string;
  apartmentUnit: string;
  floor: string;
  addressTypeTitle: string;
  addressTypeApartment: string;
  addressTypeHouse: string;
  addressTypeOffice: string;
  addressTypeHotel: string;
  addressTypeOther: string;
  buildingName: string;
  entrance: string;
  doorNameOrNumber: string;
  companyName: string;
  leaveAt: string;
  leaveAtOffice: string;
  leaveAtReception: string;
  accessMethod: string;
  accessIntercom: string;
  accessDoorCode: string;
  accessDoorOpen: string;
  accessOther: string;
  intercomNameOrNumber: string;
  doorCode: string;
  accessOtherInstructions: string;
  deliveryNotesLabel: string;
  deliveryNotesPlaceholder: string;
  authRequired: string;
  authGoogle: string;
  authSms: string;
  authTitle: string;
  authHelper: string;
  authGooglePhoneNext: string;
  authSmsCta: string;
  scheduleNow: string;
  scheduleLater: string;
  scheduleFor: string;
  scheduleDay: string;
  scheduleTime: string;
  today: string;
  tomorrow: string;
  scheduleNoSlots: string;
  promoCode: string;
  tip: string;
  orderNotes: string;
  terms: string;
  privacy: string;
  refundPolicy: string;
  retry: string;
  summaryTitle: string;
  fulfillmentTakeawayHint: string;
  fulfillmentDeliveryHint: string;
  paymentCodHint: string;
  paymentCashHint: string;
  paymentEpointHint: string;
  paymentExtras: string;
  promoPlaceholder: string;
  reviewHint: string;
  reviewFulfillment: string;
  reviewTiming: string;
  reviewContact: string;
  reviewPayment: string;
  reviewAddress: string;
  reviewAsap: string;
  reviewMissing: string;
  contactSignedIn: string;
  contactGuestHint: string;
  contactVerifyHint: string;
  contactSendCode: string;
  contactCode: string;
  contactVerify: string;
  contactChangePhone: string;
  contactAuthErrorFallback: string;
  contactOr: string;
  smsSentHint: string;
  smsResend: string;
  smsResendWait: string;
  /** Shown under phone when blurred and format is invalid (same meaning as account invalid-phone hint). */
  phoneFormatHint: string;
  legalPassivePrefix: string;
  profileCompletionPending: string;
  phoneVerificationRequired: string;
}

export function OrderCheckoutView({
  fulfillment,
  showTakeaway,
  showDelivery,
  onFulfillmentChange,
  serverAllowsDelivery,
  customerPhone,
  customerName,
  onCustomerPhoneChange,
  onCustomerNameChange,
  userLoggedIn,
  sendPhoneOtp,
  verifyPhoneOtp,
  signInWithGoogle,
  requirePhoneVerification,
  onPhoneVerified,
  savedAddresses,
  selectedSavedAddressId,
  onSelectSavedAddressId,
  saveAddressForNext,
  onSaveAddressForNextChange,
  saveAddressLabel,
  onSaveAddressLabelChange,
  deliveryAddress,
  deliveryAddressType,
  deliveryBuildingName,
  deliveryEntrance,
  deliveryApartment,
  deliveryFloor,
  deliveryDoorNameOrNumber,
  deliveryCompanyName,
  deliveryLeaveAt,
  deliveryAccessMethod,
  deliveryIntercomNameOrNumber,
  deliveryDoorCode,
  deliveryAccessOtherInstructions,
  deliveryNotes,
  lat,
  lng,
  onLocationChange,
  onAddressChange,
  onDeliveryAddressTypeChange,
  onDeliveryBuildingNameChange,
  onDeliveryEntranceChange,
  onDeliveryApartmentChange,
  onDeliveryFloorChange,
  onDeliveryDoorNameOrNumberChange,
  onDeliveryCompanyNameChange,
  onDeliveryLeaveAtChange,
  onDeliveryAccessMethodChange,
  onDeliveryIntercomNameOrNumberChange,
  onDeliveryDoorCodeChange,
  onDeliveryAccessOtherInstructionsChange,
  onDeliveryNotesChange,
  googleMapsApiKey,
  onUseLocation,
  geoStatus,
  zoneMatch,
  paymentMethod,
  onPaymentMethodChange,
  saveCardForFuture,
  onSaveCardForFutureChange,
  payWithWallet,
  onPayWithWalletChange,
  savedCardsCount,
  isScheduled,
  scheduledFor,
  availableScheduleSlots,
  onScheduledChange,
  onScheduledForChange,
  promoCode,
  onPromoCodeChange,
  tipAmount,
  onTipAmountChange,
  orderNotes,
  onOrderNotesChange,
  cartTotal,
  deliveryFee,
  grandTotal,
  submitting,
  submitError,
  submitBlockers,
  canSubmit,
  onSubmit,
  onBack,
  labels,
}: OrderCheckoutViewProps) {
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('');
  const [showPaymentExtras, setShowPaymentExtras] = useState(false);
  const [authStep, setAuthStep] = useState<'choice' | 'phone' | 'otp'>(
    userLoggedIn ? 'phone' : 'choice'
  );
  const [otpCode, setOtpCode] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [checkoutPhoneBlurred, setCheckoutPhoneBlurred] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);

  const checkoutPhoneInvalid =
    checkoutPhoneBlurred &&
    customerPhone.trim().length > 0 &&
    !isLikelyE164(normalizePhoneE164(customerPhone.trim()));

  const addressStep = 2;
  const timingStep = fulfillment === 'delivery' ? 3 : 2;
  const contactStep = fulfillment === 'delivery' ? 4 : 3;
  const paymentStep = fulfillment === 'delivery' ? 5 : 4;
  const reviewStep = fulfillment === 'delivery' ? 6 : 5;

  const cashRadioValue: OnlinePaymentMethod = fulfillment === 'takeaway' ? 'cash_pickup' : 'cash_delivery';
  const showInlineAuth = !userLoggedIn || requirePhoneVerification;

  const addressTypeConfig = ORDER_ADDRESS_TYPE_CONFIG[deliveryAddressType];

  const scheduleDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const byDay = new Map<
      string,
      { dayIso: string; label: string; slots: Array<{ iso: string; label: string }> }
    >();

    for (const slot of availableScheduleSlots) {
      const dt = new Date(slot);
      if (Number.isNaN(dt.getTime())) continue;
      const dayStart = new Date(dt);
      dayStart.setHours(0, 0, 0, 0);
      const dayIso = toLocalDayKey(dayStart);
      const slotLabel = dt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      if (!byDay.has(dayIso)) {
        const isToday = dayStart.getTime() === today.getTime();
        const isTomorrow = dayStart.getTime() === tomorrow.getTime();
        const baseLabel = isToday
          ? labels.today
          : isTomorrow
            ? labels.tomorrow
            : dt.toLocaleDateString(undefined, {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              });
        byDay.set(dayIso, { dayIso, label: baseLabel, slots: [] });
      }
      byDay.get(dayIso)?.slots.push({ iso: slot, label: slotLabel });
    }
    return Array.from(byDay.values());
  }, [availableScheduleSlots, labels.today, labels.tomorrow]);

  const selectedDaySlots = useMemo(() => {
    const day = scheduleDays.find((entry) => entry.dayIso === selectedScheduleDay);
    return day?.slots ?? [];
  }, [scheduleDays, selectedScheduleDay]);

  useEffect(() => {
    if (!isScheduled) return;
    if (scheduleDays.length === 0) {
      if (selectedScheduleDay !== '') setSelectedScheduleDay('');
      if (scheduledFor) onScheduledForChange(null);
      return;
    }

    if (scheduledFor) {
      const parsed = new Date(scheduledFor);
      if (!Number.isNaN(parsed.getTime())) {
        const dayIso = toLocalDayKey(parsed);
        const dayExists = scheduleDays.some((entry) => entry.dayIso === dayIso);
        if (dayExists) {
          if (selectedScheduleDay !== dayIso) setSelectedScheduleDay(dayIso);
          return;
        }
      }
    }

    const fallbackDay = scheduleDays[0];
    if (selectedScheduleDay !== fallbackDay.dayIso) setSelectedScheduleDay(fallbackDay.dayIso);
    if (!scheduledFor || !fallbackDay.slots.some((slot) => slot.iso === scheduledFor)) {
      onScheduledForChange(fallbackDay.slots[0]?.iso ?? null);
    }
  }, [isScheduled, scheduleDays, scheduledFor, selectedScheduleDay, onScheduledForChange]);

  useEffect(() => {
    if (userLoggedIn) {
      setAuthStep('phone');
      setOtpCode('');
      setAuthError('');
    } else {
      setAuthStep('choice');
      setOtpCode('');
      setAuthError('');
    }
  }, [userLoggedIn]);

  useEffect(() => {
    if (authStep === 'phone') {
      setCheckoutPhoneBlurred(false);
      setResendSeconds(30);
    }
  }, [authStep]);

  useEffect(() => {
    if (authStep !== 'otp' || resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [authStep, resendSeconds]);

  const StepHeading = ({ n, title, optional }: { n: number; title: string; optional?: boolean }) => (
    <div className="mb-3 flex items-center gap-3">
      <span className="ming-display inline-flex h-7 w-7 items-center justify-center rounded-full bg-ming-red text-[13px] text-white shadow-ming">
        {n}
      </span>
      <h3 className="ming-display text-[17px] text-ming-bone">
        {title}
        {optional ? (
          <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.14em] text-ming-mute">
            · {labels.optional}
          </span>
        ) : null}
      </h3>
    </div>
  );

  const ExpandableCheckoutOption = ({
    title,
    expanded,
    onToggle,
    children,
  }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
  }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="text-[13px] font-semibold text-ming-bone">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-ming-ash" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ming-ash" />
        )}
      </button>
      {expanded ? <div className="border-t border-white/10 px-3.5 py-3">{children}</div> : null}
    </div>
  );

  const paymentOption = (value: OnlinePaymentMethod, title: string, sub: string, Icon: typeof CreditCard) => {
    const selected = paymentMethod === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => onPaymentMethodChange(value)}
        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
          selected
            ? 'border-ming-red bg-ming-red/10 text-ming-bone shadow-[0_0_0_1px_rgba(225,29,72,0.4)_inset]'
            : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20 hover:bg-white/[0.05] hover:text-ming-bone'
        }`}
        aria-pressed={selected}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            selected ? 'bg-ming-red text-white' : 'bg-white/[0.05] text-ming-ash'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1">
          <span className={`block text-[14px] font-semibold ${selected ? 'text-ming-bone' : ''}`}>{title}</span>
          <span className="mt-0.5 block text-[12px] text-ming-ash">{sub}</span>
        </span>
        <span
          className={`h-4 w-4 shrink-0 rounded-full border-2 ${
            selected ? 'border-ming-red bg-ming-red' : 'border-white/20'
          }`}
          aria-hidden
        />
      </button>
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-[48px] z-20 flex items-center gap-3 border-b border-white/[0.06] bg-ming-ink/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:static lg:top-0 lg:border-0 lg:bg-transparent lg:px-10 lg:py-6">
        <button
          type="button"
          onClick={onBack}
          className="ming-iconbtn"
          aria-label={labels.back}
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <p className="ming-eyebrow">Ming&apos;s</p>
          <h1 className="ming-display text-xl leading-tight text-ming-bone sm:text-2xl">
            {labels.checkout}
          </h1>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 pb-40 pt-5 sm:px-6 lg:grid-cols-[1fr_380px] lg:gap-10 lg:px-10 lg:pb-20 lg:pt-2">
        <div className="space-y-7">
          <section className="ming-card p-5">
            <StepHeading n={1} title={labels.stepFulfillment} />
            {showTakeaway || showDelivery ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onFulfillmentChange('takeaway')}
                  disabled={!showTakeaway}
                  className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-40 ${
                    fulfillment === 'takeaway' && showTakeaway
                      ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                      : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20'
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="ming-display text-[15px]">{labels.takeaway}</p>
                    <ShoppingBag className="h-4 w-4 shrink-0 text-ming-ash" />
                  </div>
                  <p className="mt-1 text-[12px] text-ming-ash">{labels.fulfillmentTakeawayHint}</p>
                </button>
                <button
                  type="button"
                  onClick={() => onFulfillmentChange('delivery')}
                  disabled={!showDelivery}
                  className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-40 ${
                    fulfillment === 'delivery' && showDelivery
                      ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                      : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20'
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="ming-display text-[15px]">{labels.delivery}</p>
                    <Bike className="h-4 w-4 shrink-0 text-ming-ash" />
                  </div>
                  <p className="mt-1 text-[12px] text-ming-ash">{labels.fulfillmentDeliveryHint}</p>
                </button>
              </div>
            ) : (
              <p className="text-sm text-ming-red">{labels.onlineDisabled}</p>
            )}
            {!showTakeaway && showDelivery ? (
              <p className="mt-3 text-[12px] text-ming-gold">{labels.takeawayDisabled}</p>
            ) : null}
            {fulfillment === 'delivery' && !serverAllowsDelivery ? (
              <p className="mt-3 rounded-lg border border-ming-gold/40 bg-ming-gold/10 px-3 py-2 text-[12px] text-ming-gold">
                {labels.deliveryDisabledHint}
              </p>
            ) : null}
          </section>

          {fulfillment === 'delivery' ? (
            <section className="ming-card p-5">
              <StepHeading n={addressStep} title={labels.stepAddress} />
              <div className="space-y-3">
                {userLoggedIn && savedAddresses.length > 0 ? (
                  <div>
                    <p className="ming-label mb-1.5 block">{labels.selectSaved}</p>
                    <div className="ming-scroll flex gap-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => onSelectSavedAddressId(null)}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${
                          !selectedSavedAddressId
                            ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                            : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20 hover:text-ming-bone'
                        }`}
                      >
                        {labels.addressDismiss}
                      </button>
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => onSelectSavedAddressId(a.id)}
                          className={`shrink-0 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                            selectedSavedAddressId === a.id
                              ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                              : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20 hover:text-ming-bone'
                          }`}
                        >
                          <span className="block max-w-[220px] truncate">{a.label}: {a.line1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <OrderAddressMap
                  apiKey={googleMapsApiKey}
                  lat={lat}
                  lng={lng}
                  address={deliveryAddress}
                  onLocationChange={onLocationChange}
                  onAddressChange={onAddressChange}
                  searchPlaceholder={labels.mapSearch}
                  pinHint={labels.mapPinHint}
                  loadingLabel={labels.mapLoading}
                  unavailableLabel={labels.mapUnavailable}
                  addressLabel={`${labels.deliveryAddress} *`}
                  onUseLocation={onUseLocation}
                  useLocationLabel={labels.useLocation}
                />

                <div>
                  <label className="ming-label mb-1.5 block">{labels.addressTypeTitle}</label>
                  <OrderCompactSelect
                    ariaLabel={labels.addressTypeTitle}
                    value={deliveryAddressType}
                    onChange={onDeliveryAddressTypeChange}
                    options={[
                      { value: 'apartment', label: labels.addressTypeApartment },
                      { value: 'house', label: labels.addressTypeHouse },
                      { value: 'office', label: labels.addressTypeOffice },
                      { value: 'hotel', label: labels.addressTypeHotel },
                      { value: 'other', label: labels.addressTypeOther },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {addressTypeConfig.showBuildingName ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.buildingName}</label>
                      <input
                        className="ming-input"
                        value={deliveryBuildingName}
                        onChange={(e) => onDeliveryBuildingNameChange(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showEntrance ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.entrance}</label>
                      <input
                        className="ming-input"
                        value={deliveryEntrance}
                        onChange={(e) => onDeliveryEntranceChange(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showApartmentUnit ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.apartmentUnit}</label>
                      <input
                        className="ming-input"
                        value={deliveryApartment}
                        onChange={(e) => onDeliveryApartmentChange(e.target.value)}
                        autoComplete="address-line2"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showFloor ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.floor}</label>
                      <input
                        className="ming-input"
                        value={deliveryFloor}
                        onChange={(e) => onDeliveryFloorChange(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showDoorNameOrNumber ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.doorNameOrNumber}</label>
                      <input
                        className="ming-input"
                        value={deliveryDoorNameOrNumber}
                        onChange={(e) => onDeliveryDoorNameOrNumberChange(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showCompanyName ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.companyName}</label>
                      <input
                        className="ming-input"
                        value={deliveryCompanyName}
                        onChange={(e) => onDeliveryCompanyNameChange(e.target.value)}
                        autoComplete="organization"
                      />
                    </div>
                  ) : null}
                  {addressTypeConfig.showLeaveAt ? (
                    <div>
                      <label className="ming-label mb-1.5 block">{labels.leaveAt}</label>
                      <OrderCompactSelect
                        ariaLabel={labels.leaveAt}
                        value={deliveryLeaveAt}
                        onChange={onDeliveryLeaveAtChange}
                        options={[
                          { value: 'office', label: labels.leaveAtOffice },
                          { value: 'reception', label: labels.leaveAtReception },
                        ]}
                      />
                    </div>
                  ) : null}
                </div>

                {addressTypeConfig.showAccessMethod ? (
                  <div className="space-y-2 rounded-xl border border-white/[0.06] bg-ming-ink/40 p-3">
                    <label className="ming-label mb-1.5 block">{labels.accessMethod}</label>
                    <OrderCompactSelect
                      ariaLabel={labels.accessMethod}
                      value={deliveryAccessMethod}
                      onChange={onDeliveryAccessMethodChange}
                      options={[
                        { value: 'intercom', label: labels.accessIntercom },
                        { value: 'door_code', label: labels.accessDoorCode },
                        { value: 'door_open', label: labels.accessDoorOpen },
                        { value: 'other', label: labels.accessOther },
                      ]}
                    />
                    {deliveryAccessMethod === 'intercom' ? (
                      <input
                        className="ming-input"
                        value={deliveryIntercomNameOrNumber}
                        onChange={(e) => onDeliveryIntercomNameOrNumberChange(e.target.value)}
                        placeholder={labels.intercomNameOrNumber}
                      />
                    ) : null}
                    {deliveryAccessMethod === 'door_code' ? (
                      <input
                        className="ming-input"
                        value={deliveryDoorCode}
                        onChange={(e) => onDeliveryDoorCodeChange(e.target.value)}
                        placeholder={labels.doorCode}
                      />
                    ) : null}
                    {deliveryAccessMethod === 'other' ? (
                      <textarea
                        className="ming-input min-h-[70px] resize-y"
                        value={deliveryAccessOtherInstructions}
                        onChange={(e) => onDeliveryAccessOtherInstructionsChange(e.target.value)}
                        placeholder={labels.accessOtherInstructions}
                      />
                    ) : null}
                  </div>
                ) : null}

                {addressTypeConfig.showCourierNotes ? (
                  <div>
                    <label className="ming-label mb-1.5 block">{labels.deliveryNotesLabel}</label>
                    <textarea
                      className="ming-input min-h-[84px] resize-y"
                      value={deliveryNotes}
                      onChange={(e) => onDeliveryNotesChange(e.target.value)}
                      placeholder={labels.deliveryNotesPlaceholder}
                    />
                  </div>
                ) : null}

                {geoStatus ? <span className="text-[12px] text-ming-ash">{geoStatus}</span> : null}

                {lat != null && lng != null ? (
                  <p
                    aria-live="polite"
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-ming-ink/60 px-3 py-2 text-[12px]"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-ming-red" />
                    {zoneMatch ? (
                      <span className="text-ming-bone">
                        {labels.inZonePrefix}: <span className="font-semibold">{zoneMatch.name}</span>
                        <span className="text-ming-ash"> · </span>
                        <Price amount={zoneMatch.delivery_fee} className="ming-mono" />
                        <span className="text-ming-ash"> {labels.deliveryFeeLabel}</span>
                      </span>
                    ) : (
                      <span className="text-ming-gold">{labels.outsideZone}</span>
                    )}
                  </p>
                ) : null}

                {!selectedSavedAddressId ? (
                  <div className="space-y-2 rounded-xl border border-white/[0.06] bg-ming-ink/40 p-3">
                    <label className="flex items-center gap-2 text-[13px] text-ming-ash">
                      <OrderCheckbox
                        checked={saveAddressForNext}
                        ariaLabel={labels.saveAddressForNext}
                        disabled={!userLoggedIn}
                        onChange={onSaveAddressForNextChange}
                      />
                      {labels.saveAddressForNext}
                    </label>
                    {saveAddressForNext ? (
                      <div>
                        <label className="ming-label mb-1.5 block">{labels.saveAddressLabel}</label>
                        <input
                          className="ming-input"
                          value={saveAddressLabel}
                          disabled={!userLoggedIn}
                          onChange={(e) => onSaveAddressLabelChange(e.target.value)}
                          autoComplete="address-level2"
                        />
                      </div>
                    ) : null}
                    {!userLoggedIn ? (
                      <p className="text-[12px] text-ming-ash">{labels.saveAddressSignInHint}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="ming-card p-5">
            <StepHeading n={timingStep} title={labels.stepTiming} />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onScheduledChange(false)}
                  className={`rounded-xl border p-3 text-left text-[13px] font-semibold transition-colors ${
                    !isScheduled
                      ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                      : 'border-white/10 bg-white/[0.02] text-ming-ash'
                  }`}
                >
                  {labels.scheduleNow}
                </button>
                <button
                  type="button"
                  onClick={() => onScheduledChange(true)}
                  className={`rounded-xl border p-3 text-left text-[13px] font-semibold transition-colors ${
                    isScheduled
                      ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                      : 'border-white/10 bg-white/[0.02] text-ming-ash'
                  }`}
                >
                  {labels.scheduleLater}
                </button>
              </div>
              {isScheduled ? (
                scheduleDays.length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ming-ash">
                        {labels.scheduleDay}
                      </p>
                      <div className="ming-scroll flex gap-2 overflow-x-auto pb-1">
                        {scheduleDays.map((day) => (
                          <button
                            key={day.dayIso}
                            type="button"
                            onClick={() => {
                              setSelectedScheduleDay(day.dayIso);
                              onScheduledForChange(day.slots[0]?.iso ?? null);
                            }}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${
                              selectedScheduleDay === day.dayIso
                                ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                                : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20 hover:text-ming-bone'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ming-ash">
                        {labels.scheduleTime}
                      </p>
                      <div className="ming-scroll flex gap-2 overflow-x-auto pb-1">
                        {selectedDaySlots.map((slot) => (
                          <button
                            key={slot.iso}
                            type="button"
                            onClick={() => onScheduledForChange(slot.iso)}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${
                              scheduledFor === slot.iso
                                ? 'border-ming-red bg-ming-red/10 text-ming-bone'
                                : 'border-white/10 bg-white/[0.02] text-ming-ash hover:border-white/20 hover:text-ming-bone'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-ming-gold">{labels.scheduleNoSlots}</p>
                )
              ) : null}
            </div>
          </section>

          <section className="ming-card p-5">
            <StepHeading n={contactStep} title={labels.contact} />
            {userLoggedIn ? (
              <div className="space-y-3">
                <div>
                  <label className="ming-label mb-1.5 block" htmlFor="ming-phone">
                    {labels.phone} *
                  </label>
                  <input
                    id="ming-phone"
                    className={`ming-input-focus-neutral${checkoutPhoneInvalid ? ' ming-input-error' : ''}`}
                    value={customerPhone}
                    onChange={(e) => onCustomerPhoneChange(normalizePhoneE164(e.target.value))}
                    onFocus={() => setCheckoutPhoneBlurred(false)}
                    onBlur={(e) => {
                      setCheckoutPhoneBlurred(true);
                      onCustomerPhoneChange(normalizePhoneE164(e.target.value));
                    }}
                    placeholder="+994..."
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={checkoutPhoneInvalid}
                  />
                  {checkoutPhoneInvalid && !authError ? (
                    <p className="mt-1 text-[12px] text-ming-gold">{labels.phoneFormatHint}</p>
                  ) : null}
                </div>
                <div>
                  <label className="ming-label mb-1.5 block" htmlFor="ming-name">
                    {labels.nameOptional}
                  </label>
                  <input
                    id="ming-name"
                    className="ming-input"
                    value={customerName}
                    onChange={(e) => onCustomerNameChange(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            ) : null}
            {showInlineAuth ? (
              <div className="mt-4 space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                <p className="text-sm font-semibold text-ming-bone">
                  {userLoggedIn ? labels.phoneVerificationRequired : labels.authTitle}
                </p>
                <p className="text-xs text-ming-ash">{userLoggedIn ? labels.contactVerifyHint : labels.authHelper}</p>
                {authError ? (
                  <p className="rounded-lg border border-ming-red/40 bg-ming-red/10 px-2.5 py-2 text-xs text-ming-red">
                    {authError}
                  </p>
                ) : null}
                {authStep === 'choice' ? (
                  <>
                    <button
                      type="button"
                      className="ming-btn-primary w-full"
                      disabled={authBusy}
                      onClick={async () => {
                        setAuthError('');
                        setAuthBusy(true);
                        const res = await signInWithGoogle('/order');
                        setAuthBusy(false);
                        if (res.error) {
                          const msg = String((res.error as { message?: string }).message ?? res.error);
                          setAuthError(msg || labels.contactAuthErrorFallback);
                        }
                      }}
                    >
                      {labels.authGoogle}
                    </button>
                    <p className="text-center text-[11px] text-ming-ash">{labels.authGooglePhoneNext}</p>
                    <p className="text-center text-xs text-ming-ash">{labels.contactOr}</p>
                    <button
                      type="button"
                      className="ming-btn-ghost w-full justify-center"
                      onClick={() => {
                        setAuthError('');
                        setAuthStep('phone');
                      }}
                    >
                      {labels.authSmsCta}
                    </button>
                  </>
                ) : authStep === 'phone' ? (
                  <div className="space-y-2">
                    <div>
                      <label className="ming-label mb-1.5 block" htmlFor="ming-phone-auth">
                        {labels.phone} *
                      </label>
                      <input
                        id="ming-phone-auth"
                        className={`ming-input-focus-neutral${checkoutPhoneInvalid ? ' ming-input-error' : ''}`}
                        value={customerPhone}
                        onChange={(e) => onCustomerPhoneChange(normalizePhoneE164(e.target.value))}
                        onFocus={() => setCheckoutPhoneBlurred(false)}
                        onBlur={(e) => {
                          setCheckoutPhoneBlurred(true);
                          onCustomerPhoneChange(normalizePhoneE164(e.target.value));
                        }}
                        placeholder="+994..."
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={checkoutPhoneInvalid}
                      />
                      {checkoutPhoneInvalid && !authError ? (
                        <p className="mt-1 text-[12px] text-ming-gold">{labels.phoneFormatHint}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="ming-btn-primary w-full"
                      disabled={authBusy || !customerPhone.trim()}
                      onClick={async () => {
                        setAuthError('');
                        setAuthBusy(true);
                        const res = await sendPhoneOtp(customerPhone.trim());
                        setAuthBusy(false);
                        if (res.error) {
                          const msg = String((res.error as { message?: string }).message ?? res.error);
                          setAuthError(msg || labels.contactAuthErrorFallback);
                          return;
                        }
                        setAuthStep('otp');
                        setOtpCode('');
                        setResendSeconds(30);
                      }}
                    >
                      {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : labels.authSms}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-ming-ash">
                      {labels.smsSentHint.replace('{phone}', maskPhoneForOtp(customerPhone))}
                    </p>
                    <p className="text-xs text-ming-ash">{labels.contactVerifyHint}</p>
                    <input
                      className="ming-input ming-mono text-center tracking-[0.45em]"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder={labels.contactCode}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <button
                      type="button"
                      className="ming-btn-primary w-full"
                      disabled={authBusy || otpCode.length < 4}
                      onClick={async () => {
                        setAuthError('');
                        setAuthBusy(true);
                        const res = await verifyPhoneOtp(customerPhone.trim(), otpCode);
                        setAuthBusy(false);
                        if (res.error) {
                          const msg = String((res.error as { message?: string }).message ?? res.error);
                          setAuthError(msg || labels.contactAuthErrorFallback);
                          return;
                        }
                        await onPhoneVerified(normalizePhoneE164(customerPhone.trim()));
                        setAuthStep('phone');
                        setOtpCode('');
                      }}
                    >
                      {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : labels.contactVerify}
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-lg px-2 py-1.5 text-xs font-semibold text-ming-ash transition-colors hover:text-ming-bone disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={authBusy || resendSeconds > 0}
                      onClick={async () => {
                        setAuthError('');
                        setAuthBusy(true);
                        const res = await sendPhoneOtp(customerPhone.trim());
                        setAuthBusy(false);
                        if (res.error) {
                          const msg = String((res.error as { message?: string }).message ?? res.error);
                          setAuthError(msg || labels.contactAuthErrorFallback);
                          return;
                        }
                        setResendSeconds(30);
                      }}
                    >
                      {resendSeconds > 0
                        ? labels.smsResendWait.replace('{seconds}', String(resendSeconds))
                        : labels.smsResend}
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-ming-ash transition-colors hover:text-ming-bone"
                      onClick={() => {
                        setAuthStep(userLoggedIn ? 'phone' : 'choice');
                        setOtpCode('');
                        setAuthError('');
                      }}
                    >
                      {labels.contactChangePhone}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {labels.contactSignedIn}
              </p>
            )}
          </section>

          <section className="ming-card p-5">
            <StepHeading n={paymentStep} title={labels.stepPayment} />
            <div className="space-y-2">
              {paymentOption(cashRadioValue, labels.payCod, labels.paymentCodHint, Wallet)}
              {paymentOption('card_online', labels.payEpoint, labels.paymentEpointHint, CreditCard)}
              {paymentMethod === 'card_online' ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-ming-ash">
                  <label className="flex items-center gap-2">
                    <OrderCheckbox
                      checked={payWithWallet}
                      ariaLabel={labels.payCardWithWallet}
                      onChange={onPayWithWalletChange}
                    />
                    {labels.payCardWithWallet}
                  </label>
                  <label className="mt-2 flex items-center gap-2">
                    <OrderCheckbox
                      checked={saveCardForFuture}
                      ariaLabel={labels.saveCardForFuture}
                      onChange={onSaveCardForFutureChange}
                    />
                    {labels.saveCardForFuture}
                  </label>
                  {savedCardsCount > 0 ? (
                    <p className="mt-2 text-xs text-ming-mute">
                      {labels.savedCardsAvailable.replace('{count}', String(savedCardsCount))}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              <ExpandableCheckoutOption
                title={labels.paymentExtras}
                expanded={showPaymentExtras}
                onToggle={() => setShowPaymentExtras((v) => !v)}
              >
                <div className="space-y-3">
                  <div>
                    <label className="ming-label mb-1.5 block">{labels.promoCode}</label>
                    <input
                      className="ming-input"
                      value={promoCode}
                      onChange={(e) => onPromoCodeChange(e.target.value)}
                      placeholder={labels.promoPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="ming-label mb-1.5 block">{labels.tip}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className="ming-input"
                      value={tipAmount}
                      onChange={(e) => onTipAmountChange(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="ming-label mb-1.5 block">{labels.orderNotes}</label>
                    <textarea
                      className="ming-input min-h-[84px] resize-y"
                      value={orderNotes}
                      onChange={(e) => onOrderNotesChange(e.target.value)}
                    />
                  </div>
                </div>
              </ExpandableCheckoutOption>
            </div>
          </section>

          <section className="ming-card p-5">
            <StepHeading n={reviewStep} title={labels.stepReview} />
            <p className="mb-3 text-sm text-ming-ash">{labels.reviewHint}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ming-ash">{labels.reviewFulfillment}</dt>
                <dd className="font-semibold text-ming-bone">
                  {fulfillment === 'delivery' ? labels.delivery : labels.takeaway}
                </dd>
              </div>
              {fulfillment === 'delivery' ? (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ming-ash">{labels.reviewAddress}</dt>
                  <dd className="max-w-[65%] text-right font-semibold text-ming-bone">
                    {deliveryAddress.trim() || labels.reviewMissing}
                    {deliveryApartment.trim() ? (
                      <span className="block truncate text-[12px] text-ming-ash">{labels.apartmentUnit}: {deliveryApartment.trim()}</span>
                    ) : null}
                    {deliveryFloor.trim() ? (
                      <span className="block truncate text-[12px] text-ming-ash">{labels.floor}: {deliveryFloor.trim()}</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ming-ash">{labels.reviewTiming}</dt>
                <dd className="font-semibold text-ming-bone">
                  {isScheduled && scheduledFor
                    ? new Date(scheduledFor).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short',
                      })
                    : labels.reviewAsap}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ming-ash">{labels.reviewContact}</dt>
                <dd className="font-semibold text-ming-bone">{customerPhone.trim() || labels.reviewMissing}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ming-ash">{labels.reviewPayment}</dt>
                <dd className="font-semibold text-ming-bone">
                  {paymentMethod === 'card_online' ? labels.payEpoint : labels.payCod}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-ming-ash">
              {labels.legalPassivePrefix}{' '}
              <a href="/terms" className="ming-btn-link inline px-0 py-0">
                {labels.terms}
              </a>
              ,{' '}
              <a href="/privacy" className="ming-btn-link inline px-0 py-0">
                {labels.privacy}
              </a>
              ,{' '}
              <a href="/refund" className="ming-btn-link inline px-0 py-0">
                {labels.refundPolicy}
              </a>
              .
            </p>
            {submitError ? (
              <div className="mt-3 rounded-xl border border-ming-red/40 bg-ming-red/10 px-4 py-3 text-sm text-ming-red">
                <p>{submitError}</p>
                <button type="button" onClick={onSubmit} className="ming-btn-link mt-2 px-0 py-0 text-sm">
                  {labels.retry}
                </button>
              </div>
            ) : null}
            {submitBlockers.length > 0 ? (
              <div className="mt-3 rounded-xl border border-ming-gold/40 bg-ming-gold/10 px-4 py-3 text-sm text-ming-gold">
                <ul className="space-y-1.5">
                  {submitBlockers.map((msg) => (
                    <li key={msg} className="leading-snug">
                      • {msg}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {(() => {
              const disabledReason = submitBlockers[0] ?? null;
              return (
                <>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || submitting}
                    aria-describedby={disabledReason ? 'order-place-disabled-reason-mobile' : undefined}
                    className="ming-btn-primary mt-4 w-full py-4 lg:hidden"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `${labels.placeOrder} · ${formatMoneyWithSymbol(grandTotal)}`
                    )}
                  </button>
                  {disabledReason ? (
                    <div
                      id="order-place-disabled-reason-mobile"
                      className="mt-2 rounded-lg border border-ming-gold/35 bg-ming-gold/10 px-3 py-2 text-xs text-ming-gold lg:hidden"
                    >
                      {disabledReason}
                    </div>
                  ) : null}
                </>
              );
            })()}
            {!userLoggedIn ? (
              <p className="mt-3 rounded-xl border border-ming-gold/40 bg-ming-gold/10 px-4 py-3 text-sm text-ming-gold">
                {labels.authRequired}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ming-card-raised relative overflow-hidden p-5">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ming-red/15 blur-3xl" />
            <p className="ming-eyebrow mb-3">{labels.summaryTitle}</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ming-ash">{labels.subtotal}</dt>
                <dd>
                  <Price amount={cartTotal} className="ming-mono font-semibold text-ming-bone" />
                </dd>
              </div>
              {fulfillment === 'delivery' ? (
                <div className="flex items-center justify-between">
                  <dt className="text-ming-ash">{labels.deliveryFeeLabel}</dt>
                  <dd>
                    <Price amount={deliveryFee} className="ming-mono font-semibold text-ming-bone" />
                  </dd>
                </div>
              ) : null}
              <div className="ming-divider my-1" />
              <div className="flex items-baseline justify-between">
                <dt className="ming-label">{labels.total}</dt>
                <dd>
                  <Price
                    amount={grandTotal}
                    className="ming-display text-[26px] text-ming-gold"
                    valueClassName="ming-mono"
                    symbolClassName="text-lg"
                  />
                </dd>
              </div>
            </dl>
            {(() => {
              const disabledReason = submitBlockers[0] ?? null;
              return (
                <>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || submitting}
                    aria-describedby={disabledReason ? 'order-place-disabled-reason-desktop' : undefined}
                    className="ming-btn-primary mt-5 hidden w-full py-4 lg:flex"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {labels.placeOrder} · {formatMoneyWithSymbol(grandTotal)}
                      </>
                    )}
                  </button>
                  {disabledReason ? (
                    <div
                      id="order-place-disabled-reason-desktop"
                      className="mt-2 rounded-lg border border-ming-gold/35 bg-ming-gold/10 px-3 py-2 text-xs text-ming-gold"
                    >
                      {disabledReason}
                    </div>
                  ) : null}
                </>
              );
            })()}
            {submitError ? (
              <p className="mt-2 rounded-lg border border-ming-red/35 bg-ming-red/10 px-3 py-2 text-xs text-ming-red">
                {submitError}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
