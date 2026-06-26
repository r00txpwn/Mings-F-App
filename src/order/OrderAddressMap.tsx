import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Navigation, XCircle } from 'lucide-react';
import { loadGoogleMapsScript } from './googleMapsLoader';
import { AddressAutocomplete, type AddressAutocompleteResult } from './AddressAutocomplete';
import type { DeliveryZoneRow } from '../types/online';
import { formatMoney } from '../lib/money';

/** Baku — default map center. */
const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

/** Cockpit gold (matches tailwind `cockpit-400`). */
const ZONE_ACTIVE_COLOR = '#fbbf24';
/** Slate-400 — muted. */
const ZONE_IDLE_COLOR = '#94a3b8';

export type ZonePillStatus =
  | { kind: 'idle' }
  | { kind: 'in'; zoneId: string; zoneName: string; fee: number }
  | { kind: 'out' };

export interface OrderAddressMapProps {
  apiKey: string | undefined;
  lat: number | null;
  lng: number | null;
  address: string;
  /** Pin drag / map tap / autocomplete select — updates coordinates + formatted address. */
  onLocationChange: (next: { lat: number; lng: number; address: string }) => void;
  /** Manual edits to the raw address textarea (apartment / floor / free notes). */
  onAddressChange: (address: string) => void;
  searchPlaceholder: string;
  pinHint: string;
  loadingLabel: string;
  unavailableLabel: string;
  addressLabel: string;
  /** Optional — shown as "no matches" state in the autocomplete dropdown. */
  noResultsLabel?: string;
  /**
   * Optional — when provided, renders zone polygons on the map + a live status
   * pill directly under the search input. The matched zone (if any) is
   * highlighted in the cockpit accent color; other active zones are shown muted
   * so customers can see the full coverage at a glance.
   */
  zones?: DeliveryZoneRow[];
  zoneStatus?: ZonePillStatus;
  /**
   * i18n labels for the pill. Supports the same `{zone}` / `{fee}` placeholders
   * used by `t.orderZonePillIn`.
   */
  zonePillIn?: string;
  zonePillOut?: string;
  zonePillChecking?: string;
  onUseLocation?: () => void;
  useLocationLabel?: string;
  searchFailedLabel?: string;
  selectFailedLabel?: string;
  mapsLoadFailedLabel?: string;
}

/**
 * Delivery address picker for Baku.
 *
 * Composition:
 *  - Premium autocomplete (Places API New, session tokens, Baku bounds) on top.
 *  - Map + fixed center pin below; customer moves the map underneath the pin
 *    to fine-tune the exact building entrance — a common need in Baku because
 *    many addresses lack
 *    reliable street-number data in Google's index.
 *  - Free-text textarea for apartment / floor / courier-visible notes.
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
  noResultsLabel,
  zones,
  zoneStatus,
  zonePillIn,
  zonePillOut,
  zonePillChecking,
  onUseLocation,
  useLocationLabel,
  searchFailedLabel,
  selectFailedLabel,
  mapsLoadFailedLabel,
}: OrderAddressMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const skipNextExternalSync = useRef(false);
  const geocodeSeqRef = useRef(0);
  const addressRef = useRef(address);
  addressRef.current = address;

  const activeZoneId = zoneStatus?.kind === 'in' ? zoneStatus.zoneId : null;

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pinWrapRef = useRef<HTMLDivElement>(null);

  const triggerPinSettle = useCallback(() => {
    const el = pinWrapRef.current;
    if (!el || typeof el.animate !== 'function') return;
    void el.animate(
      [
        { transform: 'translate(-50%, -100%) scale(1)' },
        { transform: 'translate(-50%, -105%) scale(1.03)' },
        { transform: 'translate(-50%, -100%) scale(1)' },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );
  }, []);

  const applyLocation = useCallback(
    (position: google.maps.LatLngLiteral, formattedAddress: string) => {
      skipNextExternalSync.current = true;
      onLocationChange({ lat: position.lat, lng: position.lng, address: formattedAddress });
    },
    [onLocationChange],
  );

  // Boot the map once the SDK is loaded.
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
        if (cancelled || !mapElRef.current) return;

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
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        geocoderRef.current = new maps.Geocoder();

        map.addListener('idle', () => {
          const centerLatLng = map.getCenter();
          if (!centerLatLng) return;
          const p = centerLatLng.toJSON();
          const seq = ++geocodeSeqRef.current;
          geocoderRef.current?.geocode({ location: p }, (results, status) => {
            // Ignore stale reverse-geocode replies while user keeps moving map.
            if (seq !== geocodeSeqRef.current) return;
            if (status === 'OK' && results?.[0]) {
              applyLocation(p, results[0].formatted_address ?? addressRef.current);
            } else {
              applyLocation(p, addressRef.current);
            }
            triggerPinSettle();
          });
        });

        setMapReady(true);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : (mapsLoadFailedLabel ?? 'Map error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      geocoderRef.current = null;
      setMapReady(false);
    };
    // Intentionally only when the API key changes — the sync effect below handles lat/lng updates without remounting the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Draw delivery-zone polygons on the map. Re-run when zones change or when
  // the matched zone id changes (so we can re-style the highlighted one).
  useEffect(() => {
    if (!mapReady || !mapRef.current || !zones) return;
    const map = mapRef.current;
    const polys = polygonsRef.current;

    // Clear any polygon that's no longer in the incoming list.
    for (const [id, poly] of polys) {
      if (!zones.find((z) => z.id === id)) {
        poly.setMap(null);
        polys.delete(id);
      }
    }

    for (const zone of zones) {
      const ring = zone.polygon?.coordinates?.[0];
      if (!ring || ring.length < 3) continue;
      const path: google.maps.LatLngLiteral[] = ring.map(([lngP, latP]) => ({
        lat: latP,
        lng: lngP,
      }));

      const isActive = zone.id === activeZoneId;
      const fillColor = isActive ? ZONE_ACTIVE_COLOR : ZONE_IDLE_COLOR;
      const strokeColor = isActive ? ZONE_ACTIVE_COLOR : ZONE_IDLE_COLOR;
      const fillOpacity = isActive ? 0.15 : 0.05;
      const strokeOpacity = isActive ? 0.9 : 0.35;
      const strokeWeight = isActive ? 2 : 1;

      const existing = polys.get(zone.id);
      if (existing) {
        existing.setPath(path);
        existing.setOptions({ fillColor, strokeColor, fillOpacity, strokeOpacity, strokeWeight });
        existing.setMap(map);
      } else {
        const poly = new google.maps.Polygon({
          paths: path,
          fillColor,
          strokeColor,
          fillOpacity,
          strokeOpacity,
          strokeWeight,
          clickable: false,
          map,
        });
        polys.set(zone.id, poly);
      }
    }
  }, [mapReady, zones, activeZoneId]);

  // Detach polygons on unmount.
  useEffect(() => {
    const polys = polygonsRef.current;
    return () => {
      for (const poly of polys.values()) poly.setMap(null);
      polys.clear();
    };
  }, []);

  // External lat/lng changes (saved-address picker, "use my location") → pan the map.
  useEffect(() => {
    if (!mapReady || lat == null || lng == null) return;
    if (skipNextExternalSync.current) {
      skipNextExternalSync.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    const pos = { lat, lng };
    map.panTo(pos);
    map.setZoom(16);
    triggerPinSettle();
  }, [lat, lng, mapReady, triggerPinSettle]);

  const handleAutocompleteSelect = useCallback(
    (result: AddressAutocompleteResult) => {
      const map = mapRef.current;
      if (map) {
        const p = { lat: result.lat, lng: result.lng };
        map.panTo(p);
        map.setZoom(17);
      }
      applyLocation({ lat: result.lat, lng: result.lng }, result.address);
      triggerPinSettle();
    },
    [applyLocation, triggerPinSettle],
  );

  const pill = useMemo(() => {
    if (!zoneStatus) return null;
    if (zoneStatus.kind === 'idle') {
      if (!zonePillChecking) return null;
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          {zonePillChecking}
        </span>
      );
    }
    if (zoneStatus.kind === 'in') {
      const label =
        (zonePillIn ?? '{zone} · ₼{fee}')
          .replace('{zone}', zoneStatus.zoneName)
          .replace('{fee}', formatMoney(zoneStatus.fee));
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cockpit-500/40 bg-cockpit-500/10 px-2.5 py-1 text-xs font-medium text-cockpit-200">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {label}
        </span>
      );
    }
    // out
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-200">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        {zonePillOut ?? unavailableLabel}
      </span>
    );
  }, [zoneStatus, zonePillIn, zonePillOut, zonePillChecking, unavailableLabel]);

  // Fallback for environments without a Maps API key (local dev, preview without secrets).
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
      <AddressAutocomplete
        apiKey={apiKey}
        initialQuery={address}
        onSelect={handleAutocompleteSelect}
        placeholder={searchPlaceholder}
        noResultsLabel={noResultsLabel}
        searchFailedLabel={searchFailedLabel}
        selectFailedLabel={selectFailedLabel}
        mapsLoadFailedLabel={mapsLoadFailedLabel}
      />

      {pill ? <div className="flex">{pill}</div> : null}

      <div className="relative overflow-hidden rounded-xl border border-white/10">
        {onUseLocation ? (
          <button
            type="button"
            onClick={onUseLocation}
            aria-label={useLocationLabel ?? pinHint}
            title={useLocationLabel ?? pinHint}
            className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-slate-950/70 text-white backdrop-blur transition-colors hover:bg-slate-900/85"
          >
            <Navigation className="h-4 w-4" />
          </button>
        ) : null}
        {loading ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 bg-slate-900/80">
            <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
            <span className="text-xs text-slate-500">{loadingLabel}</span>
          </div>
        ) : null}
        <div
          ref={mapElRef}
          className={`h-52 w-full min-h-[13rem] bg-slate-800 ${loading ? 'hidden' : ''}`}
          style={{ touchAction: 'none' }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div
            ref={pinWrapRef}
            className="absolute left-1/2 top-1/2 z-[5]"
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            <div className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]">
              <svg
                width="34"
                height="42"
                viewBox="0 0 34 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M17 1.5C8.716 1.5 2 8.216 2 16.5C2 27.409 13.13 36.71 16.006 39.018C16.59 39.486 17.41 39.486 17.994 39.018C20.87 36.71 32 27.409 32 16.5C32 8.216 25.284 1.5 17 1.5Z"
                  fill="#D7263D"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle cx="17" cy="16.5" r="5.6" fill="#FFFFFF" />
                <circle cx="17" cy="16.5" r="2.2" fill="#D7263D" />
              </svg>
            </div>
          </div>
        </div>
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
