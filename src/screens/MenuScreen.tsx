import { useState, useEffect, useCallback } from 'react';
import { UtensilsCrossed, Plus, Package, Eye, EyeOff, ChevronUp, ChevronDown, Pencil, Trash2, Loader2, GripVertical, Image } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, Category, ModifierGroup } from '../lib/supabase';
import { ProductModifierEditor } from '../components/ProductModifierEditor';
import { MenuCategoryManager } from '../components/MenuCategoryManager';
import { MenuProductForm } from '../components/MenuProductForm';

export function MenuScreen() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
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
        .select('*, modifier_groups(*, modifier_options(*))')
        .order('display_order', { ascending: true })
        .order('name'),
    ]);
    if (catRes.data) {
      setCategories(catRes.data as Category[]);
      if (!selectedCategoryId && catRes.data.length > 0) {
        setSelectedCategoryId(catRes.data[0].id);
      }
    }
    if (prodRes.data) setProducts(prodRes.data as Product[]);
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
        display_order: (product.display_order || 0) + 1,
        unit: product.unit,
        quantity: 0,
        min_stock_level: 0,
      })
      .select('id')
      .maybeSingle();

    if (newProduct && product.modifier_groups) {
      for (const group of product.modifier_groups) {
        const { data: newGroup } = await supabase
          .from('modifier_groups')
          .insert({
            product_id: newProduct.id,
            name: group.name,
            display_order: group.display_order,
            min_select: group.min_select,
            max_select: group.max_select,
            is_required: group.is_required,
          })
          .select('id')
          .maybeSingle();

        if (newGroup && group.modifier_options) {
          await supabase.from('modifier_options').insert(
            group.modifier_options.map(opt => ({
              modifier_group_id: newGroup.id,
              name: opt.name,
              price_adjustment: opt.price_adjustment,
              image_url: opt.image_url,
              is_default: opt.is_default,
              is_available: opt.is_available,
              display_order: opt.display_order,
            }))
          );
        }
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-orange-100 dark:bg-orange-900 p-2 sm:p-3 rounded-xl">
              <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-orange-700 dark:text-orange-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t.menuBuilder}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.manageMenu}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-4 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t.menuCategories}
            </button>
            <button
              onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.addProduct}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategoryId === cat.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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
          <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
            No menu categories yet. Create one to get started.
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{t.noProductsFound}</p>
          <button
            onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
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
                  className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all ${
                    product.kiosk_visible
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
                      <button
                        onClick={() => handleMoveProduct(product, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <GripVertical className="w-4 h-4" />
                      <button
                        onClick={() => handleMoveProduct(product, 'down')}
                        disabled={idx === filteredProducts.length - 1}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
                        {!product.kiosk_visible && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">{product.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          ₼{Number(product.selling_price).toFixed(2)}
                        </span>
                        {modifierCount > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            {modifierCount} {t.modifierGroups.toLowerCase()} / {optionCount} {t.items}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleVisibility(product)}
                        className={`p-2 rounded-lg transition-colors ${
                          product.kiosk_visible
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={product.kiosk_visible ? t.kioskVisible : 'Hidden from kiosk'}
                      >
                        {product.kiosk_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setModifierProduct(product)}
                        className="px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {t.modifiers}
                      </button>
                      <button
                        onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(product)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs"
                        title={t.duplicateProduct}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {modifierProduct && (
        <ProductModifierEditor
          product={modifierProduct}
          onClose={() => { setModifierProduct(null); loadData(); }}
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
