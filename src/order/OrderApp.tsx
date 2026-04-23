import { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, ShoppingBag, XCircle, X } from 'lucide-react';
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
import {
  expireOnlineKitchenPauseIfDue,
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
import {
  acceptingKitchen,
  getKitchenStatus,
  getSessionEndBaku,
  scheduleSlots,
  type KitchenSettings,
} from '../lib/kitchenAcceptance';

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
/** Epoint redirect recovery — canonical key (plan: `mings_pending_order_v1`). */
const ORDER_PAYMENT_PENDING_KEY = 'mings_pending_order_v1';
const LEGACY_ORDER_PAYMENT_PENDING_KEY = 'mings-order-payment-pending-v1';

function clearPendingOrderPaymentKeys() {
  window.localStorage.removeItem(ORDER_PAYMENT_PENDING_KEY);
  window.localStorage.removeItem(LEGACY_ORDER_PAYMENT_PENDING_KEY);
}

/** Read pending sale id; migrates legacy storage key to canonical. */
function readPendingOrderPaymentSaleId(): string | null {
  const tryParse = (key: string): string | null => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      const pending = JSON.parse(raw) as { saleId?: string };
      if (!pending?.saleId) return null;
      if (key === LEGACY_ORDER_PAYMENT_PENDING_KEY) {
        window.localStorage.setItem(ORDER_PAYMENT_PENDING_KEY, raw);
        window.localStorage.removeItem(LEGACY_ORDER_PAYMENT_PENDING_KEY);
      }
      return pending.saleId;
    } catch {
      window.localStorage.removeItem(key);
      return null;
    }
  };
  return tryParse(ORDER_PAYMENT_PENDING_KEY) ?? tryParse(LEGACY_ORDER_PAYMENT_PENDING_KEY);
}

/** True when every required combo group has at least one linked product (online upsell path). */
async function comboDealUpsellIsSatisfiable(comboId: string): Promise<boolean> {
  const { data: combo } = await supabase
    .from('combo_deals')
    .select(
      'id, combo_groups(id, name, required, sort_order, combo_group_items(id, menu_item_id, products(id, name, selling_price)))'
    )
    .eq('id', comboId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!combo) return false;
  const comboGroups = ((combo as { combo_groups?: unknown[] }).combo_groups ?? []) as Array<{
    id: string;
    name: string;
    required?: boolean;
    combo_group_items?: Array<{ menu_item_id: string; products?: { id: string; name: string } | null }>;
  }>;
  const comboSelections = comboGroups
    .map((group) => {
      const firstValid = (group.combo_group_items ?? []).find((row) => row.products?.id);
      if (!firstValid) {
        if (group.required !== false) return null;
        return undefined;
      }
      return { groupId: group.id };
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (comboGroups.some((group) => group.required !== false) && comboSelections.length === 0) {
    return false;
  }
  return true;
}

interface StoredOrderCartState {
  cart: CartItem[];
  fulfillment: OnlineFulfillmentType;
  selectedSavedAddressId: string | null;
}

interface SavedCardRow {
  id: string;
  card_mask: string | null;
  card_brand: string | null;
}

function formatBakuTimeShort(isoOrDate: string | Date, localeCode: string): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(localeCode, {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function formatBakuWeekdayTime(isoOrDate: string | Date, localeCode: string): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(localeCode, {
    timeZone: 'Asia/Baku',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function OrderContent() {
  const { t, language, setLanguage } = useLanguage();
  const localeCode = language === 'az' ? 'az-AZ' : language === 'ru' ? 'ru-RU' : 'en-GB';
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
  const { profile, addresses, loading: dataLoading, saveProfile, saveAddress } = useCustomerData(
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
  const [kitchenTick, setKitchenTick] = useState(0);
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fulfillment, setFulfillment] = useState<OnlineFulfillmentType>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<OnlinePaymentMethod>('cod');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveAddressForNext, setSaveAddressForNext] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCardRow[]>([]);

  const [result, setResult] = useState<OnlineOrderCreateResponse | null>(null);
  const [paymentReturn, setPaymentReturn] = useState<'success' | 'error' | null>(null);
  const [paymentReturnDetail, setPaymentReturnDetail] = useState<string | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [upsellPromptProduct, setUpsellPromptProduct] = useState<Product | null>(null);
  const [cookieConsent, setCookieConsent] = useState<boolean>(() => {
    const raw = window.localStorage.getItem(ORDER_COOKIE_CONSENT_KEY);
    return raw === 'accepted';
  });

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
      await expireOnlineKitchenPauseIfDue(supabase);
      const [s, z] = await Promise.all([
        supabase.from('online_settings').select('*').limit(1).maybeSingle(),
        supabase.from('delivery_zones').select('*').eq('is_active', true),
      ]);
      if (s.data) setSettings(s.data as OnlineSettingsRow);
      if (z.data) setZones(z.data as DeliveryZoneRow[]);
    })();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setKitchenTick((x) => x + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (kitchenTick === 0) return;
    void (async () => {
      await expireOnlineKitchenPauseIfDue(supabase);
      const { data } = await supabase.from('online_settings').select('*').limit(1).maybeSingle();
      if (data) setSettings(data as OnlineSettingsRow);
    })();
  }, [kitchenTick]);

  useEffect(() => {
    const channel = supabase
      .channel('order-online-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'online_settings' },
        (payload) => {
          const row = payload.new as OnlineSettingsRow | null;
          if (row && typeof row === 'object' && 'id' in row) {
            setSettings(row);
            return;
          }
          void (async () => {
            const { data } = await supabase.from('online_settings').select('*').limit(1).maybeSingle();
            if (data) setSettings(data as OnlineSettingsRow);
          })();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid');
    const paymentErr = params.get('payment_error');
    if (paid === '1') {
      setPaymentReturn('success');
      setPaymentReturnDetail(null);
      clearPendingOrderPaymentKeys();
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
      clearPendingOrderPaymentKeys();
      params.delete('payment_error');
      params.delete('sale');
      params.delete('message');
      const qs = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
  }, [reloadOrders]);

  useEffect(() => {
    const pendingSaleId = readPendingOrderPaymentSaleId();
    if (!pendingSaleId || paymentReturn) {
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('sales')
        .select('id, payment_status, track_token, display_number, total_price, delivery_fee, online_payment_method')
        .eq('id', pendingSaleId)
        .maybeSingle();
      if (!data) return;
      const paymentStatus = String((data as { payment_status?: string }).payment_status ?? '');
      if (paymentStatus === 'paid') {
        const sale = data as {
          id: string;
          track_token?: string | null;
          display_number?: string | null;
          total_price?: number | null;
          delivery_fee?: number | null;
          online_payment_method?: string | null;
        };
        if (!sale.track_token) return;
        setResult({
          saleId: sale.id,
          trackToken: sale.track_token,
          displayNumber: sale.display_number ?? sale.id,
          total: Number(sale.total_price ?? 0),
          deliveryFee: Number(sale.delivery_fee ?? 0),
          paymentMethod: (sale.online_payment_method as OnlinePaymentMethod) ?? 'epoint',
          nextStep: 'track',
        });
        setFlow('done');
        setPaymentReturn('success');
        setPaymentReturnDetail(null);
        setCart([]);
        clearPendingOrderPaymentKeys();
        return;
      }
      if (paymentStatus === 'failed') {
        setPaymentReturn('error');
        setPaymentReturnDetail(t.orderPaymentReturnFailed);
        clearPendingOrderPaymentKeys();
      }
    })();
  }, [paymentReturn, t]);

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
    };
    window.localStorage.setItem(ORDER_CART_STORAGE_KEY, JSON.stringify(payload));
  }, [cart, fulfillment, selectedSavedAddressId, cartStorageReady]);

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

  const availableScheduleSlots = useMemo(() => {
    void kitchenTick;
    if (!settings) return [];
    const now = new Date();
    const lead = Number(settings.scheduled_lead_minutes ?? settings.default_prep_time_minutes ?? 45);
    const slotMinutes = Math.max(5, Number(settings.scheduled_slot_minutes ?? 15));
    const dates = scheduleSlots(settings as KitchenSettings, now, {
      slotMinutes,
      leadMinutes: lead,
      maxSlots: 240,
    });
    return dates.map((d) => d.toISOString());
  }, [settings, kitchenTick]);

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

  const kitchenImmediateStatus = useMemo(() => {
    if (!settings) {
      return { status: 'OPEN' as const, nextOpenAt: undefined as Date | undefined, minutesToClose: undefined as number | undefined };
    }
    void kitchenTick;
    return getKitchenStatus(settings as KitchenSettings, new Date(), { orderMode: 'immediate' });
  }, [settings, kitchenTick]);

  const scheduleFallbackActive =
    cart.length > 0 &&
    (kitchenImmediateStatus.status === 'PAUSED' || kitchenImmediateStatus.status === 'CLOSED') &&
    availableScheduleSlots.length > 0;

  const sessionEndForClosingSoon = useMemo(() => {
    void kitchenTick;
    if (!settings) return null;
    return getSessionEndBaku(new Date(), settings.hours_json as Record<string, unknown> | undefined);
  }, [settings, kitchenTick]);

  const closingSoonCheckoutNote = useMemo(() => {
    if (flow !== 'checkout' || !settings || kitchenImmediateStatus.status !== 'CLOSING_SOON' || !sessionEndForClosingSoon) {
      return null;
    }
    return t.closingSoonCheckoutNote.replace('{time}', formatBakuTimeShort(sessionEndForClosingSoon, localeCode));
  }, [flow, settings, kitchenImmediateStatus.status, sessionEndForClosingSoon, t, localeCode]);

  const orderWhen = useMemo(() => {
    void kitchenTick;
    if (isScheduled && scheduledFor) {
      const d = new Date(scheduledFor);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  }, [isScheduled, scheduledFor, kitchenTick]);

  const canSubmit =
    !submitting &&
    !!user &&
    cart.length > 0 &&
    customerPhone.trim().length > 0 &&
    consentAccepted &&
    (!isScheduled || !!scheduledFor) &&
    !(fulfillment === 'delivery' && !serverAllowsDelivery) &&
    !(fulfillment === 'delivery' && (!zoneMatch || !deliveryAddress.trim())) &&
    !!settings &&
    acceptingKitchen(
      settings as KitchenSettings,
      orderWhen,
      isScheduled ? 'scheduled' : 'immediate',
    );

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
      .eq('is_deleted', false)
      .maybeSingle();
    if (!combo) return false;
    const comboGroups = ((combo as { combo_groups?: unknown[] }).combo_groups ?? []) as Array<{
      id: string;
      name: string;
      required?: boolean;
      combo_group_items?: Array<{ menu_item_id: string; products?: { id: string; name: string } | null }>;
    }>;
    const comboSelections = comboGroups
      .map((group) => {
        const firstValid = (group.combo_group_items ?? []).find((row) => row.products?.id);
        if (!firstValid) {
          if (group.required !== false) return null;
          return undefined;
        }
        return {
          groupId: group.id,
          groupName: group.name,
          item: {
            id: firstValid.products!.id,
            name: firstValid.products!.name,
          } as Product,
          priceAdjustment: 0,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (comboGroups.some((group) => group.required !== false) && comboSelections.length === 0) {
      return false;
    }

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
        comboSelections,
      },
    ]);
    return true;
  }, []);

  const addSimple = async (product: Product) => {
    if (product.combo_upsell_eligible && product.upsell_combo_id) {
      if (await comboDealUpsellIsSatisfiable(product.upsell_combo_id)) {
        setUpsellPromptProduct(product);
        return;
      }
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

  const mapOrderError = useCallback(
    (code?: string, fallback?: string) => {
      const byCode: Record<string, string> = {
        AUTH_REQUIRED: t.orderErrAuthRequired,
        CART_EMPTY: t.orderErrCartEmpty,
        INVALID_QUANTITY: t.orderErrInvalidQuantity,
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
        KITCHEN_CLOSED: t.orderErrKitchenClosed,
        KITCHEN_PAUSED: t.orderErrKitchenPaused,
        SCHEDULE_WHILE_PAUSED: t.orderErrScheduleWhilePaused,
        SCHEDULE_OUTSIDE_HOURS: t.orderErrScheduleOutsideHours,
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
      setFlow('browse');
      setNavTab('account');
      return;
    }
    if (cart.length === 0) return;
    if (!consentAccepted) {
      setSubmitError(t.orderConsentRequired);
      return;
    }
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setSubmitError(t.orderErrInvalidEmail);
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
            comboSelections: (item.comboSelections ?? []).map((selection) => ({
              groupId: selection.groupId,
              itemId: selection.item.id,
              modifierOptionIds: [],
            })),
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
          window.localStorage.setItem(
            ORDER_PAYMENT_PENDING_KEY,
            JSON.stringify({
              saleId: data.saleId,
            })
          );
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
            label: addresses.length === 0 ? t.home : t.orderAddressLabel,
            line1: deliveryAddress.trim(),
            lat,
            lng,
            is_default: addresses.length === 0,
          });
        }
      }

      setResult(data);
      setCart([]);
      clearPendingOrderPaymentKeys();
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
    if (!user) {
      setNavTab('account');
      return;
    }
    if (settings) {
      const st = getKitchenStatus(settings as KitchenSettings, new Date(), { orderMode: 'immediate' }).status;
      if ((st === 'PAUSED' || st === 'CLOSED') && availableScheduleSlots.length > 0) {
        setIsScheduled(true);
        setScheduledFor(availableScheduleSlots[0] ?? null);
      }
    }
    track('begin_checkout', {
      item_count: cartCount,
      value: grandTotal,
      fulfillment,
    });
    setFlow('checkout');
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
      orderSmsCodeExpiredHint: t.orderSmsCodeExpiredHint,
      orderSmsEnterCodeHint: t.orderSmsEnterCodeHint,
      orderSmsSendFailedHint: t.orderSmsSendFailedHint,
      orderSmsCodeSentConfirmation: t.orderSmsCodeSentConfirmation,
      orderChangePhone: t.orderChangePhone,
      orderInvalidPhone: t.orderInvalidPhone,
      orderAccountPhone: t.orderAccountPhone,
      orderMapSearchPlaceholder: t.orderMapSearchPlaceholder,
      orderMapPinHint: t.orderMapPinHint,
      orderMapLoading: t.orderMapLoading,
      orderMapUnavailable: t.orderMapUnavailable,
      orderDeliveryAddress: t.orderDeliveryAddress,
      orderReorder: t.orderReorder,
      orderMapNoResults: t.orderMapNoResults,
      orderMapSearchFailed: t.orderMapSearchFailed,
      orderMapSelectFailed: t.orderMapSelectFailed,
      orderMapLoadFailed: t.orderMapLoadFailed,
      orderProfileSection: t.orderProfileSection,
      orderAddressDefaultBadge: t.orderAddressDefaultBadge,
      orderAddressHomeLabel: t.orderAddressHomeLabel,
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
      halalBadge: t.halal,
      favoriteAdd: t.orderFavoriteAdd,
      favoriteRemove: t.orderFavoriteRemove,
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
      authRequired: t.orderAuthRequired,
      itemNotes: t.orderItemNotes,
      itemNotesPlaceholder: t.orderItemNotesPlaceholder,
      removeLine: t.orderRemoveLine,
      decreaseQty: t.orderDecreaseQty,
      increaseQty: t.orderIncreaseQty,
      itemsCountLabel: t.items,
    }),
    [t]
  );

  const checkoutLabels = useMemo(
    () => ({
      back: t.back,
      checkout: t.orderCheckout,
      contact: t.orderStepContact,
      phone: t.orderPhone,
      email: t.orderEmail,
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
      payCardWithWallet: t.orderPayCardWithWallet,
      saveCardForFuture: t.orderSaveCardForFuture,
      savedCardsAvailable: t.orderSavedCardsAvailable,
      placeOrder: t.placeOrder,
      takeawayDisabled: t.orderFulfillmentTakeawayDisabled,
      onlineDisabled: t.orderOnlineDisabled,
      deliveryDisabledHint: t.orderDeliveryDisabledInSettings,
      saveAddressForNext: t.orderSaveAddressForNext,
      mapSearch: t.orderMapSearchPlaceholder,
      mapNoResults: t.orderMapNoResults,
      mapSearchFailed: t.orderMapSearchFailed,
      mapSelectFailed: t.orderMapSelectFailed,
      mapLoadFailed: t.orderMapLoadFailed,
      mapPinHint: t.orderMapPinHint,
      mapLoading: t.orderMapLoading,
      mapUnavailable: t.orderMapUnavailable,
      authRequired: t.orderAuthRequired,
      scheduleNow: t.orderScheduleNow,
      scheduleLater: t.orderScheduleLater,
      scheduleFor: t.orderScheduleFor,
      scheduleDay: t.orderScheduleDay,
      scheduleTime: t.orderScheduleTime,
      zonePillIn: t.orderZonePillIn,
      today: t.today,
      tomorrow: t.tomorrow,
      scheduleNoSlots: t.orderScheduleNoSlots,
      promoCode: t.orderPromoCode,
      tip: t.orderTip,
      orderNotes: t.orderOrderNotes,
      consentLabel: t.orderConsentLabel,
      terms: t.orderTerms,
      privacy: t.orderPrivacy,
      refundPolicy: t.orderRefundPolicy,
      retry: t.retry,
      payCodDescription: t.orderPayCodDescription,
      payCashDescription: t.orderPayCashDescription,
      payEpointDescription: t.orderPayEpointDescription,
      checkoutSummary: t.orderCheckoutSummary,
      checkoutBrand: t.orderCheckoutBrand,
      promoPlaceholder: t.orderPromoCodePlaceholder,
      zonePillChecking: t.orderZonePillChecking,
      optional: t.optional,
    }),
    [t]
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

  const showBottomNav = flow === 'browse';
  const showMobileStickyCart = flow === 'browse' && navTab === 'menu' && cartCount > 0;

  const cartCheckoutPulse = kitchenImmediateStatus.status === 'CLOSING_SOON' && cart.length > 0;

  const kitchenBanner =
    flow === 'browse' && settings && kitchenImmediateStatus.status === 'PAUSED' ? (
      <div
        className="mx-auto mt-2 w-full max-w-3xl rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:mx-4"
        role="status"
      >
        <p className="font-semibold">{t.kitchenPausedTitle}</p>
        <p className="mt-1 text-xs opacity-90">{t.kitchenPausedMessage}</p>
        {settings.offline_until ? (
          <p className="mt-2 text-xs font-medium">
            {t.orderClosedPausedUntil.replace('{time}', formatBakuTimeShort(settings.offline_until, localeCode))}
          </p>
        ) : null}
        {availableScheduleSlots[0] ? (
          <button
            type="button"
            className="ming-btn-ghost mt-3 w-full border border-amber-500/30"
            onClick={() => {
              setIsScheduled(true);
              setScheduledFor(availableScheduleSlots[0] ?? null);
              setFlow('checkout');
            }}
          >
            {t.orderClosedScheduleAction}
          </button>
        ) : null}
      </div>
    ) : flow === 'browse' && settings && kitchenImmediateStatus.status === 'CLOSED' ? (
      <div
        className="mx-auto mt-2 w-full max-w-3xl rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-ming-bone sm:mx-4"
        role="status"
      >
        <p className="font-semibold">{t.kitchenClosedTitle}</p>
        <p className="mt-1 text-xs text-ming-ash">{t.kitchenClosedMessage}</p>
        {hoursLine ? (
          <p className="mt-2 text-xs text-ming-ash">
            {t.kitchenClosedReopenHint} {hoursLine}
          </p>
        ) : null}
        {kitchenImmediateStatus.nextOpenAt ? (
          <p className="mt-1 text-xs text-ming-ash">
            {t.orderClosedUntilNextOpen.replace(
              '{when}',
              formatBakuWeekdayTime(kitchenImmediateStatus.nextOpenAt, localeCode),
            )}
          </p>
        ) : null}
        {availableScheduleSlots[0] ? (
          <button
            type="button"
            className="ming-btn-primary mt-3 w-full"
            onClick={() => {
              setIsScheduled(true);
              setScheduledFor(availableScheduleSlots[0] ?? null);
              setFlow('checkout');
            }}
          >
            {t.orderClosedScheduleAction}
          </button>
        ) : null}
      </div>
    ) : flow === 'browse' && settings && kitchenImmediateStatus.status === 'CLOSING_SOON' ? (
      <div
        className="mx-auto mt-2 w-full max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100 sm:mx-4"
        role="status"
      >
        <p>{t.closingSoonBanner}</p>
      </div>
    ) : null;

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
      checkoutCtaLabel={scheduleFallbackActive ? t.orderClosedScheduleAction : undefined}
      checkoutCtaClassName={cartCheckoutPulse ? 'ming-cta-closing-soon' : undefined}
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
          {kitchenBanner}

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
              checkoutCtaLabel={scheduleFallbackActive ? t.orderClosedScheduleAction : undefined}
              checkoutCtaClassName={cartCheckoutPulse ? 'ming-cta-closing-soon' : undefined}
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
        <OrderCheckoutView
          fulfillment={fulfillment}
          showTakeaway={showTakeaway}
          showDelivery={showDelivery}
          onFulfillmentChange={setFulfillment}
          serverAllowsDelivery={serverAllowsDelivery}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          onCustomerEmailChange={setCustomerEmail}
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
          deliveryZones={zones}
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
          consentAccepted={consentAccepted}
          onConsentAcceptedChange={setConsentAccepted}
          cartTotal={cartTotal}
          deliveryFee={deliveryFee}
          grandTotal={grandTotal}
          submitting={submitting}
          submitError={submitError}
          canSubmit={canSubmit}
          onSubmit={() => void handleSubmitOrder()}
          closingSoonNote={closingSoonCheckoutNote}
          placeOrderButtonClassName={
            kitchenImmediateStatus.status === 'CLOSING_SOON' ? 'ming-cta-closing-soon' : undefined
          }
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

      <div className="sr-only" aria-live="polite">
        {t.orderNavCart}: {cartCount}
      </div>

      {!cookieConsent ? (
        <div className="fixed bottom-2 left-2 right-2 z-[60] rounded-xl border border-white/10 bg-ming-charcoal/95 p-3 text-xs text-ming-ash shadow-ming sm:left-auto sm:right-4 sm:max-w-sm">
          <p>
            {t.cookieConsentCopy}{' '}
            <a href="/privacy" className="ming-btn-link inline px-0 py-0 text-xs">
              {t.orderPrivacy}
            </a>
            .
          </p>
          <button
            type="button"
            className="ming-btn-primary mt-2 w-full py-2 text-[11px]"
            onClick={() => {
              window.localStorage.setItem(ORDER_COOKIE_CONSENT_KEY, 'accepted');
              setCookieConsent(true);
            }}
          >
            {t.cookieConsentAccept}
          </button>
        </div>
      ) : null}

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
