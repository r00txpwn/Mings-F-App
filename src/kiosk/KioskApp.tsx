import { useState, useEffect, useCallback, useRef } from 'react';
import { SecretGate } from '../components/SecretGate';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, Category, CartItem } from '../lib/supabase';
import { IdleScreen } from './IdleScreen';
import { CategoryScreen } from './CategoryScreen';
import { ProductScreen } from './ProductScreen';
import { CartScreen } from './CartScreen';
import { CheckoutScreen } from './CheckoutScreen';
import { ConfirmationScreen } from './ConfirmationScreen';
import { UpsellModal } from './UpsellModal';
import { KioskLayout } from './KioskLayout';

type KioskFlow = 'idle' | 'categories' | 'products' | 'cart' | 'checkout' | 'confirmation';

function KioskContent() {
  const { t } = useLanguage();
  const [flow, setFlow] = useState<KioskFlow>('idle');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kioskChannelId, setKioskChannelId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ displayNumber: string } | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [lastAddedCategoryId, setLastAddedCategoryId] = useState<string | null>(null);
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
        setSelectedCategory(null);
        setShowUpsell(false);
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
        .select('*')
        .eq('kiosk_visible', true)
        .gt('selling_price', 0),
      supabase
        .from('master_categories')
        .select('*')
        .eq('type', 'menu')
        .order('name'),
      supabase
        .from('sales_channels')
        .select('id')
        .eq('name', 'Kiosk')
        .maybeSingle(),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    if (channelRes.data) setKioskChannelId(channelRes.data.id);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
    setLastAddedCategoryId(product.master_category_id || null);
    setShowUpsell(true);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setFlow('products');
  };

  const handleBack = () => {
    if (flow === 'products') setFlow('categories');
    else if (flow === 'cart') setFlow('products');
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
        return <IdleScreen onStart={() => setFlow('categories')} />;
      case 'categories':
        return <CategoryScreen categories={categories} onSelect={handleCategorySelect} />;
      case 'products':
        return (
          <ProductScreen
            products={products.filter(p => p.master_category_id === selectedCategory?.id)}
            category={selectedCategory}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onViewCart={() => setFlow('cart')}
            cartItemCount={cartItemCount}
          />
        );
      case 'cart':
        return (
          <CartScreen
            cart={cart}
            total={cartTotal}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onContinueShopping={() => setFlow('categories')}
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
              setSelectedCategory(null);
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
      {showUpsell && flow === 'products' && upsellProducts.length > 0 && (
        <UpsellModal
          products={upsellProducts}
          onAdd={(product) => {
            addToCart(product);
            setShowUpsell(false);
          }}
          onDismiss={() => setShowUpsell(false)}
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
