export type OnlineFulfillmentType = 'takeaway' | 'delivery';
export type OnlinePaymentMethod = 'cash' | 'cod';

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
  paymentMethod: OnlinePaymentMethod;
  nextStep: 'track';
}

export interface DeliveryZoneRow {
  id: string;
  name: string;
  polygon: { type: string; coordinates: number[][][] };
  delivery_fee: number;
  min_order_amount: number;
  is_active: boolean;
}

export interface OnlineSettingsRow {
  id: string;
  takeaway_enabled: boolean;
  delivery_enabled: boolean;
  hours_json: Record<string, unknown>;
  min_order_amount: number;
  tagline?: string | null;
  hero_image_url?: string | null;
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
