import { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Loader2, ShoppingBag, XCircle, X } from 'lucide-react';
import { Analytics, track } from '@vercel/analytics/react';
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
import { OrderCheckbox } from './OrderCheckbox';
import { ORDER_ADDRESS_TYPE_CONFIG } from './addressTypeConfig';
import {
  formatVenueHoursLine,
  getOnlineFulfillmentVisibility,
  isDeliveryEnabledInSettings,
} from './orderOnlineSettings';
import type {
  CustomerAddressAccessMethod,
  CustomerAddressLeaveAt,
  CustomerAddressType,
  DeliveryZoneRow,
  OnlineFulfillmentType,
  OnlineOrderCreateResponse,
  OnlinePaymentMethod,
  OnlineSettingsRow,
} from '../types/online';
import { isCardOnlinePaymentMethod } from '../lib/onlinePaymentMethod';
import { normalizePhoneE164 } from '../lib/phoneE164';
import { findZoneForPoint } from '../services/deliveryZones';
import { Price } from '../components/Price';

function generateCartItemKey(productId: string, modifiers: SelectedModifiers): string {
  const modKey = Object.entries(modifiers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gId, opts]) => `${gId}:${opts.map((o) => o.id).sort().join(',')}`)
    .join('|');
  return `${productId}__${modKey}`;
}

type Flow = 'browse' | 'checkout' | 'done';
const ORDER_CART_STORAGE_KEY = 'mings-order-cart-v2';
const ORDER_COOKIE_CONSENT_KEY = 'mings-order-cookie-consent-v1';
const ORDER_SIGNIN_PROMPT_DISMISS_KEY = 'mings-order-signin-prompt-dismissed-v1';
const ORDER_TERMS_VERSION = '2026-04-order-v1';

interface StoredOrderCartState {
  cart: CartItem[];
  fulfillment: OnlineFulfillmentType;
  selectedSavedAddressId: string | null;
  dismissedSignInPrompt?: boolean;
}

interface SavedCardRow {
  id: string;
  card_mask: string | null;
  card_brand: string | null;
}

interface ConfirmationLine {
  name: string;
  quantity: number;
  lineTotal: number;
  customizations: string[];
}

interface ConfirmationSnapshot {
  lines: ConfirmationLine[];
  subtotal: number;
  total: number;
  fulfillment: OnlineFulfillmentType;
  etaText: string;
}

const SCHEDULE_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type ScheduleDayKey = (typeof SCHEDULE_DAY_KEYS)[number];

interface DayHoursConfig {
  closed: boolean;
  openMinutes: number;
  closeMinutes: number;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getScheduleDayKey(date: Date): ScheduleDayKey {
  return SCHEDULE_DAY_KEYS[date.getDay()];
}

function getDayHoursConfig(
  hoursJson: Record<string, unknown> | undefined,
  dayKey: ScheduleDayKey,
): DayHoursConfig | null {
  if (!hoursJson || typeof hoursJson !== 'object') return null;
  const raw = hoursJson[dayKey];
  if (!raw || typeof raw !== 'object') return null;
  const dayObj = raw as Record<string, unknown>;
  const openRaw = typeof dayObj.open === 'string' ? dayObj.open : null;
  const closeRaw = typeof dayObj.close === 'string' ? dayObj.close : null;
  const openMinutes = openRaw ? parseTimeToMinutes(openRaw) : null;
  const closeMinutes = closeRaw ? parseTimeToMinutes(closeRaw) : null;
  if (openMinutes == null || closeMinutes == null) return null;
  return {
    closed: Boolean(dayObj.closed),
    openMinutes,
    closeMinutes,
  };
}

function isSlotInsideWorkingHours(date: Date, config: DayHoursConfig | null): boolean {
  if (!config) return true;
  if (config.closed) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (config.openMinutes === config.closeMinutes) return true;
  if (config.openMinutes < config.closeMinutes) {
    return minutes >= config.openMinutes && minutes < config.closeMinutes;
  }
  return minutes >= config.openMinutes || minutes < config.closeMinutes;
}

function OrderContent() {
  const { t, language, setLanguage } = useLanguage();
  const {
    user,
    session,
    loading: authLoading,
    signIn,
    signUp,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    forgotPassword,
    signOut,
  } =
    useAuth();
  const accessToken = session?.access_token ?? null;

  const { products, categories, loading, error } = useOnlineMenu();
  const { profile, addresses, loading: dataLoading, saveProfile, saveAddress, deleteAddress } = useCustomerData(
    user?.id
  );
  const { orders, loading: ordersLoading, reload: reloadOrders } = useOrderHistory(user?.id);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartStorageReady, setCartStorageReady] = useState(false);
  const [flow, setFlow] = useState<Flow>('browse');
  const [navTab, setNavTab] = useState<OrderNavTab>('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ORDER_MENU_ALL_CATEGORY_ID);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<OnlineSettingsRow | null>(null);
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fulfillment, setFulfillment] = useState<OnlineFulfillmentType>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<OnlinePaymentMethod>('cash_pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryApartment, setDeliveryApartment] = useState('');
  const [deliveryFloor, setDeliveryFloor] = useState('');
  const [deliveryAddressType, setDeliveryAddressType] = useState<CustomerAddressType>('apartment');
  const [deliveryBuildingName, setDeliveryBuildingName] = useState('');
  const [deliveryEntrance, setDeliveryEntrance] = useState('');
  const [deliveryDoorNameOrNumber, setDeliveryDoorNameOrNumber] = useState('');
  const [deliveryCompanyName, setDeliveryCompanyName] = useState('');
  const [deliveryLeaveAt, setDeliveryLeaveAt] = useState<CustomerAddressLeaveAt>('office');
  const [deliveryAccessMethod, setDeliveryAccessMethod] = useState<CustomerAddressAccessMethod>('intercom');
  const [deliveryIntercomNameOrNumber, setDeliveryIntercomNameOrNumber] = useState('');
  const [deliveryDoorCode, setDeliveryDoorCode] = useState('');
  const [deliveryAccessOtherInstructions, setDeliveryAccessOtherInstructions] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveAddressForNext, setSaveAddressForNext] = useState(true);
  const [saveAddressLabel, setSaveAddressLabel] = useState('Home');
  const [promoCode, setPromoCode] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhoneInput, setProfilePhoneInput] = useState('');
  const [profileTermsAccepted, setProfileTermsAccepted] = useState(false);
  const [profileCompletionError, setProfileCompletionError] = useState<string | null>(null);
  const [profileCompletionBusy, setProfileCompletionBusy] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCardRow[]>([]);

  const [result, setResult] = useState<OnlineOrderCreateResponse | null>(null);
  const [confirmationSnapshot, setConfirmationSnapshot] = useState<ConfirmationSnapshot | null>(null);
  const [paymentReturn, setPaymentReturn] = useState<'success' | 'error' | null>(null);
  const [paymentReturnDetail, setPaymentReturnDetail] = useState<string | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [upsellPromptProduct, setUpsellPromptProduct] = useState<Product | null>(null);
  const [cookieConsent, setCookieConsent] = useState<boolean>(() => {
    const raw = window.localStorage.getItem(ORDER_COOKIE_CONSENT_KEY);
    return raw === 'accepted';
  });

  const acceptCookieConsent = useCallback(() => {
    window.localStorage.setItem(ORDER_COOKIE_CONSENT_KEY, 'accepted');
    setCookieConsent(true);
  }, []);

  const tableLabel = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get('table') ?? q.get('ref') ?? '';
  }, []);

  useEffect(() => {
    const detectRecovery = () => {
      const query = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#')
        ? new URLSearchParams(window.location.hash.slice(1))
        : new URLSearchParams();
      const authType = query.get('type') ?? hash.get('type');
      if (authType === 'recovery') {
        setFlow('browse');
        setNavTab('account');
      }
    };
    detectRecovery();
    window.addEventListener('hashchange', detectRecovery);
    return () => window.removeEventListener('hashchange', detectRecovery);
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

  useEffect(() => {
    if (!user) {
      setFavoriteProductIds([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('customer_favorites')
        .select('product_id')
        .eq('user_id', user.id);
      setFavoriteProductIds(((data as Array<{ product_id: string }> | null) ?? []).map((x) => x.product_id));
    })();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedCards([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('saved_cards')
        .select('id, card_mask, card_brand')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setSavedCards((data as SavedCardRow[] | null) ?? []);
    })();
  }, [user]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ORDER_CART_STORAGE_KEY);
      if (!raw) {
        setCartStorageReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<StoredOrderCartState>;
      if (Array.isArray(parsed.cart)) setCart(parsed.cart as CartItem[]);
      if (parsed.fulfillment === 'delivery' || parsed.fulfillment === 'takeaway') {
        setFulfillment(parsed.fulfillment);
      }
      if (typeof parsed.selectedSavedAddressId === 'string' || parsed.selectedSavedAddressId === null) {
        setSelectedSavedAddressId(parsed.selectedSavedAddressId);
      }
    } catch {
      window.localStorage.removeItem(ORDER_CART_STORAGE_KEY);
    } finally {
      setCartStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartStorageReady) return;
    const payload: StoredOrderCartState = {
      cart,
      fulfillment,
      selectedSavedAddressId,
      dismissedSignInPrompt: !showSignInPrompt,
    };
    window.localStorage.setItem(ORDER_CART_STORAGE_KEY, JSON.stringify(payload));
  }, [cart, fulfillment, selectedSavedAddressId, showSignInPrompt, cartStorageReady]);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(ORDER_SIGNIN_PROMPT_DISMISS_KEY) === '1';
    setShowSignInPrompt(!user && !dismissed);
  }, [user]);

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
    setPaymentMethod((pm) => {
      if (pm !== 'cash_pickup' && pm !== 'cash_delivery') return pm;
      return fulfillment === 'takeaway' ? 'cash_pickup' : 'cash_delivery';
    });
  }, [fulfillment]);

  useEffect(() => {
    if (!user || !profile) return;
    setCustomerName((n) => (n.trim() ? n : profile.full_name ?? ''));
    setCustomerPhone((p) =>
      p.trim() ? normalizePhoneE164(p) : normalizePhoneE164(profile.phone ?? '')
    );
    setProfileFirstName(profile.first_name?.trim() ?? '');
    setProfileLastName(profile.last_name?.trim() ?? '');
    setProfilePhoneInput(profile.phone?.trim() ?? '');
    setProfileTermsAccepted(Boolean(profile.terms_accepted_at));
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile) {
      setShowProfileCompletion(false);
      return;
    }
    const hasFirst = Boolean(profile.first_name?.trim());
    const hasLast = Boolean(profile.last_name?.trim());
    const hasTerms = Boolean(profile.terms_accepted_at);
    const provider = user.app_metadata?.provider;
    const createdAt = user.created_at ? Date.parse(user.created_at) : NaN;
    const lastSignInAt = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : NaN;
    const likelyFirstGoogleSignIn =
      provider === 'google' &&
      Number.isFinite(createdAt) &&
      Number.isFinite(lastSignInAt) &&
      Math.abs(lastSignInAt - createdAt) <= 10 * 60 * 1000;
    setShowProfileCompletion(likelyFirstGoogleSignIn && !(hasFirst && hasLast && hasTerms));
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
    setSaveAddressLabel((prev) => {
      if (prev.trim()) return prev;
      return addresses.length === 0 ? 'Home' : 'Address';
    });
  }, [addresses.length]);

  useEffect(() => {
    if (!selectedSavedAddressId) {
      setDeliveryAddressType('apartment');
      setDeliveryBuildingName('');
      setDeliveryEntrance('');
      setDeliveryApartment('');
      setDeliveryFloor('');
      setDeliveryDoorNameOrNumber('');
      setDeliveryCompanyName('');
      setDeliveryLeaveAt('office');
      setDeliveryAccessMethod('intercom');
      setDeliveryIntercomNameOrNumber('');
      setDeliveryDoorCode('');
      setDeliveryAccessOtherInstructions('');
      setDeliveryNotes('');
      return;
    }
    const a = addresses.find((x) => x.id === selectedSavedAddressId);
    if (!a) return;
    setDeliveryAddress(a.line1);
    setDeliveryAddressType(a.address_type ?? 'apartment');
    setDeliveryBuildingName(a.building_name?.trim() ?? '');
    setDeliveryEntrance(a.entrance?.trim() ?? '');
    setDeliveryApartment(a.apartment?.trim() ?? '');
    setDeliveryFloor(a.floor?.trim() ?? '');
    setDeliveryDoorNameOrNumber(a.door_name_or_number?.trim() ?? '');
    setDeliveryCompanyName(a.company_name?.trim() ?? '');
    setDeliveryLeaveAt(a.leave_at ?? 'office');
    setDeliveryAccessMethod(a.access_method ?? 'intercom');
    setDeliveryIntercomNameOrNumber(a.intercom_name_or_number?.trim() ?? '');
    setDeliveryDoorCode(a.door_code?.trim() ?? '');
    setDeliveryAccessOtherInstructions(a.access_other_instructions?.trim() ?? '');
    setDeliveryNotes(a.courier_instructions?.trim() ?? '');
    setLat(a.lat ?? null);
    setLng(a.lng ?? null);
  }, [selectedSavedAddressId, addresses]);

  useEffect(() => {
    const selectedAddressConfig = ORDER_ADDRESS_TYPE_CONFIG[deliveryAddressType];
    if (!selectedAddressConfig.showAccessMethod) {
      setDeliveryAccessMethod('intercom');
      setDeliveryIntercomNameOrNumber('');
      setDeliveryDoorCode('');
      setDeliveryAccessOtherInstructions('');
    }
    if (!selectedAddressConfig.showLeaveAt) {
      setDeliveryLeaveAt('office');
    }
  }, [deliveryAddressType]);

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

  const availableScheduleSlots = useMemo(() => {
    if (settings?.is_open === false) return [];
    const now = new Date();
    const lead = Number(settings?.scheduled_lead_minutes ?? settings?.default_prep_time_minutes ?? 45);
    const slotMinutes = Math.max(5, Number(settings?.scheduled_slot_minutes ?? 15));
    const slotMs = slotMinutes * 60_000;
    const earliest = new Date(now.getTime() + lead * 60_000);
    earliest.setSeconds(0, 0);
    const roundedTs = Math.ceil(earliest.getTime() / slotMs) * slotMs;
    const horizonTs = roundedTs + 7 * 24 * 60 * 60_000;
    const slots: string[] = [];
    const hoursJson = settings?.hours_json as Record<string, unknown> | undefined;

    for (let ts = roundedTs; ts <= horizonTs && slots.length < 240; ts += slotMs) {
      const slotDate = new Date(ts);
      if (slotDate.getTime() < earliest.getTime()) continue;
      const dayKey = getScheduleDayKey(slotDate);
      const dayConfig = getDayHoursConfig(hoursJson, dayKey);
      if (!isSlotInsideWorkingHours(slotDate, dayConfig)) continue;
      slots.push(slotDate.toISOString());
    }
    return slots;
  }, [settings]);

  useEffect(() => {
    if (!isScheduled) return;
    if (availableScheduleSlots.length === 0) {
      if (scheduledFor) setScheduledFor(null);
      return;
    }
    if (!scheduledFor || !availableScheduleSlots.includes(scheduledFor)) {
      setScheduledFor(availableScheduleSlots[0]);
    }
  }, [isScheduled, scheduledFor, availableScheduleSlots]);

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
    track('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      fulfillment,
      quantity: 1,
      value: Number(product.selling_price),
    });
    setDetailProduct(null);
  };

  const addUpsellCombo = useCallback(async (product: Product) => {
    if (!product.upsell_combo_id) return false;
    const { data: combo } = await supabase
      .from('combo_deals')
      .select(
        'id, name, base_price, combo_groups(id, name, required, sort_order, combo_group_items(id, menu_item_id, products(id, name, selling_price)))'
      )
      .eq('id', product.upsell_combo_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!combo) return false;

    const key = `combo__${combo.id}__${Date.now()}`;
    const syntheticProduct: Product = {
      id: String(combo.id),
      name: String(combo.name),
      description: '',
      barcode: null,
      category_id: null,
      master_category_id: null,
      quantity: 0,
      cost_price: 0,
      selling_price: Number(combo.base_price),
      min_stock_level: 0,
      unit: 'pcs',
      supplier_id: null,
      last_order_quantity: 0,
      created_at: '',
      updated_at: '',
      kiosk_visible: true,
      online_visible: true,
    };
    setCart((prev) => [
      ...prev,
      {
        product: syntheticProduct,
        quantity: 1,
        notes: `Combo: ${combo.name}`,
        selectedModifiers: {},
        cartItemKey: key,
        isCombo: true,
        comboId: String(combo.id),
        comboName: String(combo.name),
        comboBasePrice: Number(combo.base_price),
      },
    ]);
    return true;
  }, []);

  const addSimple = async (product: Product) => {
    if (product.combo_upsell_eligible && product.upsell_combo_id) {
      setUpsellPromptProduct(product);
      return;
    }
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

  const updateNotes = useCallback((cartItemKey: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemKey === cartItemKey ? { ...item, notes } : item))
    );
  }, []);

  const removeLine = (cartItemKey: string) => {
    const removed = cart.find((x) => x.cartItemKey === cartItemKey);
    if (removed) {
      track('remove_from_cart', {
        product_id: removed.product.id,
        product_name: removed.product.name,
        quantity: removed.quantity,
      });
    }
    setCart((c) => c.filter((x) => x.cartItemKey !== cartItemKey));
  };

  const handlePaymentMethodChange = (method: OnlinePaymentMethod) => {
    setPaymentMethod(method);
    track('select_payment_method', { payment_method: method });
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

  const userPhoneVerified = useMemo(() => {
    if (!user) return false;
    const authPhoneVerified = Boolean((user as { phone_confirmed_at?: string | null }).phone_confirmed_at);
    const profilePhoneVerified = Boolean(profile?.phone_verified_at);
    return authPhoneVerified || profilePhoneVerified;
  }, [user, profile?.phone_verified_at]);

  const requiresCheckoutPhoneVerification = Boolean(user && !userPhoneVerified);

  const buildCourierNotes = useCallback(() => {
    const chunks: string[] = [];
    const config = ORDER_ADDRESS_TYPE_CONFIG[deliveryAddressType];
    const addField = (label: string, value: string) => {
      const cleaned = value.trim();
      if (cleaned) chunks.push(`${label}: ${cleaned}`);
    };

    if (config.showBuildingName) addField(t.orderAddressBuildingName, deliveryBuildingName);
    if (config.showEntrance) addField(t.orderAddressEntrance, deliveryEntrance);
    if (config.showFloor) addField(t.orderAddressFloor, deliveryFloor);
    if (config.showApartmentUnit) addField(t.orderAddressApartment, deliveryApartment);
    if (config.showDoorNameOrNumber) addField(t.orderAddressDoorNameOrNumber, deliveryDoorNameOrNumber);
    if (config.showCompanyName) addField(t.orderAddressCompanyName, deliveryCompanyName);
    if (config.showLeaveAt) {
      chunks.push(
        `${t.orderAddressLeaveAt}: ${
          deliveryLeaveAt === 'reception' ? t.orderAddressLeaveAtReception : t.orderAddressLeaveAtOffice
        }`
      );
    }

    if (config.showAccessMethod) {
      const accessSummary =
        deliveryAccessMethod === 'intercom'
          ? deliveryIntercomNameOrNumber.trim()
            ? `${t.orderAccessIntercom}: ${deliveryIntercomNameOrNumber.trim()}`
            : t.orderAccessIntercom
          : deliveryAccessMethod === 'door_code'
            ? deliveryDoorCode.trim()
              ? `${t.orderAccessDoorCode}: ${deliveryDoorCode.trim()}`
              : t.orderAccessDoorCode
            : deliveryAccessMethod === 'door_open'
              ? t.orderAccessDoorOpen
              : deliveryAccessOtherInstructions.trim()
                ? deliveryAccessOtherInstructions.trim()
                : t.orderAddressTypeOther;
      if (accessSummary.trim()) chunks.push(accessSummary.trim());
    }
    if (config.showCourierNotes && deliveryNotes.trim()) chunks.push(deliveryNotes.trim());
    return chunks.join(' | ').trim();
  }, [
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
    t.orderAddressBuildingName,
    t.orderAddressEntrance,
    t.orderAddressFloor,
    t.orderAddressApartment,
    t.orderAddressDoorNameOrNumber,
    t.orderAddressCompanyName,
    t.orderAddressLeaveAt,
    t.orderAddressLeaveAtOffice,
    t.orderAddressLeaveAtReception,
    t.orderAccessIntercom,
    t.orderAccessDoorCode,
    t.orderAccessDoorOpen,
    t.orderAddressTypeOther,
  ]);

  const handleCompleteProfile = useCallback(async () => {
    if (!user) return;
    const firstName = profileFirstName.trim();
    const lastName = profileLastName.trim();
    if (!firstName || !lastName) {
      setProfileCompletionError(t.orderProfileCompletionNameRequired);
      return;
    }
    if (!profileTermsAccepted) {
      setProfileCompletionError(t.orderProfileCompletionConsentRequired);
      return;
    }

    const normalizedPhone = normalizePhoneE164(profilePhoneInput.trim());
    const hasPhoneInput = profilePhoneInput.trim().length > 0;
    if (hasPhoneInput && !/^\+[1-9]\d{8,14}$/.test(normalizedPhone)) {
      setProfileCompletionError(t.orderInvalidPhone);
      return;
    }

    setProfileCompletionBusy(true);
    setProfileCompletionError(null);
    try {
      await saveProfile({
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: hasPhoneInput ? normalizedPhone : null,
        terms_accepted_at: new Date().toISOString(),
        terms_version: ORDER_TERMS_VERSION,
        privacy_version: ORDER_TERMS_VERSION,
        refund_version: ORDER_TERMS_VERSION,
      });
      setShowProfileCompletion(false);
    } catch (error) {
      setProfileCompletionError(error instanceof Error ? error.message : t.orderErrGeneric);
    } finally {
      setProfileCompletionBusy(false);
    }
  }, [
    user,
    profileFirstName,
    profileLastName,
    profilePhoneInput,
    profileTermsAccepted,
    saveProfile,
    t.orderProfileCompletionNameRequired,
    t.orderProfileCompletionConsentRequired,
    t.orderInvalidPhone,
    t.orderErrGeneric,
  ]);

  const mapOrderError = useCallback(
    (code?: string, fallback?: string) => {
      const byCode: Record<string, string> = {
        AUTH_REQUIRED: t.orderErrAuthRequired,
        CART_EMPTY: t.orderErrCartEmpty,
        PHONE_REQUIRED: t.orderErrPhoneRequired,
        PHONE_INVALID: t.orderErrPhoneInvalid,
        ONLINE_NOT_CONFIGURED: t.orderErrOnlineUnavailable,
        TAKEAWAY_DISABLED: t.orderErrTakeawayDisabled,
        DELIVERY_DISABLED: t.orderErrDeliveryDisabled,
        DELIVERY_LOCATION_REQUIRED: t.orderErrLocationRequired,
        DELIVERY_ADDRESS_REQUIRED: t.orderErrAddressRequired,
        OUTSIDE_DELIVERY_ZONE: t.orderErrOutsideZone,
        MIN_ORDER_NOT_MET: t.orderErrMinimumOrder,
        ZONE_MIN_ORDER_NOT_MET: t.orderErrZoneMinimumOrder,
        SCHEDULE_TIME_REQUIRED: t.orderErrScheduleRequired,
        SCHEDULE_TIME_INVALID: t.orderErrScheduleInvalid,
        SCHEDULE_TIME_TOO_SOON: t.orderErrScheduleTooSoon,
      };
      return (code && byCode[code]) || fallback || t.orderErrGeneric;
    },
    [t]
  );

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      setNavTab('account');
      return;
    }
    if (favoriteProductIds.includes(productId)) {
      await supabase
        .from('customer_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));
      return;
    }
    await supabase.from('customer_favorites').insert({ user_id: user.id, product_id: productId });
    setFavoriteProductIds((prev) => [...prev, productId]);
  };

  useEffect(() => {
    if (!detailProduct) return;
    track('view_item', {
      product_id: detailProduct.id,
      product_name: detailProduct.name,
      value: Number(detailProduct.selling_price),
    });
  }, [detailProduct]);

  useEffect(() => {
    if (cartCount === 0) return;
    const timer = window.setTimeout(() => {
      track('abandoned_cart', { item_count: cartCount, value: grandTotal });
    }, 30 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [cartCount, grandTotal]);

  const handleSubmitOrder = async () => {
    if (!user) {
      setSubmitError(t.orderAuthRequired);
      return;
    }
    if (cart.length === 0) return;
    if (requiresCheckoutPhoneVerification) {
      setSubmitError(t.orderPhoneVerificationRequired);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const lines = cart.map((item) => {
        if (item.isCombo && item.comboId) {
          return {
            isCombo: true,
            comboId: item.comboId,
            quantity: item.quantity,
            notes: item.notes || undefined,
            comboSelections: [],
          };
        }
        return {
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
          modifierOptionIds: Object.values(item.selectedModifiers)
            .flat()
            .map((o) => o.id),
        };
      });

      const selectedAddressConfig = ORDER_ADDRESS_TYPE_CONFIG[deliveryAddressType];
      const body = {
        fulfillmentType: fulfillment,
        paymentMethod,
        cart: lines,
        promoCode: promoCode.trim() || undefined,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
        orderNotes: orderNotes.trim() || undefined,
        isScheduled,
        scheduledFor: isScheduled ? scheduledFor ?? undefined : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryApartment:
          fulfillment === 'delivery' && selectedAddressConfig.showApartmentUnit
            ? deliveryApartment.trim() || undefined
            : undefined,
        deliveryFloor:
          fulfillment === 'delivery' && selectedAddressConfig.showFloor ? deliveryFloor.trim() || undefined : undefined,
        deliveryNotes: fulfillment === 'delivery' ? buildCourierNotes() || undefined : undefined,
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
        setSubmitError(mapOrderError(res.code, res.error));
        setSubmitting(false);
        return;
      }

      const data = res.data;
      if (
        (data.nextStep === 'united-payment-create-payment' || data.nextStep === 'epoint-create-payment') &&
        isCardOnlinePaymentMethod(paymentMethod)
      ) {
        if (!data.paymentInitToken) {
          setSubmitError(t.orderPaymentReturnFailed);
          setSubmitting(false);
          return;
        }
        const pay = await invokeEdgeFunction<
          { saleId: string; paymentInitToken: string; language?: string; saveCard?: boolean; useWallet?: boolean },
          { checkoutUrl?: string }
        >(
          data.nextStep,
          {
            saleId: data.saleId,
            paymentInitToken: data.paymentInitToken,
            language,
            saveCard: saveCardForFuture,
            useWallet: payWithWallet,
          },
          accessToken
        );
        if (!pay.ok) {
          setSubmitError(pay.error ?? t.orderErrPaymentInitFailed);
          setSubmitting(false);
          return;
        }
        if (pay.data?.checkoutUrl) {
          window.location.href = pay.data.checkoutUrl;
          return;
        }
      }

      const confirmationLines: ConfirmationLine[] = cart.map((item) => {
        const modifierRows = Object.values(item.selectedModifiers).flat();
        const modTotal = modifierRows.reduce((sum, mod) => sum + Number(mod.price_adjustment ?? 0), 0);
        const lineTotal = (Number(item.product.selling_price) + modTotal) * item.quantity;
        const customizations = modifierRows.map((mod) => mod.name);
        return {
          name: item.product.name,
          quantity: item.quantity,
          lineTotal,
          customizations,
        };
      });

      const etaText =
        isScheduled && scheduledFor
          ? new Date(scheduledFor).toLocaleString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })
          : t.orderConfirmationEtaFallback;

      setConfirmationSnapshot({
        lines: confirmationLines,
        subtotal: cartTotal,
        total: grandTotal,
        fulfillment,
        etaText,
      });

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
            label: saveAddressLabel.trim() || (addresses.length === 0 ? 'Home' : 'Address'),
            line1: deliveryAddress.trim(),
            address_type: deliveryAddressType,
            building_name: selectedAddressConfig.showBuildingName ? deliveryBuildingName.trim() || undefined : undefined,
            entrance: selectedAddressConfig.showEntrance ? deliveryEntrance.trim() || undefined : undefined,
            apartment: selectedAddressConfig.showApartmentUnit ? deliveryApartment.trim() || undefined : undefined,
            floor: selectedAddressConfig.showFloor ? deliveryFloor.trim() || undefined : undefined,
            door_name_or_number: selectedAddressConfig.showDoorNameOrNumber
              ? deliveryDoorNameOrNumber.trim() || undefined
              : undefined,
            company_name: selectedAddressConfig.showCompanyName ? deliveryCompanyName.trim() || undefined : undefined,
            leave_at: selectedAddressConfig.showLeaveAt ? deliveryLeaveAt : undefined,
            access_method: selectedAddressConfig.showAccessMethod ? deliveryAccessMethod : undefined,
            intercom_name_or_number:
              selectedAddressConfig.showAccessMethod && deliveryAccessMethod === 'intercom'
                ? deliveryIntercomNameOrNumber.trim() || undefined
                : undefined,
            door_code:
              selectedAddressConfig.showAccessMethod && deliveryAccessMethod === 'door_code'
                ? deliveryDoorCode.trim() || undefined
                : undefined,
            access_other_instructions:
              selectedAddressConfig.showAccessMethod && deliveryAccessMethod === 'other'
                ? deliveryAccessOtherInstructions.trim() || undefined
                : undefined,
            courier_instructions: selectedAddressConfig.showCourierNotes ? deliveryNotes.trim() || undefined : undefined,
            lat,
            lng,
            is_default: addresses.length === 0,
          });
        }
      }

      setResult(data);
      setCart([]);
      track('purchase', {
        sale_id: data.saleId,
        total: grandTotal,
        fulfillment,
        payment_method: paymentMethod,
          save_card: saveCardForFuture,
          use_wallet: payWithWallet,
        promo_code: promoCode.trim() || null,
        tip_amount: tipAmount,
      });
      setFlow('done');
      void reloadOrders();
    } catch (e) {
      setSubmitError(mapOrderError(undefined, e instanceof Error ? e.message : t.orderErrGeneric));
    }
    setSubmitting(false);
  };

  const openCheckout = () => {
    track('begin_checkout', {
      item_count: cartCount,
      value: grandTotal,
      fulfillment,
    });
    setFlow('checkout');
  };

  const dismissSignInPrompt = () => {
    window.localStorage.setItem(ORDER_SIGNIN_PROMPT_DISMISS_KEY, '1');
    setShowSignInPrompt(false);
  };

  const handleReorder = useCallback(
    (order: (typeof orders)[number]) => {
      const saleItems = Array.isArray(order.sale_items) ? order.sale_items : [];
      if (saleItems.length === 0) return;
      const rebuilt: CartItem[] = [];
      for (const line of saleItems) {
        if (!line.product_id) continue;
        const product = products.find((p) => p.id === line.product_id);
        if (!product) continue;
        const qty = Math.max(1, Number(line.quantity ?? 1));
        const cartItemKey = generateCartItemKey(product.id, {});
        const existing = rebuilt.find((item) => item.cartItemKey === cartItemKey);
        if (existing) {
          existing.quantity += qty;
          continue;
        }
        rebuilt.push({
          product,
          quantity: qty,
          notes: line.notes ?? '',
          selectedModifiers: {},
          cartItemKey,
        });
      }
      if (rebuilt.length > 0) {
        setCart(rebuilt);
        setNavTab('cart');
        setFlow('browse');
      }
    },
    [products]
  );

  const accountPanelT = useMemo(
    () => ({
      orderSignIn: t.orderSignIn,
      orderNavAccount: t.orderNavAccount,
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
      orderForgotPassword: t.orderForgotPassword,
      orderForgotPasswordSent: t.orderForgotPasswordSent,
      orderSignUpInlinePrompt: t.orderSignUpInlinePrompt,
      orderSignUpInlineAction: t.orderSignUpInlineAction,
      orderEmailConfirmAfterSignup: t.orderEmailConfirmAfterSignup,
      orderResetPasswordTitle: t.orderResetPasswordTitle,
      orderResetPasswordHint: t.orderResetPasswordHint,
      orderResetPasswordNew: t.orderResetPasswordNew,
      orderResetPasswordConfirm: t.orderResetPasswordConfirm,
      orderResetPasswordSubmit: t.orderResetPasswordSubmit,
      orderResetPasswordSuccess: t.orderResetPasswordSuccess,
      orderResetPasswordMismatch: t.orderResetPasswordMismatch,
      orderSendSmsCode: t.orderSendSmsCode,
      orderSmsCode: t.orderSmsCode,
      orderVerifySms: t.orderVerifySms,
      orderSmsSentHint: t.orderSmsSentHint,
      orderSmsResend: t.orderSmsResend,
      orderSmsResendWait: t.orderSmsResendWait,
      orderChangePhone: t.orderChangePhone,
      orderInvalidPhone: t.orderInvalidPhone,
      orderAccountPhone: t.orderAccountPhone,
      orderMapSearchPlaceholder: t.orderMapSearchPlaceholder,
      orderMapPinHint: t.orderMapPinHint,
      orderMapLoading: t.orderMapLoading,
      orderMapUnavailable: t.orderMapUnavailable,
      orderDeliveryAddress: t.orderDeliveryAddress,
      orderReorder: t.orderReorder,
      orderProfileSection: t.orderProfileSection,
      orderAddressesSection: t.orderAddressesSection,
      orderOrdersSection: t.orderOrdersSection,
      orderAddressApartment: t.orderAddressApartment,
      orderAddressFloor: t.orderAddressFloor,
      orderAddressTypeTitle: t.orderAddressTypeTitle,
      orderAddressTypeApartment: t.orderAddressTypeApartment,
      orderAddressTypeHouse: t.orderAddressTypeHouse,
      orderAddressTypeOffice: t.orderAddressTypeOffice,
      orderAddressTypeHotel: t.orderAddressTypeHotel,
      orderAddressTypeOther: t.orderAddressTypeOther,
      orderAddressBuildingName: t.orderAddressBuildingName,
      orderAddressEntrance: t.orderAddressEntrance,
      orderAddressDoorNameOrNumber: t.orderAddressDoorNameOrNumber,
      orderAddressCompanyName: t.orderAddressCompanyName,
      orderAddressLeaveAt: t.orderAddressLeaveAt,
      orderAddressLeaveAtOffice: t.orderAddressLeaveAtOffice,
      orderAddressLeaveAtReception: t.orderAddressLeaveAtReception,
      orderAddressAccessMethod: t.orderAddressAccessMethod,
      orderAccessIntercom: t.orderAccessIntercom,
      orderAccessDoorCode: t.orderAccessDoorCode,
      orderAccessDoorOpen: t.orderAccessDoorOpen,
      orderAddressIntercomNameOrNumber: t.orderAddressIntercomNameOrNumber,
      orderAddressDoorCode: t.orderAddressDoorCode,
      orderAddressAccessOtherInstructions: t.orderAddressAccessOtherInstructions,
      orderDeliveryNotesLabel: t.orderDeliveryNotesLabel,
      orderDeliveryNotesPlaceholder: t.orderDeliveryNotesPlaceholder,
      orderAddressEdit: t.orderAddressEdit,
      orderAddressDelete: t.orderAddressDelete,
      orderAddressSetDefault: t.orderAddressSetDefault,
      orderAddressCancelEdit: t.orderAddressCancelEdit,
      orderAddressSaveChanges: t.orderAddressSaveChanges,
      orderAddressDeleteConfirm: t.orderAddressDeleteConfirm,
      orderAddressDefaultBadge: t.orderAddressDefaultBadge,
      orderAddressHomeLabel: t.orderAddressHomeLabel,
      orderOrderDate: t.orderOrderDate,
      orderFulfillmentLabel: t.orderFulfillmentLabel,
      orderFulfillmentDelivery: t.orderFulfillmentDelivery,
      orderFulfillmentTakeaway: t.orderFulfillmentTakeaway,
      orderTrackOrder: t.orderTrackOrder,
      orderViewDetails: t.orderViewDetails,
      orderHideDetails: t.orderHideDetails,
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
      orderCustomizeItem: t.orderComboCustomize,
      orderChooseOptions: t.orderChooseOptions,
      orderSearchNoResults: t.orderSearchNoResults,
      orderCategoryEmpty: t.orderCategoryEmpty,
      halalBadge: t.halal,
      favoriteAdd: t.orderFavoriteAdd,
      favoriteRemove: t.orderFavoriteRemove,
      menuLabel: t.orderNavMenu,
      categoriesLabel: t.categories,
      clearSearch: t.clear,
      itemCountSingle: t.orderDishSingle,
      itemCountPlural: t.orderDishPlural,
      orderProductNoPhotoCaption: t.orderProductNoPhotoCaption,
    }),
    [t]
  );

  const cartLabels = useMemo(
    () => ({
      title: t.orderYourCart,
      empty: t.emptyCart,
      emptyAction: t.backToMenu,
      subtotal: t.orderSubtotal,
      deliveryFee: t.orderDeliveryFeeRow,
      total: t.orderTotal,
      continueCheckout: t.orderCheckout,
      authRequired: t.orderAuthInlineHint,
      itemNotes: t.orderItemNotes,
      itemNotesPlaceholder: t.orderItemNotesPlaceholder,
      removeLine: t.orderRemoveLine,
      decreaseQty: t.orderDecreaseQty,
      increaseQty: t.orderIncreaseQty,
      itemsCountLabel: t.items,
    }),
    [t]
  );

  const submitBlockers = useMemo(() => {
    const blockers: string[] = [];
    if (!user) blockers.push(t.orderAuthRequired);
    if (showProfileCompletion) blockers.push(t.orderProfileCompletionPending);
    if (cart.length === 0) blockers.push(t.orderErrCartEmpty);
    if (customerPhone.trim().length === 0) blockers.push(t.orderErrPhoneRequired);
    if (requiresCheckoutPhoneVerification) blockers.push(t.orderPhoneVerificationRequired);
    if (isScheduled && !scheduledFor) blockers.push(t.orderErrScheduleRequired);
    if (fulfillment === 'delivery' && !serverAllowsDelivery) blockers.push(t.orderDeliveryDisabledInSettings);
    if (fulfillment === 'delivery' && !deliveryAddress.trim()) blockers.push(t.orderErrAddressRequired);
    if (fulfillment === 'delivery' && deliveryAddress.trim() && !zoneMatch) {
      blockers.push(t.orderSubmitDisabledOutsideZone);
    }
    return blockers;
  }, [
    user,
    showProfileCompletion,
    cart.length,
    customerPhone,
    requiresCheckoutPhoneVerification,
    isScheduled,
    scheduledFor,
    fulfillment,
    serverAllowsDelivery,
    deliveryAddress,
    zoneMatch,
    t,
  ]);

  const canSubmit = !submitting && submitBlockers.length === 0;

  const checkoutLabels = useMemo(
    () => ({
      back: t.back,
      checkout: t.orderCheckout,
      contact: t.orderStepContact,
      stepFulfillment: t.orderStepFulfillment,
      stepAddress: t.orderStepAddress,
      stepTiming: t.orderStepTiming,
      stepPayment: t.orderStepPayment,
      stepReview: t.orderStepReview,
      optional: t.optional,
      phone: t.orderPhone,
      email: t.orderEmail,
      nameOptional: t.orderNameOptional,
      pickupOrDelivery: t.orderChooseFulfillmentTitle,
      takeaway: t.orderFulfillmentTakeaway,
      delivery: t.orderFulfillmentDelivery,
      deliveryAddress: t.orderDeliveryAddress,
      selectSaved: t.orderSelectSavedAddress,
      addressDismiss: t.orderAddressClearSelection,
      useLocation: t.orderUseLocation,
      outsideZone: t.orderOutsideZone,
      inZonePrefix: t.orderInZonePrefix,
      deliveryFeeLabel: t.orderDeliveryFeeRow,
      subtotal: t.orderSubtotal,
      total: t.orderTotal,
      payment: t.orderPayment,
      payCod: fulfillment === 'delivery' ? t.orderPayCashUnifiedDelivery : t.orderPayCashUnifiedTakeaway,
      payCash: t.orderPayCash,
      payEpoint: t.orderPayEpoint,
      payCardWithWallet: t.orderPayCardWithWallet,
      saveCardForFuture: t.orderSaveCardForFuture,
      savedCardsAvailable: t.orderSavedCardsAvailable,
      placeOrder: t.placeOrder,
      takeawayDisabled: t.orderFulfillmentTakeawayDisabled,
      onlineDisabled: t.orderOnlineDisabled,
      deliveryDisabledHint: t.orderDeliveryDisabledInSettings,
      saveAddressForNext: t.orderSaveAddressForNext,
      saveAddressLabel: t.orderAddressLabel,
      saveAddressSignInHint: t.orderAuthInlineHint,
      mapSearch: t.orderMapSearchPlaceholder,
      mapPinHint: t.orderMapPinHint,
      mapLoading: t.orderMapLoading,
      mapUnavailable: t.orderMapUnavailable,
      apartmentUnit: t.orderAddressApartment,
      floor: t.orderAddressFloor,
      addressTypeTitle: t.orderAddressTypeTitle,
      addressTypeApartment: t.orderAddressTypeApartment,
      addressTypeHouse: t.orderAddressTypeHouse,
      addressTypeOffice: t.orderAddressTypeOffice,
      addressTypeHotel: t.orderAddressTypeHotel,
      addressTypeOther: t.orderAddressTypeOther,
      buildingName: t.orderAddressBuildingName,
      entrance: t.orderAddressEntrance,
      doorNameOrNumber: t.orderAddressDoorNameOrNumber,
      companyName: t.orderAddressCompanyName,
      leaveAt: t.orderAddressLeaveAt,
      leaveAtOffice: t.orderAddressLeaveAtOffice,
      leaveAtReception: t.orderAddressLeaveAtReception,
      accessMethod: t.orderAddressAccessMethod,
      accessIntercom: t.orderAccessIntercom,
      accessDoorCode: t.orderAccessDoorCode,
      accessDoorOpen: t.orderAccessDoorOpen,
      accessOther: t.orderAddressTypeOther,
      intercomNameOrNumber: t.orderAddressIntercomNameOrNumber,
      doorCode: t.orderAddressDoorCode,
      accessOtherInstructions: t.orderAddressAccessOtherInstructions,
      deliveryNotesLabel: t.orderDeliveryNotesLabel,
      deliveryNotesPlaceholder: t.orderDeliveryNotesPlaceholder,
      authRequired: t.orderAuthRequired,
      authGoogle: t.orderAuthGoogle,
      authSms: t.orderAuthSms,
      authTitle: t.orderCheckoutAuthTitle,
      authHelper: t.orderCheckoutAuthHelper,
      authGooglePhoneNext: t.orderCheckoutAuthGooglePhoneNext,
      authSmsCta: t.orderCheckoutAuthSmsCta,
      scheduleNow: t.orderScheduleNow,
      scheduleLater: t.orderScheduleLater,
      scheduleFor: t.orderScheduleFor,
      scheduleDay: t.orderScheduleDay,
      scheduleTime: t.orderScheduleTime,
      today: t.today,
      tomorrow: t.tomorrow,
      scheduleNoSlots: t.orderScheduleNoSlots,
      promoCode: t.orderPromoCode,
      tip: t.orderTip,
      orderNotes: t.orderOrderNotes,
      terms: t.orderTerms,
      privacy: t.orderPrivacy,
      refundPolicy: t.orderRefundPolicy,
      retry: t.retry,
      summaryTitle: t.orderSummaryTitle,
      fulfillmentTakeawayHint: t.orderFulfillmentTakeawayHint,
      fulfillmentDeliveryHint: t.orderFulfillmentDeliveryHint,
      paymentCodHint:
        fulfillment === 'delivery'
          ? t.orderPaymentCashUnifiedHintDelivery
          : t.orderPaymentCashUnifiedHintTakeaway,
      paymentCashHint: t.orderPaymentCashHint,
      paymentEpointHint: t.orderPaymentEpointHint,
      paymentExtras: t.orderPaymentExtras,
      promoPlaceholder: t.orderPromoPlaceholder,
      reviewHint: t.orderReviewHint,
      reviewFulfillment: t.orderReviewFulfillment,
      reviewTiming: t.orderReviewTiming,
      reviewContact: t.orderReviewContact,
      reviewPayment: t.orderReviewPayment,
      reviewAddress: t.orderReviewAddress,
      reviewAsap: t.orderReviewAsap,
      reviewMissing: t.orderReviewMissing,
      contactSignedIn: t.orderContactSignedIn,
      contactGuestHint: t.orderContactGuestHint,
      contactVerifyHint: t.orderContactVerifyHint,
      contactSendCode: t.orderSendSmsCode,
      contactCode: t.orderSmsCode,
      contactVerify: t.orderVerifySms,
      contactChangePhone: t.orderChangePhone,
      contactAuthErrorFallback: t.orderAuthErrorFallback,
      contactOr: t.orderOr,
      smsSentHint: t.orderSmsSentHint,
      smsResend: t.orderSmsResend,
      smsResendWait: t.orderSmsResendWait,
      phoneFormatHint: t.orderInvalidPhone,
      legalPassivePrefix: t.orderLegalPassivePrefix,
      profileCompletionPending: t.orderProfileCompletionPending,
      phoneVerificationRequired: t.orderPhoneVerificationRequired,
    }),
    [t, fulfillment]
  );

  if (authLoading || loading) {
    return (
      <div className="ming-shell min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4 animate-pulse">
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-28 rounded-2xl bg-white/5" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-28 rounded-2xl bg-white/5" />
            <div className="h-28 rounded-2xl bg-white/5" />
            <div className="h-28 rounded-2xl bg-white/5" />
            <div className="h-28 rounded-2xl bg-white/5" />
          </div>
          <p className="text-sm text-ming-ash">{t.orderLoadingMenu}</p>
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
          snapshot={confirmationSnapshot}
          labels={{
            title: t.orderPlacedTitle,
            subtitle: t.orderPlacedSubtitle,
            trackHint: t.orderTrackHint,
            openTracking: t.orderOpenTracking,
            copyTracking: t.orderCopyTrackingLink,
            copiedTracking: t.orderCopyTrackingDone,
            orderNumber: t.orderConfirmationOrderNumber,
            summaryTitle: t.orderConfirmationSummaryTitle,
            subtotal: t.orderSubtotal,
            total: t.orderTotal,
            fulfillment: t.orderReviewFulfillment,
            eta: t.orderConfirmationEtaLabel,
            fulfillmentTakeaway: t.orderFulfillmentTakeaway,
            fulfillmentDelivery: t.orderFulfillmentDelivery,
          }}
        />
      </div>
    );
  }

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
      onUpdateNotes={updateNotes}
      onRemoveLine={removeLine}
      onCheckout={openCheckout}
      userLoggedIn={!!user}
      onBackToMenu={() => setNavTab('menu')}
      labels={cartLabels}
      variant="panel"
    />
  );

  const takeawayOnlyNotice = showTakeaway && !showDelivery;

  return (
    <div className="ming-shell ming-noise flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]">
      {!cookieConsent ? (
        <>
          {/* Mobile: in-flow at top so bottom nav, sticky cart, and checkout CTAs stay tappable */}
          <div
            role="region"
            aria-label={t.cookieConsentCopy}
            className="shrink-0 border-b border-white/10 bg-ming-charcoal/95 px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs text-ming-ash shadow-sm lg:hidden"
          >
            <p>
              {t.cookieConsentCopy}{' '}
              <a href="/privacy" className="ming-btn-link inline px-0 py-0 text-xs">
                {t.orderPrivacy}
              </a>
              .
            </p>
            <button type="button" className="ming-btn-primary mt-2 w-full py-2 text-[11px]" onClick={acceptCookieConsent}>
              {t.cookieConsentAccept}
            </button>
          </div>
          {/* Desktop: compact corner card */}
          <div className="pointer-events-auto fixed bottom-4 right-4 z-[60] hidden max-w-sm rounded-xl border border-white/10 bg-ming-charcoal/95 p-3 text-xs text-ming-ash shadow-ming lg:block">
            <p>
              {t.cookieConsentCopy}{' '}
              <a href="/privacy" className="ming-btn-link inline px-0 py-0 text-xs">
                {t.orderPrivacy}
              </a>
              .
            </p>
            <button type="button" className="ming-btn-primary mt-2 w-full py-2 text-[11px]" onClick={acceptCookieConsent}>
              {t.cookieConsentAccept}
            </button>
          </div>
        </>
      ) : null}

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

          {takeawayOnlyNotice ? (
            <div
              role="status"
              className="border-b border-ming-gold/20 bg-ming-gold/10 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-ming-bone sm:text-sm"
            >
              {t.orderTakeawayOnlyNotice}
            </div>
          ) : null}

          {paymentBanner}

          {showSignInPrompt ? (
            <div className="mx-auto w-full max-w-5xl px-3 sm:px-6">
              <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div>
                  <p className="text-sm font-semibold text-ming-bone">{t.orderSignInPromptTitle}</p>
                  <p className="mt-1 text-xs text-ming-ash">{t.orderSignInPromptSubtitle}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="ming-btn-primary px-3 py-2 text-xs"
                      onClick={() => void signInWithGoogle('/order')}
                    >
                      {t.orderAuthGoogle}
                    </button>
                    <button
                      type="button"
                      className="ming-btn-ghost px-3 py-2 text-xs"
                      onClick={() => {
                        setNavTab('account');
                        setShowSignInPrompt(false);
                      }}
                    >
                      {t.orderAuthSms}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t.close}
                  className="rounded-lg p-1 text-ming-ash hover:bg-white/10"
                  onClick={dismissSignInPrompt}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

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
                favoriteProductIds={favoriteProductIds}
                onToggleFavorite={(productId) => void toggleFavorite(productId)}
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
              onUpdateNotes={updateNotes}
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
              forgotPassword={forgotPassword}
              signOut={signOut}
              profile={profile}
              addresses={addresses}
              dataLoading={dataLoading}
              onSaveProfile={saveProfile}
              onSaveAddress={saveAddress}
              onDeleteAddress={deleteAddress}
              orders={orders}
              ordersLoading={ordersLoading}
              onReloadOrders={reloadOrders}
              onReorder={handleReorder}
              loyaltyEnabled={Boolean(settings?.loyalty_enabled)}
              loyaltyRewardEveryOrders={Number(settings?.loyalty_reward_every_orders ?? 10)}
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              t={accountPanelT}
            />
          )}
        </>
      )}

      {flow === 'checkout' && (
        <>
          {takeawayOnlyNotice ? (
            <div
              role="status"
              className="border-b border-ming-gold/20 bg-ming-gold/10 px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-ming-bone sm:text-sm"
            >
              {t.orderTakeawayOnlyNotice}
            </div>
          ) : null}
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
          sendPhoneOtp={sendPhoneOtp}
          verifyPhoneOtp={verifyPhoneOtp}
          signInWithGoogle={signInWithGoogle}
          requirePhoneVerification={requiresCheckoutPhoneVerification}
          onPhoneVerified={async (normalizedPhone) => {
            await saveProfile({
              phone: normalizedPhone,
              phone_verified_at: new Date().toISOString(),
            });
            setCustomerPhone(normalizedPhone);
          }}
          savedAddresses={addresses}
          selectedSavedAddressId={selectedSavedAddressId}
          onSelectSavedAddressId={setSelectedSavedAddressId}
          saveAddressForNext={saveAddressForNext}
          onSaveAddressForNextChange={setSaveAddressForNext}
          saveAddressLabel={saveAddressLabel}
          onSaveAddressLabelChange={setSaveAddressLabel}
          deliveryAddress={deliveryAddress}
          deliveryApartment={deliveryApartment}
          deliveryFloor={deliveryFloor}
          lat={lat}
          lng={lng}
          onLocationChange={({ lat: nextLat, lng: nextLng, address: nextAddr }) => {
            setLat(nextLat);
            setLng(nextLng);
            setDeliveryAddress(nextAddr);
          }}
          onAddressChange={setDeliveryAddress}
          deliveryAddressType={deliveryAddressType}
          onDeliveryAddressTypeChange={setDeliveryAddressType}
          deliveryBuildingName={deliveryBuildingName}
          onDeliveryBuildingNameChange={setDeliveryBuildingName}
          deliveryEntrance={deliveryEntrance}
          onDeliveryEntranceChange={setDeliveryEntrance}
          onDeliveryApartmentChange={setDeliveryApartment}
          onDeliveryFloorChange={setDeliveryFloor}
          deliveryDoorNameOrNumber={deliveryDoorNameOrNumber}
          onDeliveryDoorNameOrNumberChange={setDeliveryDoorNameOrNumber}
          deliveryCompanyName={deliveryCompanyName}
          onDeliveryCompanyNameChange={setDeliveryCompanyName}
          deliveryLeaveAt={deliveryLeaveAt}
          onDeliveryLeaveAtChange={setDeliveryLeaveAt}
          deliveryAccessMethod={deliveryAccessMethod}
          onDeliveryAccessMethodChange={setDeliveryAccessMethod}
          deliveryIntercomNameOrNumber={deliveryIntercomNameOrNumber}
          onDeliveryIntercomNameOrNumberChange={setDeliveryIntercomNameOrNumber}
          deliveryDoorCode={deliveryDoorCode}
          onDeliveryDoorCodeChange={setDeliveryDoorCode}
          deliveryAccessOtherInstructions={deliveryAccessOtherInstructions}
          onDeliveryAccessOtherInstructionsChange={setDeliveryAccessOtherInstructions}
          deliveryNotes={deliveryNotes}
          onDeliveryNotesChange={setDeliveryNotes}
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          onUseLocation={handleLocate}
          geoStatus={geoStatus}
          zoneMatch={zoneMatch}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          saveCardForFuture={saveCardForFuture}
          onSaveCardForFutureChange={setSaveCardForFuture}
          payWithWallet={payWithWallet}
          onPayWithWalletChange={setPayWithWallet}
          savedCardsCount={savedCards.length}
          isScheduled={isScheduled}
          scheduledFor={scheduledFor}
          availableScheduleSlots={availableScheduleSlots}
          onScheduledChange={(v) => {
            setIsScheduled(v);
            if (!v) setScheduledFor(null);
          }}
          onScheduledForChange={setScheduledFor}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          tipAmount={tipAmount}
          onTipAmountChange={setTipAmount}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          cartTotal={cartTotal}
          deliveryFee={deliveryFee}
          grandTotal={grandTotal}
          submitting={submitting}
          submitError={submitError}
          submitBlockers={submitBlockers}
          canSubmit={canSubmit}
          onSubmit={() => void handleSubmitOrder()}
          onBack={() => setFlow('browse')}
          labels={checkoutLabels}
        />
        </>
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
          <Price amount={grandTotal} className="ming-mono text-base font-bold text-white" />
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

      <div className="sr-only" aria-live="polite">
        {t.orderNavCart}: {cartCount}
      </div>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onAddToCart={addToCartWithModifiers}
          onClose={() => setDetailProduct(null)}
          theme="order"
        />
      )}
      {upsellPromptProduct ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ming-ink/80 backdrop-blur-[2px]"
            onClick={() => setUpsellPromptProduct(null)}
            aria-label={t.cancel}
          />
          <div className="ming-card-raised relative w-full max-w-md p-5">
            <p className="ming-eyebrow">{t.orderUpsellTitle}</p>
            <p className="mt-2 text-sm text-ming-bone">
              {t.orderUpsellMakeItComboNamed
                .replace('{name}', upsellPromptProduct.name)
                .replace('{price}', '0')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="ming-btn-primary py-3"
                onClick={async () => {
                  const product = upsellPromptProduct;
                  setUpsellPromptProduct(null);
                  const added = await addUpsellCombo(product);
                  if (added) return;
                  const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
                  if (hasModifiers) setDetailProduct(product);
                  else addToCartWithModifiers(product, {});
                }}
              >
                {t.orderUpsellYes}
              </button>
              <button
                type="button"
                className="ming-btn-ghost py-3"
                onClick={() => {
                  const product = upsellPromptProduct;
                  setUpsellPromptProduct(null);
                  const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
                  if (hasModifiers) setDetailProduct(product);
                  else addToCartWithModifiers(product, {});
                }}
              >
                {t.orderUpsellNo}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showProfileCompletion && user ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ming-ink/80 backdrop-blur-[2px]"
            aria-label={t.close}
            onClick={() => {
              // Keep completion required for first-time users; backdrop is non-dismiss action.
            }}
          />
          <div className="ming-card-raised relative z-10 w-full max-w-lg p-5">
            <p className="ming-eyebrow">{t.orderProfileCompletionTitle}</p>
            <h3 className="mt-1 text-lg font-semibold text-ming-bone">{t.orderProfileCompletionSubtitle}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="ming-input"
                placeholder={t.orderProfileFirstName}
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
              />
              <input
                className="ming-input"
                placeholder={t.orderProfileLastName}
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <input
                className="ming-input"
                placeholder={t.orderProfilePhoneOptional}
                value={profilePhoneInput}
                onChange={(e) => setProfilePhoneInput(e.target.value)}
                autoComplete="tel"
              />
              <p className="mt-1 text-xs text-ming-ash">{t.orderProfilePhoneOptionalHint}</p>
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs text-ming-ash">
              <span className="mt-0.5">
                <OrderCheckbox
                checked={profileTermsAccepted}
                ariaLabel={t.orderConsentLabel}
                onChange={setProfileTermsAccepted}
                />
              </span>
              <span>
                {t.orderConsentLabel}{' '}
                <a href="/terms" className="ming-btn-link inline px-0 py-0">
                  {t.orderTerms}
                </a>
                ,{' '}
                <a href="/privacy" className="ming-btn-link inline px-0 py-0">
                  {t.orderPrivacy}
                </a>
                ,{' '}
                <a href="/refund" className="ming-btn-link inline px-0 py-0">
                  {t.orderRefundPolicy}
                </a>
                .
              </span>
            </label>
            {profileCompletionError ? (
              <p className="mt-2 rounded-lg border border-ming-red/40 bg-ming-red/10 px-3 py-2 text-xs text-ming-red">
                {profileCompletionError}
              </p>
            ) : null}
            <button
              type="button"
              className="ming-btn-primary mt-4 w-full"
              disabled={profileCompletionBusy}
              onClick={() => void handleCompleteProfile()}
            >
              {profileCompletionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.orderProfileCompletionSave}
            </button>
          </div>
        </div>
      ) : null}
      <Analytics />
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
