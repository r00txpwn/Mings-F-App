import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'sale' | 'purchase' | 'menu';
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

export interface ModifierGroup {
  id: string;
  product_id: string;
  name: string;
  display_order: number;
  min_select: number;
  max_select: number;
  is_required: boolean;
  created_at: string;
  modifier_options?: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  modifier_group_id: string;
  name: string;
  price_adjustment: number;
  image_url: string | null;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface SaleItemModifier {
  id: string;
  sale_item_id: string;
  modifier_group_name: string;
  modifier_option_name: string;
  price_adjustment: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
  sale_item_modifiers?: SaleItemModifier[];
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
  source?: string;
  order_status?: string;
  payment_status?: string;
  daily_order_number?: number | null;
  display_number?: string | null;
  prep_started_at?: string | null;
  ready_at?: string | null;
  sales_channels?: SalesChannel;
  sale_items?: SaleItem[];
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
  master_category_id: string | null;
  quantity: number;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  unit: string;
  supplier_id: string | null;
  last_order_quantity: number;
  created_at: string;
  updated_at: string;
  kiosk_visible?: boolean;
  image_url?: string | null;
  display_order?: number;
  suppliers?: Supplier;
  categories?: Category;
  modifier_groups?: ModifierGroup[];
}

export interface SelectedModifiers {
  [groupId: string]: ModifierOption[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
  selectedModifiers: SelectedModifiers;
  cartItemKey: string;
}
