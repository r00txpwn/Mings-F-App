import { Category, Product } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { UtensilsCrossed } from 'lucide-react';

interface CategoryScreenProps {
  categories: Category[];
  products: Product[];
  onSelect: (category: Category) => void;
}

function getCategoryThumbnail(categoryId: string, products: Product[]): string | null {
  const match = products.find((p) => p.master_category_id === categoryId && p.image_url);
  return match?.image_url ?? null;
}

export function CategoryScreen({ categories, products, onSelect }: CategoryScreenProps) {
  const { t } = useLanguage();

  const visibleCategories = categories.filter((cat) =>
    products.some((p) => p.master_category_id === cat.id)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pb-4 pt-6 text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--kiosk-text)' }}>
          {t.kioskExploreMenu}
        </h2>
      </div>

      <div className="kiosk-scroll-shadow flex-1 overflow-y-auto px-6 pb-4">
        {visibleCategories.length === 0 ? (
          <div className="py-16 text-center">
            <UtensilsCrossed className="mx-auto mb-4 h-16 w-16" style={{ color: 'var(--kiosk-muted)' }} />
            <p className="text-lg" style={{ color: 'var(--kiosk-muted)' }}>
              {t.kioskNoCategories}
            </p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleCategories.map((category) => {
              const thumb = getCategoryThumbnail(category.id, products);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelect(category)}
                  className="group overflow-hidden rounded-[22px] border-2 text-left transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--kiosk-card)',
                    borderColor: 'var(--kiosk-border)',
                  }}
                >
                  <div
                    className="relative aspect-[4/3] overflow-hidden"
                    style={{
                      backgroundColor: category.color ? `${category.color}18` : 'var(--kiosk-bg)',
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        {category.icon || '🍽️'}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span
                      className="block text-center text-base font-bold group-hover:text-[var(--kiosk-primary)]"
                      style={{ color: 'var(--kiosk-text)' }}
                    >
                      {category.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
