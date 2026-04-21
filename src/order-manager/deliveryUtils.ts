export const MINGS_LAT = 40.3777;
export const MINGS_LNG = 49.892;
export const SELF_DELIVERY_THRESHOLD_KM = 1.0;

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
  deliveryLng: number | null | undefined
): 'self' | 'wolt' | null {
  if (deliveryLat == null || deliveryLng == null) return null;
  const km = haversineKm(MINGS_LAT, MINGS_LNG, deliveryLat, deliveryLng);
  return km < SELF_DELIVERY_THRESHOLD_KM ? 'self' : 'wolt';
}

/**
 * Formats distance for display e.g. "0.8 km" or "1.4 km"
 */
export function formatDistanceKm(
  deliveryLat: number | null | undefined,
  deliveryLng: number | null | undefined
): string | null {
  if (deliveryLat == null || deliveryLng == null) return null;
  const km = haversineKm(MINGS_LAT, MINGS_LNG, deliveryLat, deliveryLng);
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
  deliveryLng: number | null | undefined
): number | null {
  if (deliveryLat == null || deliveryLng == null) return null;
  const km = haversineKm(MINGS_LAT, MINGS_LNG, deliveryLat, deliveryLng);
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
