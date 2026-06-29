import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, type CartItem, type Category, type Product, type SelectedModifiers } from '../lib/supabase';
import { invokeEdgeFunction } from '../order/invokeEdge';
import { ProductDetailModal } from '../kiosk/ProductDetailModal';
import { findZoneForPoint } from '../services/deliveryZones';
import type { DeliveryZoneRow } from '../types/online';
import { CASH_PAYMENT_METHOD } from '../lib/cashPayment';
import { fulfillmentToPosSource } from './posSources';
import { buildPrintLabelsFromCreateResponse } from './posLabelPayload';
import { sendLabelsToPrintAgent } from './posPrintClient';
import { PosCartSidebar } from './PosCartSidebar';
import { PosCategoryRail } from './PosCategoryRail';
import { PosCustomerPanel } from './PosCustomerPanel';
import { PosDeliveryPanel } from './PosDeliveryPanel';
import { PosFulfillmentBar, type PosFulfillmentType } from './PosFulfillmentBar';
import { PosProductGrid } from './PosProductGrid';

function generateCartItemKey(productId: string, modifiers: SelectedModifiers): string {
  const modKey = Object.entries(modifiers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gId, opts]) => `${gId}:${opts.map((o) => o.id).sort().join(',')}`)
    .join('|');
  return `${productId}__${modKey}`;
}

interface PosNewOrderViewProps {
  onSubmitted?: () => void;
}

export function PosNewOrderView({ onSubmitted }: PosNewOrderViewProps) {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [fulfillment, setFulfillment] = useState<PosFulfillmentType>('takeaway');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryApartment, setDeliveryApartment] = useState('');
  const [deliveryFloor, setDeliveryFloor] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(CASH_PAYMENT_METHOD);

  useEffect(() => {
    void (async () => {
      const [productsRes, categoriesRes, zonesRes] = await Promise.all([
        supabase
          .from('products')
          .select(
            '*, product_modifier_groups(id, modifier_group_id, display_order, modifier_groups(id, name, min_select, max_select, is_required, display_order, modifier_options(*)))'
          )
          .eq('kiosk_visible', true)
          .gt('selling_price', 0)
          .order('display_order')
          .order('name'),
        supabase
          .from('master_categories')
          .select('*')
          .eq('type', 'menu')
          .order('display_order', { ascending: true })
          .order('name'),
        supabase.from('delivery_zones').select('*').eq('is_active', true),
      ]);

      if (productsRes.data) {
        const mapped = productsRes.data.map((p: Record<string, unknown>) => {
          const pmgs = (p.product_modifier_groups || []) as Array<{
            modifier_groups: Record<string, unknown>;
            display_order: number;
          }>;
          const modifierGroups = pmgs
            .map((pmg) => pmg.modifier_groups)
            .filter(Boolean)
            .sort(
              (a, b) =>
                ((a as { display_order?: number }).display_order || 0) -
                ((b as { display_order?: number }).display_order || 0)
            );
          return { ...p, modifier_groups: modifierGroups, product_modifier_groups: undefined };
        });
        setProducts(mapped as unknown as Product[]);
      }
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      if (zonesRes.data) setZones(zonesRes.data as DeliveryZoneRow[]);
    })();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => p.master_category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const deliveryFee = useMemo(() => {
    if (fulfillment !== 'delivery' || deliveryLat == null || deliveryLng == null) return 0;
    const zone = findZoneForPoint(deliveryLng, deliveryLat, zones);
    return zone ? Number(zone.delivery_fee ?? 0) : 0;
  }, [deliveryLat, deliveryLng, fulfillment, zones]);

  const cartSubtotal = cart.reduce((sum, item) => {
    const modTotal = Object.values(item.selectedModifiers)
      .flat()
      .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
    return sum + (Number(item.product.selling_price) + modTotal) * item.quantity;
  }, 0);

  const cartTotal = cartSubtotal + deliveryFee;

  const cartQtyByProduct = useCallback(
    (productId: string) =>
      cart.filter((item) => item.product.id === productId).reduce((s, item) => s + item.quantity, 0),
    [cart]
  );

  const addToCartSimple = (product: Product) => {
    const key = generateCartItemKey(product.id, {});
    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemKey === key);
      if (existing) {
        return prev.map((item) =>
          item.cartItemKey === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '', selectedModifiers: {}, cartItemKey: key }];
    });
  };

  const addToCartWithModifiers = (product: Product, selectedModifiers: SelectedModifiers) => {
    const key = generateCartItemKey(product.id, selectedModifiers);
    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemKey === key);
      if (existing) {
        return prev.map((item) =>
          item.cartItemKey === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '', selectedModifiers, cartItemKey: key }];
    });
    setDetailProduct(null);
  };

  const updateCartQuantity = (cartItemKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemKey !== cartItemKey) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (cartItemKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemKey !== cartItemKey));
  };

  const handleProductTap = (product: Product) => {
    const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
    if (hasModifiers) setDetailProduct(product);
    else addToCartSimple(product);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!cart.length) {
      setError(t.posCartEmpty);
      return;
    }
    if (fulfillment === 'delivery') {
      if (deliveryLat == null || deliveryLng == null || !deliveryAddress.trim()) {
        setError(t.posDeliveryRequired);
        return;
      }
      if (!findZoneForPoint(deliveryLng, deliveryLat, zones)) {
        setError(t.posOutsideZone);
        return;
      }
    }

    setSubmitting(true);
    try {
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError(t.signInToAccount);
        return;
      }

      const cartPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes || undefined,
        modifierOptionIds: Object.values(item.selectedModifiers)
          .flat()
          .map((o) => o.id),
      }));

      const res = await invokeEdgeFunction<
        {
          fulfillmentType: PosFulfillmentType;
          cart: typeof cartPayload;
          paymentMethod?: string;
          customerName?: string;
          customerPhone?: string;
          orderNotes?: string;
          deliveryAddress?: string;
          deliveryLat?: number | null;
          deliveryLng?: number | null;
          deliveryApartment?: string;
          deliveryFloor?: string;
          deliveryNotes?: string;
        },
        {
          saleId?: string;
          displayNumber?: string;
          source?: string;
          total?: number;
          deliveryFee?: number;
          saleItems?: Array<{
            id: string;
            productName: string;
            quantity: number;
            modifiers: string[];
            notes: string | null;
          }>;
          error?: string;
          code?: string;
        }
      >(
        'pos-order-create',
        {
          fulfillmentType: fulfillment,
          cart: cartPayload,
          paymentMethod,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          orderNotes: orderNotes.trim() || undefined,
          deliveryAddress: fulfillment === 'delivery' ? deliveryAddress : undefined,
          deliveryLat: fulfillment === 'delivery' ? deliveryLat : undefined,
          deliveryLng: fulfillment === 'delivery' ? deliveryLng : undefined,
          deliveryApartment: fulfillment === 'delivery' ? deliveryApartment : undefined,
          deliveryFloor: fulfillment === 'delivery' ? deliveryFloor : undefined,
          deliveryNotes: fulfillment === 'delivery' ? deliveryNotes : undefined,
        },
        accessToken,
      );

      if (!res.ok || !res.data) {
        setError(res.error ?? t.posSubmitFailed);
        return;
      }

      const payload = res.data;
      if (payload.error || !payload.displayNumber) {
        setError(payload.error ?? t.posSubmitFailed);
        return;
      }

      const labels = buildPrintLabelsFromCreateResponse(
        payload.displayNumber,
        payload.source ?? fulfillmentToPosSource(fulfillment),
        payload.saleItems ?? [],
        orderNotes
      );
      await sendLabelsToPrintAgent(labels);

      setConfirmation(payload.displayNumber);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setDeliveryAddress('');
      setDeliveryLat(null);
      setDeliveryLng(null);
      setDeliveryApartment('');
      setDeliveryFloor('');
      setDeliveryNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
        <h2 className="text-lg font-bold text-emerald-100">{t.posOrderCreated}</h2>
        <p className="font-mono text-2xl text-white">#{confirmation}</p>
        <button
          type="button"
          onClick={() => {
            setConfirmation(null);
            onSubmitted?.();
          }}
          className="rounded-lg bg-cockpit-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {t.posViewActiveOrders}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-cockpit-200">{t.posNewOrderTitle}</h2>
      <PosFulfillmentBar value={fulfillment} onChange={setFulfillment} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <PosCategoryRail
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <PosProductGrid
            products={filteredProducts}
            onProductTap={handleProductTap}
            cartQtyByProduct={cartQtyByProduct}
          />
          <PosCustomerPanel
            customerName={customerName}
            customerPhone={customerPhone}
            orderNotes={orderNotes}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onOrderNotesChange={setOrderNotes}
          />
          {fulfillment === 'delivery' ? (
            <PosDeliveryPanel
              address={deliveryAddress}
              lat={deliveryLat}
              lng={deliveryLng}
              apartment={deliveryApartment}
              floor={deliveryFloor}
              deliveryNotes={deliveryNotes}
              onAddressChange={setDeliveryAddress}
              onLocationChange={({ lat, lng, address }) => {
                setDeliveryLat(lat);
                setDeliveryLng(lng);
                setDeliveryAddress(address);
              }}
              onApartmentChange={setDeliveryApartment}
              onFloorChange={setDeliveryFloor}
              onDeliveryNotesChange={setDeliveryNotes}
            />
          ) : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>

        <PosCartSidebar
          cart={cart}
          total={cartTotal}
          deliveryFee={deliveryFee}
          submitting={submitting}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onUpdateQty={updateCartQuantity}
          onRemove={removeFromCart}
          onSubmit={() => void handleSubmit()}
        />
      </div>

      {detailProduct ? (
        <ProductDetailModal
          product={detailProduct}
          theme="order"
          onClose={() => setDetailProduct(null)}
          onAddToCart={(product, modifiers) => addToCartWithModifiers(product, modifiers)}
        />
      ) : null}

      {submitting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-cockpit-300" />
        </div>
      ) : null}
    </div>
  );
}
