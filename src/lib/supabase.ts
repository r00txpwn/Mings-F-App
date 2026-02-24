import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'sale' | 'purchase';
  icon: string;
  color: string;
  created_at: string;
}

export interface SalesChannel {
  id: string;
  name: string;
  icon: string;
  color: string;
  logo_url?: string | null;
  display_order?: number;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  category_id: string | null;
  channel_id?: string | null;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense' | 'sale';
  order_count?: number;
  created_at: string;
  categories?: Category;
  sales_channels?: SalesChannel;
}

export interface Sale {
  id: string;
  product_id: string | null;
  sales_channel_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  sales_channels?: SalesChannel;
}

export interface UserPreference {
  id: string;
  language: 'en' | 'az' | 'ru';
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  barcode: string | null;
  category_id: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  unit: string;
  supplier_id: string | null;
  last_order_quantity: number;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
  categories?: Category;
}
