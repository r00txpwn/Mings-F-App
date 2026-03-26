/** GeoJSON Polygon: first ring is exterior [[lng,lat], ...] */
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

export function pointInGeoJsonPolygon(
  lng: number,
  lat: number,
  polygon: { type?: string; coordinates?: number[][][] }
): boolean {
  if (!polygon?.coordinates?.[0]?.length) return false;
  return pointInPolygon(lng, lat, polygon.coordinates[0]);
}
