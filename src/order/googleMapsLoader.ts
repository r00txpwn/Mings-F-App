let mapsLoadPromise: Promise<void> | null = null;

/** Shared Geocoder — lazily created the first time `reverseGeocode` is called. */
let sharedGeocoder: google.maps.Geocoder | null = null;

/**
 * Loads the Google Maps JavaScript SDK (with Places + Drawing libraries on
 * the weekly channel). Places is required for customer autocomplete and
 * Drawing powers the staff delivery-zone editor.
 * Subsequent calls reuse the same promise, so the `<script>` is only injected once.
 */
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const w = window as Window & { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve();

  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const id = 'google-maps-js-sdk';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      const done = () => {
        if ((window as Window & { google?: { maps?: unknown } }).google?.maps) resolve();
        else setTimeout(done, 50);
      };
      existing.addEventListener('load', done);
      existing.addEventListener('error', () => reject(new Error('Google Maps script failed')));
      done();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,drawing&v=weekly`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });

  return mapsLoadPromise;
}

/**
 * Reverse-geocodes a `{ lat, lng }` pair to a formatted address. Loads the
 * Maps SDK on demand — safe to call from any surface that has an API key.
 *
 * Returns `null` when the SDK fails to load, the key is missing, or Google
 * returns no result (so callers can fall back to a coordinate string).
 */
export async function reverseGeocode(
  apiKey: string,
  location: google.maps.LatLngLiteral,
): Promise<string | null> {
  if (!apiKey?.trim()) return null;
  try {
    await loadGoogleMapsScript(apiKey.trim());
    if (!sharedGeocoder) sharedGeocoder = new google.maps.Geocoder();
    const { results } = await sharedGeocoder.geocode({ location });
    return results[0]?.formatted_address ?? null;
  } catch (err) {
    console.error('[googleMapsLoader] reverseGeocode failed:', err);
    return null;
  }
}
