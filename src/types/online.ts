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
}

export interface CustomerProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddressRow {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  /** Apartment / flat / unit number. Optional — added in 20260420 migration. */
  apartment?: string | null;
  /** Floor number. Optional — added in 20260420 migration. */
  floor?: string | null;
  lat: number | null;
  lng: number | null;
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
