import type { DeliveryZoneRow } from '../types/online';

/** GeoJSON Polygon exterior ring [[lng,lat], ...] */
export function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const denom = yj - yi;
    if (denom === 0) continue;
    const intersect =
      (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / denom + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findZoneForPoint(
  lng: number,
  lat: number,
  zones: DeliveryZoneRow[]
): DeliveryZoneRow | null {
  for (const z of zones) {
    const coords = z.polygon?.coordinates?.[0];
    if (coords && pointInPolygon(lng, lat, coords)) return z;
  }
  return null;
}
