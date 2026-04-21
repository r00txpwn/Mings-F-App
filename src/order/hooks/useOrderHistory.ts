import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Sale } from '../../lib/supabase';

export function useOrderHistory(userId: string | undefined) {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select(
        'id, display_number, order_status, payment_status, total_price, sale_date, source, created_at, sale_items(id, product_id, product_name, quantity, notes)'
      )
      .eq('customer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    setOrders((data as Sale[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { orders, loading, reload: load };
}
