import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Navigation, XCircle } from 'lucide-react';
import { loadGoogleMapsScript } from './googleMapsLoader';
import { AddressAutocomplete, type AddressAutocompleteResult } from './AddressAutocomplete';
import type { DeliveryZoneRow } from '../types/online';

/** Baku — default map center. */
const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

/** Cockpit teal (matches tailwind `cockpit-500`). */
const ZONE_ACTIVE_COLOR = '#14b8a6';
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
}

/**
 * Delivery address picker for Baku.
 *
 * Composition:
 *  - Premium autocomplete (Places API New, session tokens, Baku bounds) on top.
 *  - Map + draggable marker below, for post-selection "fine-tune" of the exact
 *    building entrance — a common need in Baku because many addresses lack
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
}: OrderAddressMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const skipNextExternalSync = useRef(false);
  const addressRef = useRef(address);
  addressRef.current = address;

  const activeZoneId = zoneStatus?.kind === 'in' ? zoneStatus.zoneId : null;

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        });
        mapRef.current = map;

        const marker = new maps.Marker({
          map,
          position: center,
          draggable: true,
          animation: maps.Animation.DROP,
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
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat, lng };
    marker.setPosition(pos);
    map.panTo(pos);
    map.setZoom(16);
  }, [lat, lng, mapReady]);

  const handleAutocompleteSelect = useCallback(
    (result: AddressAutocompleteResult) => {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        const p = { lat: result.lat, lng: result.lng };
        marker.setPosition(p);
        map.panTo(p);
        map.setZoom(17);
      }
      applyLocation({ lat: result.lat, lng: result.lng }, result.address);
    },
    [applyLocation],
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
        (zonePillIn ?? 'Delivering to {zone} · ₼{fee}')
          .replace('{zone}', zoneStatus.zoneName)
          .replace('{fee}', Number(zoneStatus.fee).toFixed(2));
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
        {zonePillOut ?? 'Outside delivery area'}
      </span>
    );
  }, [zoneStatus, zonePillIn, zonePillOut, zonePillChecking]);

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
      />

      {pill ? <div className="flex">{pill}</div> : null}

      <div className="relative overflow-hidden rounded-xl border border-white/10">
        {onUseLocation ? (
          <button
            type="button"
            onClick={onUseLocation}
            aria-label={useLocationLabel ?? 'Use my location'}
            title={useLocationLabel ?? 'Use my location'}
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
