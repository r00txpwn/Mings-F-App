/**
 * Tolerant GeoJSON parser for the Delivery Zones editor.
 *
 * Accepts:
 *   - bare Polygon geometry            { type: 'Polygon', coordinates: [[[lng,lat], ...]] }
 *   - Feature with Polygon geometry    { type: 'Feature', geometry: { type: 'Polygon', ... } }
 *   - FeatureCollection with one Polygon (e.g. raw paste from geojson.io)
 *
 * Output is always normalised to the shape `delivery_zones.polygon` stores
 * and `OrderAddressMap` already reads:
 *
 *   { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
 *
 * Auto-closes the ring when the user pasted an open ring (last point !== first).
 */

export interface NormalisedPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export type ValidateZoneGeoJsonResult =
  | { ok: true; polygon: NormalisedPolygon; vertices: number; autoClosed: boolean }
  | { ok: false; error: string };

interface UnknownObject { [k: string]: unknown }

function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractPolygonGeometry(parsed: unknown): UnknownObject | null {
  if (!isObject(parsed)) return null;
  const type = parsed.type;
  if (type === 'Polygon') return parsed;
  if (type === 'Feature' && isObject(parsed.geometry)) {
    return parsed.geometry as UnknownObject;
  }
  if (type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    const polygonFeature = (parsed.features as unknown[]).find(
      (f) => isObject(f) && isObject(f.geometry) && (f.geometry as UnknownObject).type === 'Polygon',
    );
    if (polygonFeature && isObject(polygonFeature) && isObject(polygonFeature.geometry)) {
      return polygonFeature.geometry as UnknownObject;
    }
  }
  return null;
}

function isValidLngLat(point: unknown): point is [number, number] {
  if (!Array.isArray(point) || point.length < 2) return false;
  const [lng, lat] = point;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export function validateZoneGeoJson(raw: string): ValidateZoneGeoJsonResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }

  const geometry = extractPolygonGeometry(parsed);
  if (!geometry) return { ok: false, error: 'not_polygon' };

  if (geometry.type !== 'Polygon') return { ok: false, error: 'not_polygon' };

  const coordinates = geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return { ok: false, error: 'no_ring' };
  }

  const ringRaw = coordinates[0];
  if (!Array.isArray(ringRaw)) return { ok: false, error: 'no_ring' };

  const ring: number[][] = [];
  for (const point of ringRaw) {
    if (!isValidLngLat(point)) {
      return { ok: false, error: 'invalid_point' };
    }
    ring.push([point[0], point[1]]);
  }

  if (ring.length < 3) return { ok: false, error: 'too_few_points' };

  const first = ring[0];
  const last = ring[ring.length - 1];
  let autoClosed = false;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
    autoClosed = true;
  }

  if (ring.length < 4) return { ok: false, error: 'too_few_points' };

  return {
    ok: true,
    polygon: { type: 'Polygon', coordinates: [ring] },
    vertices: ring.length - 1,
    autoClosed,
  };
}
