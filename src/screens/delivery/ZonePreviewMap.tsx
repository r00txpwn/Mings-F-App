import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadGoogleMapsScript } from '../../order/googleMapsLoader';
import type { NormalisedPolygon } from './validateZoneGeoJson';

const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

interface ZonePreviewMapProps {
  apiKey: string | undefined;
  polygon: NormalisedPolygon | null;
  loadingLabel: string;
  unavailableLabel: string;
  emptyLabel: string;
}

/**
 * Read-only map preview used inside the zone editor dialog. Draws the polygon
 * the admin pasted (after validation) and auto-fits the viewport to its bounds.
 * Reuses `loadGoogleMapsScript` so we don't load Maps twice.
 */
export function ZonePreviewMap({
  apiKey,
  polygon,
  loadingLabel,
  unavailableLabel,
  emptyLabel,
}: ZonePreviewMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey?.trim()) {
      setReady(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        await loadGoogleMapsScript(apiKey.trim());
        if (cancelled || !mapElRef.current) return;
        const map = new google.maps.Map(mapElRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'cooperative',
        });
        mapRef.current = map;
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Map error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current = null;
      polygonRef.current = null;
      setReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    if (!polygon) return;

    const ring = polygon.coordinates[0];
    if (!ring || ring.length < 3) return;
    const path: google.maps.LatLngLiteral[] = ring.map(([lng, lat]) => ({
      lat,
      lng,
    }));

    const poly = new google.maps.Polygon({
      paths: path,
      fillColor: '#14b8a6',
      strokeColor: '#14b8a6',
      fillOpacity: 0.18,
      strokeOpacity: 0.9,
      strokeWeight: 2,
      clickable: false,
      map,
    });
    polygonRef.current = poly;

    const bounds = new google.maps.LatLngBounds();
    for (const point of path) bounds.extend(point);
    map.fitBounds(bounds, 24);
  }, [ready, polygon]);

  if (!apiKey?.trim()) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
        {unavailableLabel}
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
      <div ref={mapElRef} className="absolute inset-0" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/60 text-xs text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </div>
      ) : null}
      {!polygon && !loading ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
          {emptyLabel}
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-rose-500/20 px-3 py-1 text-[11px] text-rose-200 backdrop-blur">
          {error}
        </div>
      ) : null}
    </div>
  );
}
