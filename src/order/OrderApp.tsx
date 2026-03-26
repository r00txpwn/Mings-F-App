import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Loader2,
  MapPin,
  ChevronLeft,
  Trash2,
  Navigation,
  Minus,
  Plus,
} from 'lucide-react';
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
import { OrderAddressMap } from './OrderAddressMap';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';
import { OrderMenuBrowseView, ORDER_MENU_ALL_CATEGORY_ID } from './OrderMenuBrowseView';
import { OrderOnlineTopBar } from './OrderOnlineTopBar';
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
  const { user, session, loading: authLoading, signIn, signUp, sendPhoneOtp, verifyPhoneOtp, signOut } =
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
    // Only auto-pick when takeaway is off and delivery is on (single-mode).
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
        cart.map((c) =>
          c.cartItemKey === key ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          notes: '',
          selectedModifiers,
          cartItemKey: key,
        },
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
    setCart((prev) => {
      const next = prev
        .map((c) => {
          if (c.cartItemKey !== cartItemKey) return c;
          const q = Math.max(0, c.quantity + delta);
          return { ...c, quantity: q };
        })
        .filter((c) => c.quantity > 0);
      return next;
    });
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
        const pay = await invokeEdgeFunction<{ saleId: string }, { checkoutUrl?: string }>(
          'epoint-create-payment',
          { saleId: data.saleId },
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
          <p className="text-sm">{t.orderLoadingMenu}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 p-6 text-center text-slate-300">
        <p>{error}</p>
      </div>
    );
  }

  if (flow === 'done' && result) {
    const trackUrl = `${window.location.origin}/track?token=${encodeURIComponent(result.trackToken)}`;
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <h1 className="text-2xl font-bold text-white">{t.orderPlacedTitle}</h1>
          <p className="mt-2 font-mono text-cockpit-400">#{result.displayNumber}</p>
          <p className="mt-4 text-sm text-slate-400">
            {t.orderTrackHint}:{' '}
            <a href={trackUrl} className="text-cockpit-400 underline">
              {trackUrl}
            </a>
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-cockpit-600 py-3 font-semibold text-white"
            onClick={() => window.location.assign(trackUrl)}
          >
            {t.orderOpenTracking}
          </button>
        </div>
      </div>
    );
  }

  const showBottomNav = flow === 'browse';
  const showStickyCart =
    flow === 'browse' && navTab === 'menu' && cartCount > 0;

  return (
    <div className="neon-shell flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]">
      {flow === 'browse' && (
        <>
          <OrderBrandHeader
            title={t.orderOnlineTitle}
            tagline={settings?.tagline}
            heroImageUrl={settings?.hero_image_url}
          />
          <OrderOnlineTopBar
            language={language}
            onLanguageChange={setLanguage}
            languageLabel={t.orderLanguage}
            cartCount={cartCount}
            onOpenCart={() => setNavTab('cart')}
            onOpenAccount={() => setNavTab('account')}
            cartAriaLabel={t.orderNavCart}
            accountAriaLabel={t.orderNavAccount}
          />
          {(navTab === 'cart' || navTab === 'account') && (
            <div className="border-b border-violet-500/20 bg-slate-950/80 px-3">
              <OrderFulfillmentPicker
                fulfillment={fulfillment}
                onChange={setFulfillment}
                showTakeaway={showTakeaway}
                showDelivery={showDelivery}
                label={t.orderChooseFulfillmentTitle}
                takeawayLabel={t.orderFulfillmentTakeaway}
                deliveryLabel={t.orderFulfillmentDelivery}
                variant="compact"
              />
            </div>
          )}
        </>
      )}

      {flow === 'checkout' && (
        <header className="neon-topbar sticky top-0 z-10 flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/5"
            onClick={() => setFlow('browse')}
            aria-label={t.back}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold">{t.orderCheckout}</span>
        </header>
      )}

      {flow === 'browse' && navTab === 'menu' && (
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
        />
      )}

      {flow === 'browse' && navTab === 'cart' && (
        <div className="flex flex-1 flex-col gap-4 p-4 pb-36">
          <h2 className="text-lg font-semibold">{t.orderYourCart}</h2>
          {cart.length === 0 ? (
            <p className="text-slate-500">{t.emptyCart}</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((item) => {
                const modTotal = Object.values(item.selectedModifiers)
                  .flat()
                  .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
                const line =
                  (Number(item.product.selling_price) + modTotal) * item.quantity;
                return (
                  <li
                    key={item.cartItemKey}
                    className="neon-card flex flex-col gap-2 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="font-mono text-sm text-cockpit-300">₼{line.toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-2 text-rose-400 hover:bg-slate-800"
                        onClick={() => removeLine(item.cartItemKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
                        onClick={() => updateQty(item.cartItemKey, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
                        onClick={() => updateQty(item.cartItemKey, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t.orderSubtotal}</span>
              <span className="font-mono">₼{cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={cart.length === 0}
            className="neon-btn-primary mt-2 w-full py-4 disabled:opacity-40"
            onClick={openCheckout}
          >
            {t.orderCheckout}
          </button>
        </div>
      )}

      {flow === 'browse' && navTab === 'account' && (
        <OrderAccountPanel
          user={user}
          signIn={signIn}
          signUp={signUp}
          sendPhoneOtp={sendPhoneOtp}
          verifyPhoneOtp={verifyPhoneOtp}
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

      {flow === 'checkout' && (
        <div className="flex flex-1 flex-col gap-4 p-4 pb-12">
          {settings && !settings.takeaway_enabled && settings.delivery_enabled ? (
            <p className="text-sm text-amber-400">{t.orderFulfillmentTakeawayDisabled}</p>
          ) : null}
          <div className="space-y-2">
            <OrderFulfillmentPicker
              fulfillment={fulfillment}
              onChange={setFulfillment}
              showTakeaway={showTakeaway}
              showDelivery={showDelivery}
              label={t.orderChooseFulfillmentTitle}
              takeawayLabel={t.orderFulfillmentTakeaway}
              deliveryLabel={t.orderFulfillmentDelivery}
            />
            {!showTakeaway && !showDelivery ? (
              <p className="text-sm text-rose-400">{t.orderOnlineDisabled}</p>
            ) : null}
          </div>

          {fulfillment === 'delivery' && !serverAllowsDelivery ? (
            <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-100/95">
              {t.orderDeliveryDisabledInSettings}
            </p>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs text-slate-500">{t.orderPhone} *</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+994..."
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">{t.orderNameOptional}</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {fulfillment === 'delivery' && user && addresses.length > 0 ? (
            <div className="space-y-2">
              <label className="text-xs text-slate-500">{t.orderSelectSavedAddress}</label>
              <select
                className="cockpit-select"
                value={selectedSavedAddressId ?? ''}
                onChange={(e) => setSelectedSavedAddressId(e.target.value || null)}
              >
                <option value="">{t.cancel}</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.line1}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {fulfillment === 'delivery' && (
            <>
              <OrderAddressMap
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                lat={lat}
                lng={lng}
                address={deliveryAddress}
                onLocationChange={({ lat: nextLat, lng: nextLng, address: nextAddr }) => {
                  setLat(nextLat);
                  setLng(nextLng);
                  setDeliveryAddress(nextAddr);
                }}
                onAddressChange={setDeliveryAddress}
                searchPlaceholder={t.orderMapSearchPlaceholder}
                pinHint={t.orderMapPinHint}
                loadingLabel={t.orderMapLoading}
                unavailableLabel={t.orderMapUnavailable}
                addressLabel={`${t.orderDeliveryAddress} *`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLocate}
                  className="neon-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <Navigation className="h-4 w-4" />
                  {t.orderUseLocation}
                </button>
                {geoStatus ? <span className="text-xs text-slate-500">{geoStatus}</span> : null}
              </div>
              {lat != null && lng != null ? (
                <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {zoneMatch ? (
                    <>
                      {t.orderInZonePrefix}: {zoneMatch.name} · {t.orderDeliveryFeeRow} ₼
                      {Number(zoneMatch.delivery_fee).toFixed(2)}
                    </>
                  ) : (
                    <span className="text-amber-400">{t.orderOutsideZone}</span>
                  )}
                </p>
              ) : null}
              {user ? (
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={saveAddressForNext}
                    onChange={(e) => setSaveAddressForNext(e.target.checked)}
                  />
                  {t.orderSaveAddressForNext}
                </label>
              ) : null}
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs text-slate-500">{t.orderPayment}</label>
            <select
              className="cockpit-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as OnlinePaymentMethod)}
            >
              <option value="cod">{t.orderPayCod}</option>
              <option value="cash">{t.orderPayCash}</option>
              <option value="epoint">{t.orderPayEpoint}</option>
            </select>
          </div>

          {submitError ? <p className="text-sm text-rose-400">{submitError}</p> : null}

          <div className="neon-card p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t.orderSubtotal}</span>
              <span className="font-mono">₼{cartTotal.toFixed(2)}</span>
            </div>
            {fulfillment === 'delivery' ? (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-400">{t.orderDeliveryFeeRow}</span>
                <span className="font-mono">₼{deliveryFee.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
              <span>{t.orderTotal}</span>
              <span className="font-mono text-cockpit-400">₼{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={
              submitting ||
              cart.length === 0 ||
              (fulfillment === 'delivery' && !serverAllowsDelivery) ||
              (fulfillment === 'delivery' && (!zoneMatch || !deliveryAddress.trim()))
            }
            className="neon-btn-primary w-full py-4 disabled:opacity-40"
            onClick={() => void handleSubmitOrder()}
          >
            {submitting ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : t.placeOrder}
          </button>
        </div>
      )}

      {showStickyCart && (
        <button
          type="button"
          onClick={() => setNavTab('cart')}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-[25] flex items-center justify-between rounded-2xl border border-violet-500/45 bg-slate-900/95 px-4 py-3 text-left shadow-neon backdrop-blur-md"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="h-5 w-5 text-cockpit-400" />
            {t.orderViewCart}
            <span className="rounded-full bg-cockpit-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>
          </span>
          <span className="font-mono text-cockpit-300">₼{grandTotal.toFixed(2)}</span>
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
