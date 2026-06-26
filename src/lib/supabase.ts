import { createClient } from '@supabase/supabase-js';
import { getAuthStorageKey } from './buildTarget';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Avoid crashing at module-evaluation time when env vars are missing.
// ConfigCheck handles the user-facing error screen in that scenario.
export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : 'http://127.0.0.1:54321',
  hasSupabaseConfig ? supabaseAnonKey : 'dev-placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: getAuthStorageKey(),
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Dashboard setting should be 604800s (7 days) in Supabase Auth -> Settings -> JWT expiry.
    },
  }
);

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
  is_deleted?: boolean;
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
  product_id?: string | null;
  name: string;
  display_order: number;
  min_select: number;
  max_select: number;
  is_required: boolean;
  created_at: string;
  modifier_options?: ModifierOption[];
  product_modifier_groups?: ProductModifierGroup[];
}

export interface ProductModifierGroup {
  id: string;
  product_id: string;
  modifier_group_id: string;
  display_order: number;
  created_at: string;
  modifier_groups?: ModifierGroup;
  products?: Product;
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
  is_combo?: boolean;
  combo_id?: string | null;
  combo_selections?: Record<string, unknown> | null;
  sale_item_modifiers?: SaleItemModifier[];
  prepared_at?: string | null;
}

export interface OnlinePayment {
  id: string;
  sale_id: string;
  provider: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  external_id: string | null;
  epoint_transaction: string | null;
  epoint_status: string | null;
  raw_payload: Record<string, unknown> | null;
  paid_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
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
  estimated_ready_at?: string | null;
  scheduled_for?: string | null;
  is_scheduled?: boolean | null;
  reminder_at?: string | null;
  online_payment_method?: string | null;
  delivery_notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_apartment?: string | null;
  delivery_floor?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_fee?: number | null;
  delivery_zone_id?: string | null;
  track_token?: string | null;
  customer_user_id?: string | null;
  discount_amount?: number | null;
  tip_amount?: number | null;
  promo_code?: string | null;
  cancellation_reason?: string | null;
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
  opening_balance?: number;
  opening_balance_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierAccountPayment {
  id: string;
  supplier_id: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export interface SupplierDebt {
  id: string;
  supplier_id: string;
  amount: number;
  debt_date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export interface Liability {
  id: string;
  type: 'loan' | 'other';
  counterparty: string;
  principal_amount: number;
  currency: string;
  incurred_date: string;
  due_date: string | null;
  notes: string;
  status: 'open' | 'partially_paid' | 'settled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiabilityPayment {
  id: string;
  liability_id: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export interface BankWithdrawal {
  id: string;
  amount: number;
  method: 'cashier' | 'abb_atm';
  fee_rate: number;
  fee_amount: number;
  withdrawal_date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
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
  online_visible?: boolean;
  /** Soft-delete: hidden from online menu when true. */
  is_deleted?: boolean;
  is_halal?: boolean;
  image_url?: string | null;
  display_order?: number;
  /** When true, adding this item alone may show “make it a combo” upsell (online order). */
  combo_upsell_eligible?: boolean;
  /** Optional explicit combo to offer in upsell popup. */
  upsell_combo_id?: string | null;
  suppliers?: Supplier;
  categories?: Category;
  modifier_groups?: ModifierGroup[];
}

export type ComboDiscountType = 'percent' | 'fixed';

export interface ComboGroupItem {
  id: string;
  group_id: string;
  menu_item_id: string;
  price_adjustment: number;
  products?: Product | null;
}

export interface ComboGroup {
  id: string;
  combo_id: string;
  name: string;
  required: boolean;
  sort_order: number;
  combo_group_items?: ComboGroupItem[];
}

export interface ComboDeal {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  /** Soft-delete: hidden from customers when true. */
  is_deleted?: boolean;
  image_url?: string | null;
  sort_order: number;
  discount_enabled?: boolean;
  discount_type?: ComboDiscountType;
  discount_value?: number;
  apply_discount_to_modifiers?: boolean;
  combo_groups?: ComboGroup[];
}

export interface ComboSelection {
  groupId: string;
  groupName: string;
  item: Product;
  priceAdjustment: number;
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
  isCombo?: boolean;
  comboId?: string;
  comboName?: string;
  comboBasePrice?: number;
  comboSelections?: ComboSelection[];
}

export interface PlatformPayout {
  id: string;
  sales_channel_id: string;
  period_start: string;
  period_end: string;
  payout_amount: number;
  payout_date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sales_channels?: SalesChannel;
}
