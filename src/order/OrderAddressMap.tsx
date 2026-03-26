import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, MapPin } from 'lucide-react';

/** Baku — default map center */
const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
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
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });

  return mapsLoadPromise;
}

export interface OrderAddressMapProps {
  apiKey: string | undefined;
  lat: number | null;
  lng: number | null;
  address: string;
  /** Pin / search / map tap — updates coordinates + usually formatted address */
  onLocationChange: (next: { lat: number; lng: number; address: string }) => void;
  /** Manual edits to the address text */
  onAddressChange: (address: string) => void;
  searchPlaceholder: string;
  pinHint: string;
  loadingLabel: string;
  unavailableLabel: string;
  addressLabel: string;
}

/**
 * Places search + draggable pin + tap map. Keeps delivery lat/lng in sync for zones.
 */
export function OrderAddressMap({
  apiKey,
  lat,
  lng,
  address,
  onLocationChange,
  onAddressChange,
  searchPlaceholder,
  pinHint,
  loadingLabel,
  unavailableLabel,
  addressLabel,
}: OrderAddressMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const skipNextExternalSync = useRef(false);
  const addressRef = useRef(address);
  addressRef.current = address;

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const applyLocation = useCallback(
    (position: google.maps.LatLngLiteral, formattedAddress: string) => {
      skipNextExternalSync.current = true;
      onLocationChange({ lat: position.lat, lng: position.lng, address: formattedAddress });
    },
    [onLocationChange]
  );

  useEffect(() => {
    if (!apiKey?.trim()) {
      setMapReady(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        await loadGoogleMapsScript(apiKey.trim());
        if (cancelled || !mapElRef.current || !searchInputRef.current) return;

        const maps = google.maps;

        const center: google.maps.LatLngLiteral =
          lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
            ? { lat, lng }
            : DEFAULT_CENTER;

        const map = new maps.Map(mapElRef.current, {
          center,
          zoom: lat != null && lng != null ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;

        const marker = new maps.Marker({
          map,
          position: center,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });
        markerRef.current = marker;

        geocoderRef.current = new maps.Geocoder();

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const p = pos.toJSON();
          geocoderRef.current?.geocode({ location: p }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              applyLocation(p, results[0].formatted_address ?? addressRef.current);
            } else {
              applyLocation(p, addressRef.current);
            }
          });
        });

        const ac = new maps.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'az' },
        });

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (!loc) return;
          const p = loc.toJSON();
          marker.setPosition(p);
          map.panTo(p);
          map.setZoom(17);
          const line = place.formatted_address ?? place.name ?? addressRef.current;
          applyLocation(p, line);
        });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const p = e.latLng.toJSON();
          marker.setPosition(e.latLng);
          geocoderRef.current?.geocode({ location: p }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              applyLocation(p, results[0].formatted_address ?? '');
            } else {
              applyLocation(p, addressRef.current);
            }
          });
        });

        setMapReady(true);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Map error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current = null;
      geocoderRef.current = null;
      setMapReady(false);
    };
    // Intentionally only when API key is set — do not recreate map when lat/lng change (sync effect handles that).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyLocation stable enough; avoid remounting map
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady || lat == null || lng == null) return;
    if (skipNextExternalSync.current) {
      skipNextExternalSync.current = false;
      return;
    }
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat, lng };
    marker.setPosition(pos);
    map.panTo(pos);
    map.setZoom(16);
  }, [lat, lng, mapReady]);

  if (!apiKey?.trim()) {
    return (
      <div className="space-y-2">
        <p className="rounded-xl border border-dashed border-white/20 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
          {unavailableLabel}
        </p>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">{addressLabel}</label>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
            rows={2}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={searchInputRef}
        type="text"
        autoComplete="street-address"
        placeholder={searchPlaceholder}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500"
        disabled={!mapReady && !loadError}
      />
      <div className="relative overflow-hidden rounded-xl border border-white/10">
        {loading ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 bg-slate-900/80">
            <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
            <span className="text-xs text-slate-500">{loadingLabel}</span>
          </div>
        ) : null}
        <div
          ref={mapElRef}
          className={`h-52 w-full min-h-[13rem] bg-slate-800 ${loading ? 'hidden' : ''}`}
        />
        {loadError ? <p className="p-3 text-xs text-rose-400">{loadError}</p> : null}
      </div>
      <p className="flex gap-2 text-xs text-slate-500">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cockpit-500" />
        <span>{pinHint}</span>
      </p>
      <div className="space-y-2">
        <label className="text-xs text-slate-500">{addressLabel}</label>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
          rows={2}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>
    </div>
  );
}
