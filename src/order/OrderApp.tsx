import { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Loader2, ShoppingBag, XCircle, X } from 'lucide-react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase, CartItem, Product, SelectedModifiers } from '../lib/supabase';
import { ProductDetailModal } from '../kiosk/ProductDetailModal';
import { useOnlineMenu } from './hooks/useOnlineMenu';
import { useCustomerData } from './hooks/useCustomerData';
import { useOrderHistory } from './hooks/useOrderHistory';
import { invokeEdgeFunction } from './invokeEdge';
import { OrderBottomNav, type OrderNavTab } from './OrderBottomNav';
import { OrderBrandHeader } from './OrderBrandHeader';
import { OrderAccountPanel } from './OrderAccountPanel';
import { OrderMenuBrowseView, ORDER_MENU_ALL_CATEGORY_ID } from './OrderMenuBrowseView';
import { OrderOnlineTopBar } from './OrderOnlineTopBar';
import { OrderCartView } from './OrderCartView';
import { OrderCheckoutView } from './OrderCheckoutView';
import { OrderConfirmationView } from './OrderConfirmationView';
import {
  formatVenueHoursLine,
  getOnlineFulfillmentVisibility,
  isDeliveryEnabledInSettings,
} from './orderOnlineSettings';
import type {
  DeliveryZoneRow,
  OnlineFulfillmentType,
  OnlineOrderCreateResponse,
  OnlinePaymentMethod,
  OnlineSettingsRow,
} from '../types/online';
import { findZoneForPoint } from '../services/deliveryZones';

function generateCartItemKey(productId: string, modifiers: SelectedModifiers): string {
  const modKey = Object.entries(modifiers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gId, opts]) => `${gId}:${opts.map((o) => o.id).sort().join(',')}`)
    .join('|');
  return `${productId}__${modKey}`;
}

type Flow = 'browse' | 'checkout' | 'done';

function OrderContent() {
  const { t, language, setLanguage } = useLanguage();
  const { user, session, loading: authLoading, signIn, signUp, sendPhoneOtp, verifyPhoneOtp, signInWithGoogle, signOut } =
    useAuth();
  const accessToken = session?.access_token ?? null;

  const { products, categories, loading, error } = useOnlineMenu();
  const { profile, addresses, loading: dataLoading, saveProfile, saveAddress } = useCustomerData(
    user?.id
  );
  const { orders, loading: ordersLoading, reload: reloadOrders } = useOrderHistory(user?.id);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [flow, setFlow] = useState<Flow>('browse');
  const [navTab, setNavTab] = useState<OrderNavTab>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ORDER_MENU_ALL_CATEGORY_ID);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<OnlineSettingsRow | null>(null);
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fulfillment, setFulfillment] = useState<OnlineFulfillmentType>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<OnlinePaymentMethod>('cod');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveAddressForNext, setSaveAddressForNext] = useState(true);

  const [result, setResult] = useState<OnlineOrderCreateResponse | null>(null);
  const [paymentReturn, setPaymentReturn] = useState<'success' | 'error' | null>(null);
  const [paymentReturnDetail, setPaymentReturnDetail] = useState<string | null>(null);

  const tableLabel = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get('table') ?? q.get('ref') ?? '';
  }, []);

  useEffect(() => {
    void (async () => {
      const [s, z] = await Promise.all([
        supabase.from('online_settings').select('*').limit(1).maybeSingle(),
        supabase.from('delivery_zones').select('*').eq('is_active', true),
      ]);
      if (s.data) setSettings(s.data as OnlineSettingsRow);
      if (z.data) setZones(z.data as DeliveryZoneRow[]);
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid');
    const paymentErr = params.get('payment_error');
    if (paid === '1') {
      setPaymentReturn('success');
      setPaymentReturnDetail(null);
      params.delete('paid');
      params.delete('sale');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
      void reloadOrders();
      return;
    }
    if (paymentErr === '1') {
      setPaymentReturn('error');
      setPaymentReturnDetail(params.get('message')?.trim() || null);
      params.delete('payment_error');
      params.delete('sale');
      params.delete('message');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
  }, [reloadOrders]);

  const { showTakeaway, showDelivery } = useMemo(
    () => getOnlineFulfillmentVisibility(settings),
    [settings]
  );

  const venueAddress = (import.meta.env.VITE_ORDER_VENUE_ADDRESS as string | undefined)?.trim() ?? '';
  const venuePhone = (import.meta.env.VITE_ORDER_VENUE_PHONE as string | undefined)?.trim() ?? '';
  const hoursLine = useMemo(
    () => formatVenueHoursLine(settings?.hours_json as Record<string, unknown> | undefined),
    [settings]
  );

  /** True when Supabase allows delivery orders (separate from storefront showing both options). */
  const serverAllowsDelivery = useMemo(() => isDeliveryEnabledInSettings(settings), [settings]);

  useEffect(() => {
    if (!settings) return;
    if (!settings.takeaway_enabled && settings.delivery_enabled) setFulfillment('delivery');
  }, [settings]);

  useEffect(() => {
    if (!user || !profile) return;
    setCustomerName((n) => (n.trim() ? n : profile.full_name ?? ''));
    setCustomerPhone((p) => (p.trim() ? p : profile.phone ?? ''));
  }, [user, profile]);

  useEffect(() => {
    if (!user || addresses.length === 0) {
      setSelectedSavedAddressId(null);
      return;
    }
    const def = addresses.find((a) => a.is_default) ?? addresses[0];
    setSelectedSavedAddressId((prev) => prev ?? def.id);
  }, [user, addresses]);

  useEffect(() => {
    if (!selectedSavedAddressId) return;
    const a = addresses.find((x) => x.id === selectedSavedAddressId);
    if (!a) return;
    setDeliveryAddress(a.line1);
    if (a.lat != null && a.lng != null) {
      setLat(a.lat);
      setLng(a.lng);
    }
  }, [selectedSavedAddressId, addresses]);

  const zoneMatch = useMemo(() => {
    if (lat == null || lng == null) return null;
    return findZoneForPoint(lng, lat, zones);
  }, [lat, lng, zones]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const modTotal = Object.values(item.selectedModifiers)
        .flat()
        .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
      return sum + (Number(item.product.selling_price) + modTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (fulfillment !== 'delivery' || !zoneMatch) return 0;
    return Number(zoneMatch.delivery_fee ?? 0);
  }, [fulfillment, zoneMatch]);

  const grandTotal = cartTotal + deliveryFee;
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCartWithModifiers = (product: Product, selectedModifiers: SelectedModifiers) => {
    const key = generateCartItemKey(product.id, selectedModifiers);
    const existing = cart.find((c) => c.cartItemKey === key);
    if (existing) {
      setCart(
        cart.map((c) => (c.cartItemKey === key ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      setCart([
        ...cart,
        { product, quantity: 1, notes: '', selectedModifiers, cartItemKey: key },
      ]);
    }
    setDetailProduct(null);
  };

  const addSimple = (product: Product) => {
    const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
    if (hasModifiers) setDetailProduct(product);
    else addToCartWithModifiers(product, {});
  };

  const updateQty = useCallback((cartItemKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.cartItemKey !== cartItemKey ? c : { ...c, quantity: Math.max(0, c.quantity + delta) }))
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const removeLine = (cartItemKey: string) => {
    setCart((c) => c.filter((x) => x.cartItemKey !== cartItemKey));
  };

  const handleLocate = () => {
    setGeoStatus(t.orderGeoLocating);
    if (!navigator.geolocation) {
      setGeoStatus(t.orderGeoNotSupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoStatus(t.orderGeoUpdated);
      },
      () => setGeoStatus(t.orderGeoFailed),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      setSubmitError(t.orderAuthRequired);
      setFlow('browse');
      setNavTab('account');
      return;
    }
    if (cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const lines = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes || undefined,
        modifierOptionIds: Object.values(item.selectedModifiers)
          .flat()
          .map((o) => o.id),
      }));

      const body = {
        fulfillmentType: fulfillment,
        paymentMethod,
        cart: lines,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryLat: fulfillment === 'delivery' ? lat ?? undefined : undefined,
        deliveryLng: fulfillment === 'delivery' ? lng ?? undefined : undefined,
        tableLabel: tableLabel.trim() || undefined,
      };

      const res = await invokeEdgeFunction<typeof body, OnlineOrderCreateResponse>(
        'online-order-create',
        body,
        accessToken
      );
      if (!res.ok || !res.data) {
        setSubmitError(res.error ?? 'Order failed');
        setSubmitting(false);
        return;
      }

      const data = res.data;
      if (data.nextStep === 'epoint-create-payment' && paymentMethod === 'epoint') {
        if (!data.paymentInitToken) {
          setSubmitError(t.orderPaymentReturnFailed);
          setSubmitting(false);
          return;
        }
        const pay = await invokeEdgeFunction<
          { saleId: string; paymentInitToken: string; saveCard?: boolean; useWallet?: boolean },
          { checkoutUrl?: string }
        >(
          'epoint-create-payment',
          {
            saleId: data.saleId,
            paymentInitToken: data.paymentInitToken,
            saveCard: false,
            useWallet: false,
          },
          accessToken
        );
        if (!pay.ok) {
          setSubmitError(pay.error ?? 'Payment init failed');
          setSubmitting(false);
          return;
        }
        if (pay.data?.checkoutUrl) {
          window.location.href = pay.data.checkoutUrl;
          return;
        }
      }

      if (
        user &&
        fulfillment === 'delivery' &&
        saveAddressForNext &&
        deliveryAddress.trim() &&
        lat != null &&
        lng != null
      ) {
        const exists = addresses.some((a) => a.line1.trim() === deliveryAddress.trim());
        if (!exists) {
          await saveAddress({
            label: addresses.length === 0 ? 'Home' : 'Address',
            line1: deliveryAddress.trim(),
            lat,
            lng,
            is_default: addresses.length === 0,
          });
        }
      }

      setResult(data);
      setCart([]);
      setFlow('done');
      void reloadOrders();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Error');
    }
    setSubmitting(false);
  };

  const openCheckout = () => {
    if (!user) {
      setNavTab('account');
      return;
    }
    setFlow('checkout');
  };

  const accountPanelT = useMemo(
    () => ({
      orderSignIn: t.orderSignIn,
      orderSignUp: t.orderSignUp,
      orderSignOut: t.orderSignOut,
      orderMyOrders: t.orderMyOrders,
      orderNoOrders: t.orderNoOrders,
      orderSavedAddresses: t.orderSavedAddresses,
      orderEmail: t.orderEmail,
      orderPassword: t.orderPassword,
      orderCreateAccountHint: t.orderCreateAccountHint,
      orderYourName: t.orderYourName,
      orderYourPhone: t.orderYourPhone,
      orderSaveProfile: t.orderSaveProfile,
      orderAddAddress: t.orderAddAddress,
      orderAddressLabel: t.orderAddressLabel,
      orderAddressStreet: t.orderAddressStreet,
      orderAuthEmail: t.orderAuthEmail,
      orderAuthSms: t.orderAuthSms,
      orderAuthGoogle: t.orderAuthGoogle,
      orderSendSmsCode: t.orderSendSmsCode,
      orderSmsCode: t.orderSmsCode,
      orderVerifySms: t.orderVerifySms,
      orderSmsSentHint: t.orderSmsSentHint,
      orderChangePhone: t.orderChangePhone,
      orderInvalidPhone: t.orderInvalidPhone,
      orderAccountPhone: t.orderAccountPhone,
      orderMapSearchPlaceholder: t.orderMapSearchPlaceholder,
      orderMapPinHint: t.orderMapPinHint,
      orderMapLoading: t.orderMapLoading,
      orderMapUnavailable: t.orderMapUnavailable,
      orderDeliveryAddress: t.orderDeliveryAddress,
    }),
    [t]
  );

  const menuBrowseLabels = useMemo(
    () => ({
      allCategories: t.orderAllCategories,
      orderChooseFulfillmentTitle: t.orderChooseFulfillmentTitle,
      orderFulfillmentTakeaway: t.orderFulfillmentTakeaway,
      orderFulfillmentDelivery: t.orderFulfillmentDelivery,
      orderSearchMenu: t.orderSearchMenu,
      orderVenueInfoTitle: t.orderVenueInfoTitle,
      orderVenueHours: t.orderVenueHours,
      orderVenueAddress: t.orderVenueAddress,
      orderVenuePhone: t.orderVenuePhone,
      orderAddToCart: t.orderAddToCart,
      orderSearchNoResults: t.orderSearchNoResults,
    }),
    [t]
  );

  const cartLabels = useMemo(
    () => ({
      title: t.orderYourCart,
      empty: t.orderCartEmptyTitle,
      emptyAction: t.backToMenu,
      subtotal: t.orderSubtotal,
      deliveryFee: t.orderDeliveryFeeRow,
      total: t.orderTotal,
      continueCheckout: t.orderCheckout,
      authRequired: t.orderAuthRequired,
    }),
    [t]
  );

  const checkoutLabels = useMemo(
    () => ({
      back: t.back,
      checkout: t.orderCheckout,
      contact: t.orderStepContact,
      phone: t.orderPhone,
      nameOptional: t.orderNameOptional,
      pickupOrDelivery: t.orderChooseFulfillmentTitle,
      takeaway: t.orderFulfillmentTakeaway,
      delivery: t.orderFulfillmentDelivery,
      deliveryAddress: t.orderDeliveryAddress,
      selectSaved: t.orderSelectSavedAddress,
      addressDismiss: t.cancel,
      useLocation: t.orderUseLocation,
      outsideZone: t.orderOutsideZone,
      inZonePrefix: t.orderInZonePrefix,
      deliveryFeeLabel: t.orderDeliveryFeeRow,
      subtotal: t.orderSubtotal,
      total: t.orderTotal,
      payment: t.orderPayment,
      payCod: t.orderPayCod,
      payCash: t.orderPayCash,
      payEpoint: t.orderPayEpoint,
      placeOrder: t.placeOrder,
      takeawayDisabled: t.orderFulfillmentTakeawayDisabled,
      onlineDisabled: t.orderOnlineDisabled,
      deliveryDisabledHint: t.orderDeliveryDisabledInSettings,
      saveAddressForNext: t.orderSaveAddressForNext,
      mapSearch: t.orderMapSearchPlaceholder,
      mapPinHint: t.orderMapPinHint,
      mapLoading: t.orderMapLoading,
      mapUnavailable: t.orderMapUnavailable,
      authRequired: t.orderAuthRequired,
    }),
    [t]
  );

  if (authLoading || loading) {
    return (
      <div className="ming-shell flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-ming-red" />
          {loading ? <p className="text-sm text-ming-ash">{t.orderLoadingMenu}</p> : null}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ming-shell flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <XCircle className="h-10 w-10 text-ming-red" />
        <p className="text-sm text-ming-ash">{error}</p>
      </div>
    );
  }

  if (flow === 'done' && result) {
    const trackUrl = `${window.location.origin}/track?token=${encodeURIComponent(result.trackToken)}`;
    return (
      <div className="ming-shell">
        <OrderConfirmationView
          displayNumber={result.displayNumber}
          trackUrl={trackUrl}
          labels={{
            title: t.orderPlacedTitle,
            subtitle: t.orderPlacedSubtitle,
            trackHint: t.orderTrackHint,
            openTracking: t.orderOpenTracking,
          }}
        />
      </div>
    );
  }

  const canSubmit =
    !submitting &&
    !!user &&
    cart.length > 0 &&
    customerPhone.trim().length > 0 &&
    !(fulfillment === 'delivery' && !serverAllowsDelivery) &&
    !(fulfillment === 'delivery' && (!zoneMatch || !deliveryAddress.trim()));

  const showBottomNav = flow === 'browse';
  const showMobileStickyCart = flow === 'browse' && navTab === 'menu' && cartCount > 0;

  const paymentBanner = paymentReturn ? (
    <div
      role="status"
      className={`mx-auto mt-3 flex w-full max-w-3xl items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm sm:mx-4 ${
        paymentReturn === 'success'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-ming-red/40 bg-ming-red/10 text-ming-red'
      }`}
    >
      <div className="flex items-start gap-2">
        {paymentReturn === 'success' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div>
          <p className="font-semibold">
            {paymentReturn === 'success' ? t.orderPaymentReturnSuccess : t.orderPaymentReturnFailed}
          </p>
          {paymentReturn === 'error' && paymentReturnDetail ? (
            <p className="mt-1 text-xs opacity-90">{paymentReturnDetail}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-lg p-1 text-current transition-colors hover:bg-white/10"
        onClick={() => {
          setPaymentReturn(null);
          setPaymentReturnDetail(null);
        }}
        aria-label={t.orderPaymentDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  const cartPanel = (
    <OrderCartView
      cart={cart}
      cartTotal={cartTotal}
      deliveryFee={deliveryFee}
      grandTotal={grandTotal}
      showDeliveryFee={fulfillment === 'delivery'}
      onUpdateQty={updateQty}
      onRemoveLine={removeLine}
      onCheckout={openCheckout}
      userLoggedIn={!!user}
      onBackToMenu={() => setNavTab('menu')}
      labels={cartLabels}
      variant="panel"
    />
  );

  return (
    <div className="ming-shell ming-noise flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]">
      {flow === 'browse' && (
        <>
          <OrderOnlineTopBar
            language={language}
            onLanguageChange={setLanguage}
            languageLabel={t.orderLanguage}
            cartCount={cartCount}
            onOpenCart={() => setNavTab('cart')}
            onOpenAccount={() => setNavTab('account')}
            cartAriaLabel={t.orderNavCart}
            accountAriaLabel={t.orderNavAccount}
            fulfillment={fulfillment}
            onFulfillmentChange={setFulfillment}
            showTakeaway={showTakeaway}
            showDelivery={showDelivery}
            fulfillmentLabel={t.orderChooseFulfillmentTitle}
            takeawayLabel={t.orderFulfillmentTakeaway}
            deliveryLabel={t.orderFulfillmentDelivery}
          />

          {paymentBanner}

          {navTab === 'menu' && (
            <>
              <OrderBrandHeader
                title={t.orderOnlineTitle}
                tagline={settings?.tagline}
                heroImageUrl={settings?.hero_image_url}
              />

              <OrderMenuBrowseView
                categories={categories}
                products={products}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                fulfillment={fulfillment}
                onFulfillmentChange={setFulfillment}
                showTakeaway={showTakeaway}
                showDelivery={showDelivery}
                hoursLine={hoursLine}
                venueAddress={venueAddress}
                venuePhone={venuePhone}
                labels={menuBrowseLabels}
                onAddProduct={addSimple}
                serverAllowsDelivery={serverAllowsDelivery}
                deliveryDisabledHint={t.orderDeliveryDisabledInSettings}
                sideSlot={cartPanel}
              />
            </>
          )}

          {navTab === 'cart' && (
            <OrderCartView
              cart={cart}
              cartTotal={cartTotal}
              deliveryFee={deliveryFee}
              grandTotal={grandTotal}
              showDeliveryFee={fulfillment === 'delivery'}
              onUpdateQty={updateQty}
              onRemoveLine={removeLine}
              onCheckout={openCheckout}
              userLoggedIn={!!user}
              onBackToMenu={() => setNavTab('menu')}
              labels={cartLabels}
              variant="view"
            />
          )}

          {navTab === 'account' && (
            <OrderAccountPanel
              user={user}
              signIn={signIn}
              signUp={signUp}
              sendPhoneOtp={sendPhoneOtp}
              verifyPhoneOtp={verifyPhoneOtp}
              signInWithGoogle={signInWithGoogle}
              signOut={signOut}
              profile={profile}
              addresses={addresses}
              dataLoading={dataLoading}
              onSaveProfile={saveProfile}
              onSaveAddress={saveAddress}
              orders={orders}
              ordersLoading={ordersLoading}
              onReloadOrders={reloadOrders}
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              t={accountPanelT}
            />
          )}
        </>
      )}

      {flow === 'checkout' && (
        <OrderCheckoutView
          fulfillment={fulfillment}
          showTakeaway={showTakeaway}
          showDelivery={showDelivery}
          onFulfillmentChange={setFulfillment}
          serverAllowsDelivery={serverAllowsDelivery}
          customerPhone={customerPhone}
          customerName={customerName}
          onCustomerPhoneChange={setCustomerPhone}
          onCustomerNameChange={setCustomerName}
          userLoggedIn={!!user}
          savedAddresses={addresses}
          selectedSavedAddressId={selectedSavedAddressId}
          onSelectSavedAddressId={setSelectedSavedAddressId}
          saveAddressForNext={saveAddressForNext}
          onSaveAddressForNextChange={setSaveAddressForNext}
          deliveryAddress={deliveryAddress}
          lat={lat}
          lng={lng}
          onLocationChange={({ lat: nextLat, lng: nextLng, address: nextAddr }) => {
            setLat(nextLat);
            setLng(nextLng);
            setDeliveryAddress(nextAddr);
          }}
          onAddressChange={setDeliveryAddress}
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          onUseLocation={handleLocate}
          geoStatus={geoStatus}
          zoneMatch={zoneMatch}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          cartTotal={cartTotal}
          deliveryFee={deliveryFee}
          grandTotal={grandTotal}
          submitting={submitting}
          submitError={submitError}
          canSubmit={canSubmit}
          onSubmit={() => void handleSubmitOrder()}
          onBack={() => setFlow('browse')}
          labels={checkoutLabels}
        />
      )}

      {showMobileStickyCart && (
        <button
          type="button"
          onClick={() => setNavTab('cart')}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[25] flex items-center justify-between rounded-2xl border border-ming-red/60 bg-ming-red px-4 py-3.5 text-left shadow-ming-glow transition-all hover:bg-ming-red-700 active:scale-[0.99] lg:hidden"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30">
              <ShoppingBag className="h-4 w-4" />
            </span>
            {t.orderViewCart}
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">{cartCount}</span>
          </span>
          <span className="ming-mono text-base font-bold text-white">{grandTotal.toFixed(2)} ₼</span>
        </button>
      )}

      {showBottomNav && (
        <OrderBottomNav
          tab={navTab}
          onChange={setNavTab}
          cartCount={cartCount}
          labels={{
            menu: t.orderNavMenu,
            cart: t.orderNavCart,
            account: t.orderNavAccount,
          }}
        />
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onAddToCart={addToCartWithModifiers}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}

export function OrderApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <OrderContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
