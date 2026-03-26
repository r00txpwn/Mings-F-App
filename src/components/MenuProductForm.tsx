import { useState } from 'react';
import { X, Image, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, Category } from '../lib/supabase';

interface MenuProductFormProps {
  product: Product | null;
  categories: Category[];
  selectedCategoryId: string | null;
  onSave: () => void;
  onClose: () => void;
}

export function MenuProductForm({ product, categories, selectedCategoryId, onSave, onClose }: MenuProductFormProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const defaultCategoryId = product?.master_category_id || selectedCategoryId || (categories.length > 0 ? categories[0].id : '');
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    selling_price: product?.selling_price?.toString() || '',
    cost_price: product?.cost_price?.toString() || '0',
    image_url: product?.image_url || '',
    master_category_id: defaultCategoryId,
    kiosk_visible: product?.kiosk_visible ?? true,
    online_visible: product?.online_visible ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.selling_price || !form.master_category_id) return;
    setSaving(true);

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      selling_price: parseFloat(form.selling_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      image_url: form.image_url.trim() || null,
      master_category_id: form.master_category_id || null,
      kiosk_visible: form.kiosk_visible,
    };

    if (product) {
      await supabase.from('products').update(data).eq('id', product.id);
    } else {
      await supabase.from('products').insert({ ...data, unit: 'pcs', quantity: 0, min_stock_level: 0 });
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {product ? t.editProduct : t.addProduct}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {form.image_url && (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.productName} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.description}
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.sellingPriceLabel} (₼) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.selling_price}
                onChange={e => setForm({ ...form, selling_price: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.costPrice} (₼)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={e => setForm({ ...form, cost_price: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Image className="w-4 h-4 inline mr-1" />
              {t.productImage}
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.category} *
            </label>
            <select
              value={form.master_category_id}
              onChange={e => setForm({ ...form, master_category_id: e.target.value })}
              className="cockpit-select"
              required
            >
              {!form.master_category_id && <option value="">{t.noCategory}</option>}
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, kiosk_visible: !f.kiosk_visible }))}
            className="flex items-center gap-3 text-left"
          >
            <div className={`relative h-7 w-12 rounded-full transition-colors ${form.kiosk_visible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${form.kiosk_visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.kioskVisible}</span>
          </button>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, online_visible: !f.online_visible }))}
            className="flex items-center gap-3 text-left"
          >
            <div className={`relative h-7 w-12 rounded-full transition-colors ${form.online_visible ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${form.online_visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.onlineVisible}</span>
          </button>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.selling_price || !form.master_category_id}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {product ? t.save : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
