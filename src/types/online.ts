export type OnlineFulfillmentType = 'takeaway' | 'delivery';
/** Persisted on new sales; legacy rows may still use epoint, cod, or cash. */
export type OnlinePaymentMethod = 'card_online' | 'cash_pickup' | 'cash_delivery';

export interface OnlineCartLine {
  productId: string;
  quantity: number;
  notes?: string;
  modifierOptionIds?: string[];
}

export interface OnlineOrderCreateResponse {
  saleId: string;
  trackToken: string;
  displayNumber: string;
  total: number;
  deliveryFee: number;
  /** Normalized value returned from server (new: card_online | cash_pickup | cash_delivery). */
  paymentMethod: OnlinePaymentMethod | 'epoint' | 'cod' | 'cash';
  /** One-time-like secret used to initialize the hosted card payment for this sale. */
  paymentInitToken?: string;
  nextStep: 'united-payment-create-payment' | 'epoint-create-payment' | 'track';
  /** True when order was placed during soft-close (last-call) window. */
  closingSoon?: boolean;
  /** Server reused an existing sale for the same clientRequestId. */
  idempotent?: boolean;
}

export interface DeliveryZoneRow {
  id: string;
  name: string;
  polygon: { type: string; coordinates: number[][][] };
  delivery_fee: number;
  min_order_amount: number;
  /** Optional per-zone free-delivery threshold — added in 20260420 migration. */
  free_delivery_threshold?: number | null;
  /** Sort key for the cockpit list (asc) — added in 20260420 migration. */
  sort_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DispatchMode = 'auto' | 'manual';

/** One-off Baku calendar date overriding weekly hours_json. */
export interface SpecialDay {
  date: string;
  closed: boolean;
  open?: string;
  close?: string;
  note_en?: string;
  note_az?: string;
  note_ru?: string;
}

export interface OnlineSettingsRow {
  id: string;
  takeaway_enabled: boolean;
  delivery_enabled: boolean;
  /** When false or null, checkout should treat the kitchen as closed (see OrderApp). */
  is_open?: boolean | null;
  hours_json: Record<string, unknown>;
  min_order_amount: number;
  tagline?: string | null;
  hero_image_url?: string | null;
  /** Default kitchen prep time in minutes — added in 20260420 migration. */
  default_prep_time_minutes?: number | null;
  /** Global free-delivery threshold (zones may override) — added in 20260420 migration. */
  free_delivery_threshold?: number | null;
  /** Auto = call Wolt on order; manual = staff dispatches from the cockpit. */
  dispatch_mode?: DispatchMode | null;
  /** Slot granularity for scheduled orders. */
  scheduled_slot_minutes?: number | null;
  /** Minimum lead time from now for scheduled orders. */
  scheduled_lead_minutes?: number | null;
  /** Kitchen/store anchor latitude used for distance + ETA helpers. */
  kitchen_lat?: number | null;
  /** Kitchen/store anchor longitude used for distance + ETA helpers. */
  kitchen_lng?: number | null;
  loyalty_enabled?: boolean | null;
  loyalty_reward_every_orders?: number | null;
  /** Timed pause end (UTC); used with is_open=false for 30/60 min presets. */
  offline_until?: string | null;
  /** Soft-close window in minutes before close; 0 = disabled. */
  closing_soon_minutes?: number | null;
  /** One-off holidays / special hours (Baku dates); overrides hours_json per date. */
  special_days_json?: SpecialDay[] | null;
}

export interface CustomerProfileRow {
  id: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone: string | null;
  phone_verified_at?: string | null;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  privacy_version?: string | null;
  refund_version?: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerAddressType = 'apartment' | 'house' | 'office' | 'hotel' | 'other';
export type CustomerAddressAccessMethod = 'intercom' | 'door_code' | 'door_open' | 'other';
export type CustomerAddressLeaveAt = 'office' | 'reception';

export interface CustomerAddressRow {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  address_type?: CustomerAddressType | null;
  building_name?: string | null;
  entrance?: string | null;
  /** Apartment / flat / unit number. Optional — added in 20260420 migration. */
  apartment?: string | null;
  /** Floor number. Optional — added in 20260420 migration. */
  floor?: string | null;
  door_name_or_number?: string | null;
  company_name?: string | null;
  leave_at?: CustomerAddressLeaveAt | null;
  access_method?: CustomerAddressAccessMethod | null;
  intercom_name_or_number?: string | null;
  door_code?: string | null;
  access_other_instructions?: string | null;
  courier_instructions?: string | null;
  lat: number | null;
  lng: number | null;
  entry_point_lat?: number | null;
  entry_point_lng?: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrderRow {
  id: string;
  sale_id: string;
  wolt_delivery_id: string | null;
  status: string | null;
  tracking_url: string | null;
}
