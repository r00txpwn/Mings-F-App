import { useLanguage } from '../contexts/LanguageContext';
import type { Category } from '../lib/supabase';

interface PosCategoryRailProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function PosCategoryRail({ categories, selectedId, onSelect }: PosCategoryRailProps) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
          selectedId === null ? 'bg-cockpit-500/30 text-cockpit-100' : 'bg-white/5 text-slate-300'
        }`}
      >
        {t.omAll}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
            selectedId === cat.id ? 'bg-cockpit-500/30 text-cockpit-100' : 'bg-white/5 text-slate-300'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
