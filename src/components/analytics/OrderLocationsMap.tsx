import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadGoogleMapsScript } from '../../order/googleMapsLoader';
import { BAKU_MAP_BOUNDS, BAKU_MAP_CENTER } from '../../lib/bakuMapBounds';
import type { OrderLocationPoint } from '../../services/analytics/orderLocationService';

const SOURCE_DOT_COLOR: Record<string, string> = {
  online_delivery: '#fbbf24',
  pos_delivery: '#3b82f6',
};

function dotColor(source: string): string {
  return SOURCE_DOT_COLOR[source] ?? '#94a3b8';
}

interface OrderLocationsMapProps {
  apiKey: string | undefined;
  points: OrderLocationPoint[];
  loadingLabel: string;
  unavailableLabel: string;
  emptyLabel: string;
  hintLabel: string;
  orderLabel: string;
  totalLabel: string;
}

export function OrderLocationsMap({
  apiKey,
  points,
  loadingLabel,
  unavailableLabel,
  emptyLabel,
  hintLabel,
  orderLabel,
  totalLabel,
}: OrderLocationsMapProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
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
          center: BAKU_MAP_CENTER,
          zoom: 12,
          restriction: {
            latLngBounds: BAKU_MAP_BOUNDS,
            strictBounds: true,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

        const bounds = new google.maps.LatLngBounds(
          { lat: BAKU_MAP_BOUNDS.south, lng: BAKU_MAP_BOUNDS.west },
          { lat: BAKU_MAP_BOUNDS.north, lng: BAKU_MAP_BOUNDS.east },
        );
        map.fitBounds(bounds, 0);

        const dataLayer = new google.maps.Data({ map });
        dataLayerRef.current = dataLayer;
        infoWindowRef.current = new google.maps.InfoWindow();
        mapRef.current = map;
        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Map error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      dataLayerRef.current?.setMap(null);
      dataLayerRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
      setReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const dataLayer = dataLayerRef.current;
    const infoWindow = infoWindowRef.current;
    if (!ready || !map || !dataLayer || !infoWindow) return;

    clickListenerRef.current?.remove();
    dataLayer.forEach((feature) => dataLayer.remove(feature));

    if (points.length === 0) {
      map.panTo(BAKU_MAP_CENTER);
      map.setZoom(12);
      return;
    }

    const features = points.map((point) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [point.lng, point.lat],
      },
      properties: {
        id: point.id,
        source: point.source,
        displayNumber: point.displayNumber ?? '',
        address: point.address ?? '',
        totalPrice: point.totalPrice,
        saleDate: point.saleDate,
      },
    }));

    dataLayer.addGeoJson({
      type: 'FeatureCollection',
      features,
    });

    dataLayer.setStyle((feature) => {
      const source = String(feature.getProperty('source') ?? '');
      const color = dotColor(source);
      return {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#0f172a',
          strokeOpacity: 0.35,
          strokeWeight: 1,
          scale: 6,
        },
      };
    });

    clickListenerRef.current = dataLayer.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const feature = event.feature;
      if (!feature) return;
      const displayNumber = String(feature.getProperty('displayNumber') ?? '');
      const address = String(feature.getProperty('address') ?? '');
      const totalPrice = Number(feature.getProperty('totalPrice') ?? 0);
      const saleDate = String(feature.getProperty('saleDate') ?? '');
      const source = String(feature.getProperty('source') ?? '');

      const title = displayNumber ? `${orderLabel} ${displayNumber}` : orderLabel;
      const when = saleDate ? new Date(saleDate).toLocaleString() : '';
      infoWindow.setContent(
        `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.45;max-width:220px;color:#0f172a">
          <div style="font-weight:700;margin-bottom:4px">${title}</div>
          ${when ? `<div style="opacity:0.75;margin-bottom:4px">${when}</div>` : ''}
          ${address ? `<div style="margin-bottom:4px">${address}</div>` : ''}
          <div style="font-weight:600">${totalLabel}: ₼${totalPrice.toFixed(2)}</div>
          <div style="opacity:0.65;margin-top:4px;font-size:11px">${source}</div>
        </div>`,
      );
      if (event.latLng) infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    });

    const bounds = new google.maps.LatLngBounds();
    for (const point of points) {
      bounds.extend({ lat: point.lat, lng: point.lng });
    }
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
    }
  }, [ready, points, orderLabel, totalLabel]);

  if (!apiKey?.trim()) {
    return (
      <div className="flex h-[min(520px,70vh)] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
        {unavailableLabel}
      </div>
    );
  }

  return (
    <div className="relative h-[min(520px,70vh)] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/40">
      <div ref={mapElRef} className="absolute inset-0" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/40 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          {loadingLabel}
        </div>
      ) : null}
      {!loading && points.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[90%] rounded-full bg-slate-950/75 px-4 py-2 text-center text-xs text-slate-200 backdrop-blur">
          {emptyLabel}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit max-w-[90%] rounded-full bg-slate-950/75 px-4 py-2 text-center text-xs text-slate-200 backdrop-blur">
        {hintLabel}
      </div>
      {error ? (
        <div className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-rose-500/20 px-4 py-2 text-xs text-rose-100 backdrop-blur">
          {error}
        </div>
      ) : null}
    </div>
  );
}
