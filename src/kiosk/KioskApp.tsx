import { useState, useEffect, useCallback, useRef } from 'react';
import { SecretGate } from '../components/SecretGate';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { supabase, Product, Category, CartItem, SelectedModifiers } from '../lib/supabase';
import { IdleScreen } from './IdleScreen';
import { MenuScreen } from './MenuScreen';
import { CartScreen } from './CartScreen';
import { CheckoutScreen } from './CheckoutScreen';
import { ConfirmationScreen } from './ConfirmationScreen';
import { UpsellModal } from './UpsellModal';
import { KioskLayout } from './KioskLayout';
import { ProductDetailModal } from './ProductDetailModal';

type KioskFlow = 'idle' | 'menu' | 'cart' | 'checkout' | 'confirmation';

function generateCartItemKey(productId: string, modifiers: SelectedModifiers): string {
  const modKey = Object.entries(modifiers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gId, opts]) => `${gId}:${opts.map(o => o.id).sort().join(',')}`)
    .join('|');
  return `${productId}__${modKey}`;
}

function KioskContent() {
  const [flow, setFlow] = useState<KioskFlow>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kioskChannelId, setKioskChannelId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ displayNumber: string } | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [lastAddedCategoryId, setLastAddedCategoryId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.overflow = 'hidden';
    loadData();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (flow !== 'idle' && flow !== 'confirmation') {
      timeoutRef.current = setTimeout(() => {
        setFlow('idle');
        setCart([]);
        setShowUpsell(false);
        setDetailProduct(null);
      }, 60000);
    }
  }, [flow]);

  useEffect(() => {
    resetInactivityTimer();
    const handler = () => resetInactivityTimer();
    window.addEventListener('touchstart', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetInactivityTimer]);

  const loadData = async () => {
    const [productsRes, categoriesRes, channelRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, product_modifier_groups(id, modifier_group_id, display_order, modifier_groups(*, modifier_options(*)))')
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
      supabase
        .from('sales_channels')
        .select('id')
        .eq('name', 'Kiosk')
        .maybeSingle(),
    ]);

    if (productsRes.data) {
      const mapped = productsRes.data.map((p: Record<string, unknown>) => {
        const pmgs = (p.product_modifier_groups || []) as Array<{
          modifier_groups: Record<string, unknown>;
          display_order: number;
        }>;
        const modifierGroups = pmgs
          .map(pmg => pmg.modifier_groups)
          .filter(Boolean)
          .sort((a, b) => ((a as { display_order?: number }).display_order || 0) - ((b as { display_order?: number }).display_order || 0));
        return { ...p, modifier_groups: modifierGroups, product_modifier_groups: undefined };
      });
      setProducts(mapped as unknown as Product[]);
    }
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    if (channelRes.data) setKioskChannelId(channelRes.data.id);
  };

  const handleProductTap = (product: Product) => {
    const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
    if (hasModifiers) {
      setDetailProduct(product);
    } else {
      addToCartSimple(product);
    }
  };

  const addToCartSimple = (product: Product) => {
    const key = generateCartItemKey(product.id, {});
    setCart(prev => {
      const existing = prev.find(item => item.cartItemKey === key);
      if (existing) {
        return prev.map(item =>
          item.cartItemKey === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '', selectedModifiers: {}, cartItemKey: key }];
    });
    setLastAddedCategoryId(product.master_category_id || null);
    setShowUpsell(true);
  };

  const addToCartWithModifiers = (product: Product, selectedModifiers: SelectedModifiers) => {
    const key = generateCartItemKey(product.id, selectedModifiers);
    setCart(prev => {
      const existing = prev.find(item => item.cartItemKey === key);
      if (existing) {
        return prev.map(item =>
          item.cartItemKey === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '', selectedModifiers, cartItemKey: key }];
    });
    setLastAddedCategoryId(product.master_category_id || null);
    setDetailProduct(null);
    setShowUpsell(true);
  };

  const updateCartQuantity = (cartItemKey: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.cartItemKey === cartItemKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (cartItemKey: string) => {
    setCart(prev => prev.filter(item => item.cartItemKey !== cartItemKey));
  };

  const getCartQtyForProduct = (productId: string) => {
    return cart
      .filter(item => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const cartTotal = cart.reduce((sum, item) => {
    const modifierTotal = Object.values(item.selectedModifiers)
      .flat()
      .reduce((s, opt) => s + Number(opt.price_adjustment), 0);
    return sum + (Number(item.product.selling_price) + modifierTotal) * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleBack = () => {
    if (flow === 'menu') setFlow('idle');
    else if (flow === 'cart') setFlow('menu');
    else if (flow === 'checkout') setFlow('cart');
    else setFlow('idle');
  };

  const upsellProducts = products
    .filter(p =>
      p.master_category_id !== lastAddedCategoryId &&
      !cart.some(c => c.product.id === p.id)
    )
    .slice(0, 3);

  const renderScreen = () => {
    switch (flow) {
      case 'idle':
        return <IdleScreen onStart={() => setFlow('menu')} />;
      case 'menu':
        return (
          <MenuScreen
            products={products}
            categories={categories}
            cart={cart}
            onAddToCart={handleProductTap}
            onUpdateQuantity={(productId, delta) => {
              const items = cart.filter(item => item.product.id === productId);
              if (items.length === 1) {
                updateCartQuantity(items[0].cartItemKey, delta);
              } else if (items.length > 1 && delta > 0) {
                updateCartQuantity(items[0].cartItemKey, delta);
              } else if (items.length > 1 && delta < 0) {
                updateCartQuantity(items[items.length - 1].cartItemKey, delta);
              }
            }}
            onViewCart={() => setFlow('cart')}
            cartItemCount={cartItemCount}
            getCartQtyForProduct={getCartQtyForProduct}
          />
        );
      case 'cart':
        return (
          <CartScreen
            cart={cart}
            total={cartTotal}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onContinueShopping={() => setFlow('menu')}
            onCheckout={() => setFlow('checkout')}
          />
        );
      case 'checkout':
        return (
          <CheckoutScreen
            cart={cart}
            total={cartTotal}
            kioskChannelId={kioskChannelId}
            onConfirmed={(displayNumber) => {
              setConfirmedOrder({ displayNumber });
              setFlow('confirmation');
            }}
            onBack={() => setFlow('cart')}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationScreen
            displayNumber={confirmedOrder?.displayNumber || ''}
            onDone={() => {
              setFlow('idle');
              setCart([]);
              setConfirmedOrder(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KioskLayout
      flow={flow}
      onBack={handleBack}
      showBack={flow !== 'idle' && flow !== 'confirmation'}
    >
      {renderScreen()}
      {showUpsell && flow === 'menu' && upsellProducts.length > 0 && (
        <UpsellModal
          products={upsellProducts}
          onAdd={(product) => {
            handleProductTap(product);
            setShowUpsell(false);
          }}
          onDismiss={() => setShowUpsell(false)}
        />
      )}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onAddToCart={addToCartWithModifiers}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </KioskLayout>
  );
}

export function KioskApp() {
  const secret = import.meta.env.VITE_KIOSK_SECRET || '';

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SecretGate secretKey={secret}>
          <KioskContent />
        </SecretGate>
      </LanguageProvider>
    </ThemeProvider>
  );
}
