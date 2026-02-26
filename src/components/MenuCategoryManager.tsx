import { useState } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Category } from '../lib/supabase';

interface MenuCategoryManagerProps {
  categories: Category[];
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🍔', '🍕', '🍟', '🥤', '🍰', '🥗', '🍣', '🌮', '☕', '🍝', '🥪', '🍗', '🧁', '🍺', '🧃', '🍽️'];
const COLOR_OPTIONS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];

export function MenuCategoryManager({ categories, onClose }: MenuCategoryManagerProps) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🍽️', color: '#EF4444' });
  const [localCategories, setLocalCategories] = useState(categories);

  const resetForm = () => {
    setForm({ name: '', icon: '🍽️', color: '#EF4444' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    if (editingId) {
      await supabase
        .from('master_categories')
        .update({ name: form.name.trim(), icon: form.icon, color: form.color })
        .eq('id', editingId);
    } else {
      const maxOrder = localCategories.reduce((max, c) => Math.max(max, (c as Category & { display_order?: number }).display_order || 0), 0);
      await supabase.from('master_categories').insert({
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        type: 'menu',
        display_order: maxOrder + 1,
      });
    }

    const { data } = await supabase
      .from('master_categories')
      .select('*')
      .eq('type', 'menu')
      .order('display_order')
      .order('name');
    if (data) setLocalCategories(data as Category[]);
    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.deleteCategoryConfirm)) return;
    await supabase.from('master_categories').delete().eq('id', id);
    setLocalCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...localCategories];
    const idx = sorted.findIndex(c => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    await Promise.all([
      supabase.from('master_categories').update({ display_order: swapIdx }).eq('id', sorted[idx].id),
      supabase.from('master_categories').update({ display_order: idx }).eq('id', sorted[swapIdx].id),
    ]);

    const temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;
    setLocalCategories(sorted);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon || '🍽️', color: cat.color || '#EF4444' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.menuCategories}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder={t.categoryName}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t.icon}</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    form.icon === emoji
                      ? 'bg-gray-900 dark:bg-white ring-2 ring-emerald-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t.color}</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-xl font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? t.save : t.addCategory}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {t.cancel}
            </button>
          )}
        </form>

        <div className="p-6 space-y-2">
          {localCategories.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No categories yet</p>
          ) : (
            localCategories.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(cat.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(cat.id, 'down')}
                    disabled={idx === localCategories.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.icon || '🍽️'}
                </div>
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{cat.name}</span>
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
