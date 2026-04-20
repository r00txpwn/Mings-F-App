import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadGoogleMapsScript } from '../../order/googleMapsLoader';
import type { NormalisedPolygon } from './validateZoneGeoJson';

const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

interface ZoneDrawingMapProps {
  apiKey: string | undefined;
  polygon: NormalisedPolygon | null;
  onPolygonChange: (next: NormalisedPolygon | null) => void;
  loadingLabel: string;
  unavailableLabel: string;
  emptyLabel: string;
  hintLabel: string;
}

function normalisePath(path: google.maps.MVCArray<google.maps.LatLng>): number[][] {
  const ring: number[][] = [];
  for (let i = 0; i < path.getLength(); i += 1) {
    const p = path.getAt(i);
    ring.push([p.lng(), p.lat()]);
  }
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

function toPolygonShape(poly: google.maps.Polygon): NormalisedPolygon | null {
  const path = poly.getPath();
  const ring = normalisePath(path);
  if (ring.length < 4) return null;
  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

function fitPolygonBounds(map: google.maps.Map, polygon: NormalisedPolygon) {
  const bounds = new google.maps.LatLngBounds();
  const ring = polygon.coordinates[0] ?? [];
  for (const [lng, lat] of ring) {
    bounds.extend({ lat, lng });
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds, 24);
}

export function ZoneDrawingMap({
  apiKey,
  polygon,
  onPolygonChange,
  loadingLabel,
  unavailableLabel,
  emptyLabel,
  hintLabel,
}: ZoneDrawingMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAppliedRef = useRef<string>('null');

  const removePathListeners = () => {
    for (const listener of listenersRef.current) {
      listener.remove();
    }
    listenersRef.current = [];
  };

  const emitPolygon = () => {
    const current = polygonRef.current;
    const next = current ? toPolygonShape(current) : null;
    const nextSerial = JSON.stringify(next);
    if (nextSerial !== lastAppliedRef.current) {
      lastAppliedRef.current = nextSerial;
      onPolygonChange(next);
    }
  };

  const attachEditablePolygon = (poly: google.maps.Polygon) => {
    removePathListeners();
    polygonRef.current?.setMap(null);
    polygonRef.current = poly;
    poly.setEditable(true);
    poly.setDraggable(false);
    if (mapRef.current) poly.setMap(mapRef.current);

    const path = poly.getPath();
    listenersRef.current = [
      path.addListener('insert_at', emitPolygon),
      path.addListener('remove_at', emitPolygon),
      path.addListener('set_at', emitPolygon),
    ];
  };

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
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        const drawing = new google.maps.drawing.DrawingManager({
          drawingMode: polygon ? null : google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: '#14b8a6',
            strokeColor: '#14b8a6',
            fillOpacity: 0.18,
            strokeOpacity: 0.9,
            strokeWeight: 2,
            editable: true,
            clickable: true,
          },
        });
        drawing.setMap(map);
        drawingRef.current = drawing;

        drawing.addListener('overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
          if (event.type !== google.maps.drawing.OverlayType.POLYGON) return;
          const drawn = event.overlay as google.maps.Polygon;
          attachEditablePolygon(drawn);
          drawing.setDrawingMode(null);
          const next = toPolygonShape(drawn);
          const serial = JSON.stringify(next);
          lastAppliedRef.current = serial;
          onPolygonChange(next);
          if (next && mapRef.current) fitPolygonBounds(mapRef.current, next);
        });

        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Map error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      removePathListeners();
      polygonRef.current?.setMap(null);
      polygonRef.current = null;
      drawingRef.current?.setMap(null);
      drawingRef.current = null;
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const serial = JSON.stringify(polygon);
    if (serial === lastAppliedRef.current) return;
    lastAppliedRef.current = serial;

    if (!polygon) {
      removePathListeners();
      polygonRef.current?.setMap(null);
      polygonRef.current = null;
      drawingRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      map.panTo(DEFAULT_CENTER);
      map.setZoom(12);
      return;
    }

    const path = (polygon.coordinates[0] ?? []).map(([lng, lat]) => ({ lat, lng }));
    if (path.length < 3) return;

    if (polygonRef.current) {
      polygonRef.current.setPath(path);
      polygonRef.current.setMap(map);
    } else {
      const poly = new google.maps.Polygon({
        paths: path,
        fillColor: '#14b8a6',
        strokeColor: '#14b8a6',
        fillOpacity: 0.18,
        strokeOpacity: 0.9,
        strokeWeight: 2,
      });
      attachEditablePolygon(poly);
    }
    drawingRef.current?.setDrawingMode(null);
    fitPolygonBounds(map, polygon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, polygon]);

  if (!apiKey?.trim()) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
        {unavailableLabel}
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
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
      <div className="pointer-events-none absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-slate-950/70 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
        {hintLabel}
      </div>
      {error ? (
        <div className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-rose-500/20 px-3 py-1 text-[11px] text-rose-200 backdrop-blur">
          {error}
        </div>
      ) : null}
    </div>
  );
}
