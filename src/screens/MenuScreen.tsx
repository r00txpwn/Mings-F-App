import { useState, useEffect, useCallback } from 'react';
import { UtensilsCrossed, Plus, Package, Eye, EyeOff, ChevronUp, ChevronDown, Pencil, Trash2, Loader2, GripVertical, Image, Sliders, Globe, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, Category } from '../lib/supabase';
import { ModifierLibrary } from '../components/ProductModifierEditor';
import { ProductModifierAssigner } from '../components/ProductModifierAssigner';
import { MenuCategoryManager } from '../components/MenuCategoryManager';
import { MenuProductForm } from '../components/MenuProductForm';
import { PageHeader } from '../components/cockpit';
import { IconActionButton } from '../components/ui/IconActionButton';

export function MenuScreen() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [assignProduct, setAssignProduct] = useState<Product | null>(null);
  const [showModifierLibrary, setShowModifierLibrary] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      supabase
        .from('master_categories')
        .select('*')
        .eq('type', 'menu')
        .order('display_order', { ascending: true })
        .order('name'),
      supabase
        .from('products')
        .select('*, product_modifier_groups(id, modifier_group_id, display_order, modifier_groups(*, modifier_options(*)))')
        .order('display_order', { ascending: true })
        .order('name'),
    ]);
    if (catRes.data) {
      setCategories(catRes.data as Category[]);
      if (!selectedCategoryId && catRes.data.length > 0) {
        setSelectedCategoryId(catRes.data[0].id);
      }
    }
    if (prodRes.data) {
      const mapped = prodRes.data.map((p: Record<string, unknown>) => {
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
    setLoading(false);
  }, [selectedCategoryId]);

  useEffect(() => { loadData(); }, []);

  const filteredProducts = products.filter(p => p.master_category_id === selectedCategoryId);

  const handleToggleVisibility = async (product: Product) => {
    await supabase
      .from('products')
      .update({ kiosk_visible: !product.kiosk_visible })
      .eq('id', product.id);
    loadData();
  };

  const handleToggleOnlineVisibility = async (product: Product) => {
    await supabase
      .from('products')
      .update({ online_visible: !product.online_visible })
      .eq('id', product.id);
    loadData();
  };

  const handleMoveProduct = async (product: Product, direction: 'up' | 'down') => {
    const sorted = [...filteredProducts].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = sorted.findIndex(p => p.id === product.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const currentOrder = sorted[idx].display_order || 0;
    const swapOrder = sorted[swapIdx].display_order || 0;

    await Promise.all([
      supabase.from('products').update({ display_order: swapOrder }).eq('id', sorted[idx].id),
      supabase.from('products').update({ display_order: currentOrder }).eq('id', sorted[swapIdx].id),
    ]);
    loadData();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(t.deleteProductConfirm + '?')) return;
    await supabase.from('products').delete().eq('id', productId);
    loadData();
  };

  const handleDuplicateProduct = async (product: Product) => {
    const { data: newProduct } = await supabase
      .from('products')
      .insert({
        name: product.name + ' (copy)',
        description: product.description,
        master_category_id: product.master_category_id,
        selling_price: product.selling_price,
        cost_price: product.cost_price,
        image_url: product.image_url,
        kiosk_visible: false,
        online_visible: false,
        display_order: (product.display_order || 0) + 1,
        unit: product.unit,
        quantity: 0,
        min_stock_level: 0,
      })
      .select('id')
      .maybeSingle();

    if (newProduct && product.modifier_groups) {
      const assignments = product.modifier_groups.map((group, idx) => ({
        product_id: newProduct.id,
        modifier_group_id: group.id,
        display_order: idx,
      }));
      if (assignments.length > 0) {
        await supabase.from('product_modifier_groups').insert(assignments);
      }
    }
    loadData();
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.menuBuilder}
        title={t.menuBuilder}
        description={t.manageMenu}
        icon={UtensilsCrossed}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowCategoryManager(true)}
              className="cockpit-btn-ghost rounded-xl border border-slate-200 dark:border-white/10"
            >
              {t.menuCategories}
            </button>
            <button
              type="button"
              onClick={() => setShowModifierLibrary(true)}
              className="cockpit-btn-ghost flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10"
            >
              <Sliders className="h-4 w-4" />
              {t.modifiers}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="cockpit-btn-primary"
            >
              <Plus className="h-4 w-4" />
              {t.addProduct}
            </button>
          </>
        }
      />

      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-gradient-to-r from-cockpit-600 to-cockpit-700 text-white shadow-lg shadow-cockpit-500/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span>{cat.icon || '🍽️'}</span>
            {cat.name}
            <span className="text-xs opacity-60">
              ({products.filter(p => p.master_category_id === cat.id).length})
            </span>
          </button>
        ))}
        {categories.length === 0 && (
          <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
            No menu categories yet. Create one to get started.
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="cockpit-panel rounded-2xl p-12 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-600" />
          <p className="mb-4 text-lg text-slate-600 dark:text-slate-400">{t.noProductsFound}</p>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setShowProductForm(true);
            }}
            className="cockpit-btn-primary"
          >
            {t.addProduct}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...filteredProducts]
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((product, idx) => {
              const modifierCount = product.modifier_groups?.length || 0;
              const optionCount = product.modifier_groups?.reduce(
                (sum, g) => sum + (g.modifier_options?.length || 0), 0
              ) || 0;
              return (
                <div
                  key={product.id}
                  className={`cockpit-panel rounded-2xl transition-all ${
                    product.kiosk_visible ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(product, 'up')}
                        disabled={idx === 0}
                        className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <GripVertical className="h-4 w-4" />
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(product, 'down')}
                        disabled={idx === filteredProducts.length - 1}
                        className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Image className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</h3>
                        {!product.kiosk_visible && (
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Hidden
                          </span>
                        )}
                        {product.online_visible === false && (
                          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300">
                            {t.onlineVisible} — off
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="mb-1 truncate text-sm text-slate-500 dark:text-slate-400">{product.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold tabular-nums text-cockpit-600 dark:text-cockpit-400">
                          ₼{Number(product.selling_price).toFixed(2)}
                        </span>
                        {modifierCount > 0 && (
                          <span className="rounded-full bg-cockpit-500/10 px-2 py-0.5 text-xs text-cockpit-700 dark:text-cockpit-300">
                            {modifierCount} {t.modifierGroups.toLowerCase()} / {optionCount} {t.items}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <IconActionButton
                        onClick={() => handleToggleVisibility(product)}
                        icon={product.kiosk_visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        tone={product.kiosk_visible ? 'success' : 'neutral'}
                        title={product.kiosk_visible ? t.kioskVisible : 'Hidden from kiosk'}
                      />
                      <IconActionButton
                        onClick={() => handleToggleOnlineVisibility(product)}
                        icon={<Globe className="h-5 w-5" />}
                        tone={product.online_visible !== false ? 'info' : 'neutral'}
                        title={product.online_visible !== false ? t.onlineVisible : 'Hidden from web order'}
                      />
                      <button
                        type="button"
                        onClick={() => setAssignProduct(product)}
                        className="rounded-lg bg-cockpit-500/10 px-3 py-2 text-xs font-semibold text-cockpit-700 transition-colors hover:bg-cockpit-500/20 dark:text-cockpit-300"
                      >
                        {t.modifiers}
                      </button>
                      <IconActionButton
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductForm(true);
                        }}
                        icon={<Pencil className="h-4 w-4" />}
                        tone="edit"
                        label={t.edit}
                      />
                      <IconActionButton
                        onClick={() => handleDuplicateProduct(product)}
                        icon={<Copy className="h-4 w-4" />}
                        tone="neutral"
                        label={t.duplicateProduct}
                        title={t.duplicateProduct}
                      />
                      <IconActionButton
                        onClick={() => handleDeleteProduct(product.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                        tone="danger"
                        label={t.delete}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {showProductForm && (
        <MenuProductForm
          product={editingProduct}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSave={handleProductSaved}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
        />
      )}

      {assignProduct && (
        <ProductModifierAssigner
          product={assignProduct}
          onClose={() => { setAssignProduct(null); loadData(); }}
        />
      )}

      {showModifierLibrary && (
        <ModifierLibrary
          onClose={() => { setShowModifierLibrary(false); loadData(); }}
        />
      )}

      {showCategoryManager && (
        <MenuCategoryManager
          categories={categories}
          onClose={() => { setShowCategoryManager(false); loadData(); }}
        />
      )}
    </div>
  );
}
