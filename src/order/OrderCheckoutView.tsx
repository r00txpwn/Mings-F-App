import { ChevronLeft, CreditCard, Loader2, MapPin, Navigation, Wallet } from 'lucide-react';
import type { CustomerAddressRow, DeliveryZoneRow, OnlineFulfillmentType, OnlinePaymentMethod } from '../types/online';
import { OrderAddressMap } from './OrderAddressMap';

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

  paymentMethod: OnlinePaymentMethod;
  onPaymentMethodChange: (m: OnlinePaymentMethod) => void;

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
  placeOrder: string;
  takeawayDisabled: string;
  onlineDisabled: string;
  deliveryDisabledHint: string;
  saveAddressForNext: string;
  mapSearch: string;
  mapPinHint: string;
  mapLoading: string;
  mapUnavailable: string;
  authRequired: string;
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
  paymentMethod,
  onPaymentMethodChange,
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
  const StepHeading = ({ n, title, optional }: { n: number; title: string; optional?: boolean }) => (
    <div className="mb-3 flex items-center gap-3">
      <span className="ming-display inline-flex h-7 w-7 items-center justify-center rounded-full bg-ming-red text-[13px] text-white shadow-ming">
        {n}
      </span>
      <h3 className="ming-display text-[17px] text-ming-bone">
        {title}
        {optional ? (
          <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.14em] text-ming-mute">
            · optional
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
          <p className="ming-eyebrow">Ming&apos;s</p>
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

          {/* Step 2 — contact */}
          <section className="ming-card p-5">
            <StepHeading n={2} title={labels.contact} />
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
            </div>
          </section>

          {/* Step 3 — address (only delivery) */}
          {fulfillment === 'delivery' ? (
            <section className="ming-card p-5">
              <StepHeading n={3} title={labels.deliveryAddress} />
              <div className="space-y-3">
                {userLoggedIn && savedAddresses.length > 0 ? (
                  <div>
                    <label className="ming-label mb-1.5 block" htmlFor="ming-saved-addr">
                      {labels.selectSaved}
                    </label>
                    <select
                      id="ming-saved-addr"
                      className="ming-select"
                      value={selectedSavedAddressId ?? ''}
                      onChange={(e) => onSelectSavedAddressId(e.target.value || null)}
                    >
                      <option value="">— {labels.addressDismiss} —</option>
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}: {a.line1}
                        </option>
                      ))}
                    </select>
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
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onUseLocation}
                    className="ming-btn-ghost text-[13px]"
                  >
                    <Navigation className="h-4 w-4" />
                    {labels.useLocation}
                  </button>
                  {geoStatus ? <span className="text-[12px] text-ming-ash">{geoStatus}</span> : null}
                </div>

                {lat != null && lng != null ? (
                  <p className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-ming-ink/60 px-3 py-2 text-[12px]">
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
            <StepHeading n={fulfillment === 'delivery' ? 4 : 3} title={labels.payment} />
            <div className="space-y-2">
              {paymentOption('cod', labels.payCod, 'Pay on pickup or to the courier', Wallet)}
              {paymentOption('cash', labels.payCash, 'Cash in store', Wallet)}
              {paymentOption('epoint', labels.payEpoint, 'Secure card payment via E-point', CreditCard)}
            </div>
          </section>

          {submitError ? (
            <p className="rounded-xl border border-ming-red/40 bg-ming-red/10 px-4 py-3 text-sm text-ming-red">
              {submitError}
            </p>
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
            <p className="ming-eyebrow mb-3">Summary</p>
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
