export const DEFAULT_KITCHEN_LAT = 40.3777;
export const DEFAULT_KITCHEN_LNG = 49.892;
export const SELF_DELIVERY_THRESHOLD_KM = 1.0;

export interface KitchenLocation {
  lat: number;
  lng: number;
}

export function getKitchenLocationFromSettings(
  settings:
    | {
        kitchen_lat?: number | null;
        kitchen_lng?: number | null;
      }
    | null
    | undefined,
): KitchenLocation {
  // Keep NaN when settings are missing/invalid so callers can hide distance-based UI.
  const lat = Number(settings?.kitchen_lat);
  const lng = Number(settings?.kitchen_lng);
  return {
    lat,
    lng,
  };
}

function hasValidKitchenLocation(kitchen: KitchenLocation): boolean {
  return Number.isFinite(kitchen.lat) && Number.isFinite(kitchen.lng);
}

/**
 * Haversine formula — returns distance in km between two lat/lng points.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns 'self' when distance < threshold, 'wolt' otherwise.
 * Returns null when coordinates are missing.
 */
export function suggestDeliveryMethod(
  deliveryLat: number | null | undefined,
  deliveryLng: number | null | undefined,
  kitchen: KitchenLocation = { lat: DEFAULT_KITCHEN_LAT, lng: DEFAULT_KITCHEN_LNG },
): 'self' | 'wolt' | null {
  if (deliveryLat == null || deliveryLng == null || !hasValidKitchenLocation(kitchen)) return null;
  const km = haversineKm(kitchen.lat, kitchen.lng, deliveryLat, deliveryLng);
  return km < SELF_DELIVERY_THRESHOLD_KM ? 'self' : 'wolt';
}

/**
 * Formats distance for display e.g. "0.8 km" or "1.4 km"
 */
export function formatDistanceKm(
  deliveryLat: number | null | undefined,
  deliveryLng: number | null | undefined,
  kitchen: KitchenLocation = { lat: DEFAULT_KITCHEN_LAT, lng: DEFAULT_KITCHEN_LNG },
): string | null {
  if (deliveryLat == null || deliveryLng == null || !hasValidKitchenLocation(kitchen)) return null;
  const km = haversineKm(kitchen.lat, kitchen.lng, deliveryLat, deliveryLng);
  return `${km.toFixed(1)} km`;
}

/**
 * Estimates delivery time in minutes based on distance from Ming's.
 * Uses 2.5 min/km cycling speed as base.
 * Minimum 10 min, maximum 45 min.
 * Returns null when coordinates are missing.
 */
export function estimateDeliveryMinutes(
  deliveryLat: number | null | undefined,
  deliveryLng: number | null | undefined,
  kitchen: KitchenLocation = { lat: DEFAULT_KITCHEN_LAT, lng: DEFAULT_KITCHEN_LNG },
): number | null {
  if (deliveryLat == null || deliveryLng == null || !hasValidKitchenLocation(kitchen)) return null;
  const km = haversineKm(kitchen.lat, kitchen.lng, deliveryLat, deliveryLng);
  const raw = Math.round(km * 2.5) + 10; // base 10 min + 2.5 min per km
  return Math.min(Math.max(raw, 10), 45);
}

/**
 * Given dispatched_at timestamp and estimated minutes,
 * returns the estimated arrival time as a formatted string e.g. "20:45"
 */
export function formatEta(dispatchedAt: string, estimatedMinutes: number): string {
  const dispatched = new Date(dispatchedAt);
  const eta = new Date(dispatched.getTime() + estimatedMinutes * 60_000);
  return eta.toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
