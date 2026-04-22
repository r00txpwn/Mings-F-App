import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CreditCard, Loader2, MapPin, Wallet } from 'lucide-react';
import type { CustomerAddressRow, DeliveryZoneRow, OnlineFulfillmentType, OnlinePaymentMethod } from '../types/online';
import { OrderAddressMap, type ZonePillStatus } from './OrderAddressMap';

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
  customerEmail: string;
  onCustomerEmailChange: (v: string) => void;
  onCustomerNameChange: (v: string) => void;

  userLoggedIn: boolean;
  savedAddresses: CustomerAddressRow[];
  selectedSavedAddressId: string | null;
  onSelectSavedAddressId: (id: string | null) => void;
  saveAddressForNext: boolean;
  onSaveAddressForNextChange: (v: boolean) => void;

  deliveryAddress: string;
  lat: number | null;
  lng: number | null;
  onLocationChange: (loc: { lat: number | null; lng: number | null; address: string }) => void;
  onAddressChange: (v: string) => void;
  googleMapsApiKey?: string;
  onUseLocation: () => void;
  geoStatus: string | null;

  zoneMatch: DeliveryZoneRow | null;
  /** Active delivery zones for map polygons + zone pill (delivery only). */
  deliveryZones?: DeliveryZoneRow[];

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
  consentAccepted: boolean;
  onConsentAcceptedChange: (v: boolean) => void;

  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;

  submitting: boolean;
  submitError: string | null;
  canSubmit: boolean;
  onSubmit: () => void;

  onBack: () => void;

  labels: CheckoutLabels;
}

export interface CheckoutLabels {
  back: string;
  checkout: string;
  contact: string;
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
  mapSearch: string;
  mapNoResults: string;
  mapSearchFailed: string;
  mapSelectFailed: string;
  mapLoadFailed: string;
  mapPinHint: string;
  mapLoading: string;
  mapUnavailable: string;
  authRequired: string;
  scheduleNow: string;
  scheduleLater: string;
  scheduleFor: string;
  scheduleDay: string;
  scheduleTime: string;
  zonePillIn: string;
  today: string;
  tomorrow: string;
  scheduleNoSlots: string;
  promoCode: string;
  tip: string;
  orderNotes: string;
  consentLabel: string;
  terms: string;
  privacy: string;
  refundPolicy: string;
  retry: string;
  payCodDescription: string;
  payCashDescription: string;
  payEpointDescription: string;
  checkoutSummary: string;
  checkoutBrand: string;
  promoPlaceholder: string;
  zonePillChecking: string;
  optional: string;
}

export function OrderCheckoutView({
  fulfillment,
  showTakeaway,
  showDelivery,
  onFulfillmentChange,
  serverAllowsDelivery,
  customerPhone,
  customerEmail,
  onCustomerEmailChange,
  customerName,
  onCustomerPhoneChange,
  onCustomerNameChange,
  userLoggedIn,
  savedAddresses,
  selectedSavedAddressId,
  onSelectSavedAddressId,
  saveAddressForNext,
  onSaveAddressForNextChange,
  deliveryAddress,
  lat,
  lng,
  onLocationChange,
  onAddressChange,
  googleMapsApiKey,
  onUseLocation,
  geoStatus,
  zoneMatch,
  deliveryZones,
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
  consentAccepted,
  onConsentAcceptedChange,
  cartTotal,
  deliveryFee,
  grandTotal,
  submitting,
  submitError,
  canSubmit,
  onSubmit,
  onBack,
  labels,
}: OrderCheckoutViewProps) {
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('');

  const mapZoneStatus = useMemo((): ZonePillStatus | undefined => {
    if (fulfillment !== 'delivery' || !deliveryZones?.length) return undefined;
    if (lat == null || lng == null) return { kind: 'idle' };
    if (zoneMatch) {
      return {
        kind: 'in',
        zoneId: zoneMatch.id,
        zoneName: zoneMatch.name,
        fee: Number(zoneMatch.delivery_fee ?? 0),
      };
    }
    return { kind: 'out' };
  }, [deliveryZones, fulfillment, lat, lng, zoneMatch]);

  const contactStep = 3;
  const addressStep = 4;
  const paymentStep = fulfillment === 'delivery' ? 5 : 4;

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
          <p className="ming-eyebrow">{labels.checkoutBrand}</p>
          <h1 className="ming-display text-xl leading-tight text-ming-bone sm:text-2xl">
            {labels.checkout}
          </h1>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 pb-40 pt-5 sm:px-6 lg:grid-cols-[1fr_380px] lg:gap-10 lg:px-10 lg:pb-20 lg:pt-2">
        <div className="space-y-7">
          {/* Step 1 — fulfillment */}
          <section className="ming-card p-5">
            <StepHeading n={1} title={labels.pickupOrDelivery} />
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
                  <p className="ming-display text-[15px]">{labels.takeaway}</p>
                  <p className="mt-1 text-[12px] text-ming-ash">Pick up at Ming&apos;s</p>
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
                  <p className="ming-display text-[15px]">{labels.delivery}</p>
                  <p className="mt-1 text-[12px] text-ming-ash">We bring it to you</p>
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

          <section className="ming-card p-5">
            <StepHeading n={2} title={labels.scheduleFor} />
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

          {/* Step 2 — contact */}
          <section className="ming-card p-5">
            <StepHeading n={contactStep} title={labels.contact} />
            <div className="space-y-3">
              <div>
                <label className="ming-label mb-1.5 block" htmlFor="ming-phone">
                  {labels.phone} *
                </label>
                <input
                  id="ming-phone"
                  className="ming-input"
                  value={customerPhone}
                  onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  placeholder="+994..."
                  autoComplete="tel"
                  inputMode="tel"
                />
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
              <div>
                <label className="ming-label mb-1.5 block" htmlFor="ming-email">
                  {labels.email}
                </label>
                <input
                  id="ming-email"
                  className="ming-input"
                  value={customerEmail}
                  onChange={(e) => onCustomerEmailChange(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>
          </section>

          {/* Step 3 — address (only delivery) */}
          {fulfillment === 'delivery' ? (
            <section className="ming-card p-5">
              <StepHeading n={addressStep} title={labels.deliveryAddress} />
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
                  noResultsLabel={labels.mapNoResults}
                  searchFailedLabel={labels.mapSearchFailed}
                  selectFailedLabel={labels.mapSelectFailed}
                  mapsLoadFailedLabel={labels.mapLoadFailed}
                  pinHint={labels.mapPinHint}
                  loadingLabel={labels.mapLoading}
                  unavailableLabel={labels.mapUnavailable}
                  zones={deliveryZones}
                  zoneStatus={mapZoneStatus}
                  zonePillIn={labels.zonePillIn}
                  zonePillOut={labels.outsideZone}
                  zonePillChecking={labels.zonePillChecking}
                  addressLabel={`${labels.deliveryAddress} *`}
                  onUseLocation={onUseLocation}
                  useLocationLabel={labels.useLocation}
                />

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
                        <span className="ming-mono">{Number(zoneMatch.delivery_fee).toFixed(2)} ₼</span>
                        <span className="text-ming-ash"> {labels.deliveryFeeLabel}</span>
                      </span>
                    ) : (
                      <span className="text-ming-gold">{labels.outsideZone}</span>
                    )}
                  </p>
                ) : null}

                {userLoggedIn ? (
                  <label className="flex items-center gap-2 text-[13px] text-ming-ash">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ming-red"
                      checked={saveAddressForNext}
                      onChange={(e) => onSaveAddressForNextChange(e.target.checked)}
                    />
                    {labels.saveAddressForNext}
                  </label>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Step — Payment */}
          <section className="ming-card p-5">
            <StepHeading n={paymentStep} title={labels.payment} />
            <div className="space-y-2">
              {paymentOption('cod', labels.payCod, labels.payCodDescription, Wallet)}
              {paymentOption('cash', labels.payCash, labels.payCashDescription, Wallet)}
              {paymentOption('epoint', labels.payEpoint, labels.payEpointDescription, CreditCard)}
              {paymentMethod === 'epoint' ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-ming-ash">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ming-red"
                      checked={payWithWallet}
                      onChange={(e) => onPayWithWalletChange(e.target.checked)}
                    />
                    {labels.payCardWithWallet}
                  </label>
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ming-red"
                      checked={saveCardForFuture}
                      onChange={(e) => onSaveCardForFutureChange(e.target.checked)}
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
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>
            <div className="mt-3">
              <label className="ming-label mb-1.5 block">{labels.orderNotes}</label>
              <textarea
                className="ming-input min-h-[84px] resize-y"
                value={orderNotes}
                onChange={(e) => onOrderNotesChange(e.target.value)}
              />
            </div>
            <label className="mt-3 flex items-start gap-2 text-[13px] text-ming-ash">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-ming-red"
                checked={consentAccepted}
                onChange={(e) => onConsentAcceptedChange(e.target.checked)}
              />
              <span>
                {labels.consentLabel}{' '}
                <a href="/terms" className="ming-btn-link inline px-0 py-0">{labels.terms}</a>,{' '}
                <a href="/privacy" className="ming-btn-link inline px-0 py-0">{labels.privacy}</a>,{' '}
                <a href="/refund" className="ming-btn-link inline px-0 py-0">{labels.refundPolicy}</a>.
              </span>
            </label>
          </section>

          {submitError ? (
            <div className="rounded-xl border border-ming-red/40 bg-ming-red/10 px-4 py-3 text-sm text-ming-red">
              <p>{submitError}</p>
              <button type="button" onClick={onSubmit} className="ming-btn-link mt-2 px-0 py-0 text-sm">
                {labels.retry}
              </button>
            </div>
          ) : null}

          {!userLoggedIn ? (
            <p className="rounded-xl border border-ming-gold/40 bg-ming-gold/10 px-4 py-3 text-sm text-ming-gold">
              {labels.authRequired}
            </p>
          ) : null}
        </div>

        {/* Right — sticky order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ming-card-raised relative overflow-hidden p-5">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ming-red/15 blur-3xl" />
            <p className="ming-eyebrow mb-3">{labels.checkoutSummary}</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ming-ash">{labels.subtotal}</dt>
                <dd className="ming-mono font-semibold text-ming-bone">{cartTotal.toFixed(2)} ₼</dd>
              </div>
              {fulfillment === 'delivery' ? (
                <div className="flex items-center justify-between">
                  <dt className="text-ming-ash">{labels.deliveryFeeLabel}</dt>
                  <dd className="ming-mono font-semibold text-ming-bone">{deliveryFee.toFixed(2)} ₼</dd>
                </div>
              ) : null}
              <div className="ming-divider my-1" />
              <div className="flex items-baseline justify-between">
                <dt className="ming-label">{labels.total}</dt>
                <dd className="ming-display text-[26px] text-ming-gold">
                  <span className="ming-mono">{grandTotal.toFixed(2)}</span>
                  <span className="ml-1 text-lg">₼</span>
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="ming-btn-primary mt-5 w-full py-4"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {labels.placeOrder} · {grandTotal.toFixed(2)} ₼
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
