import { useState, useEffect, useCallback } from 'react';
import { supabase, Product, Category } from '../../lib/supabase';

export function useOnlineMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select(
          '*, product_modifier_groups(id, modifier_group_id, display_order, modifier_groups(id, name, min_select, max_select, is_required, display_order, modifier_options(*)))'
        )
        .eq('online_visible', true)
        .eq('is_deleted', false)
        .gt('selling_price', 0)
        .order('display_order')
        .order('name'),
      supabase
        .from('master_categories')
        .select('*')
        .eq('type', 'menu')
        .order('display_order', { ascending: true })
        .order('name'),
    ]);

    if (productsRes.error) setError(productsRes.error.message);
    if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);

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
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, categories, loading, error, reload: load };
}
