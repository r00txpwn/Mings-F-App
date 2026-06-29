/** Baku metro delivery area — matches customer checkout autocomplete restriction. */
export const BAKU_MAP_BOUNDS = {
  south: 40.32,
  west: 49.78,
  north: 40.5,
  east: 49.98,
} as const;

export const BAKU_MAP_CENTER = { lat: 40.4093, lng: 49.8671 } as const;

export function isWithinBakuBounds(lat: number, lng: number): boolean {
  return (
    lat >= BAKU_MAP_BOUNDS.south &&
    lat <= BAKU_MAP_BOUNDS.north &&
    lng >= BAKU_MAP_BOUNDS.west &&
    lng <= BAKU_MAP_BOUNDS.east
  );
}
