import { Category } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { UtensilsCrossed } from 'lucide-react';

interface CategoryScreenProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

export function CategoryScreen({ categories, onSelect }: CategoryScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">{t.menu}</h2>
      {categories.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No menu categories available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelect(category)}
              className="group bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-emerald-500 rounded-2xl p-8 transition-all active:scale-95 min-h-[140px] flex flex-col items-center justify-center gap-4"
              style={{ borderColor: category.color || undefined }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {category.icon || '🍽️'}
              </div>
              <span className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors text-center">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
