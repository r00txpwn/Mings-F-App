import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { OrderAddressMap, type ZonePillStatus } from '../order/OrderAddressMap';
import { findZoneForPoint } from '../services/deliveryZones';
import { supabase } from '../lib/supabase';
import type { DeliveryZoneRow } from '../types/online';

interface PosDeliveryPanelProps {
  address: string;
  lat: number | null;
  lng: number | null;
  apartment: string;
  floor: string;
  deliveryNotes: string;
  onAddressChange: (v: string) => void;
  onLocationChange: (next: { lat: number; lng: number; address: string }) => void;
  onApartmentChange: (v: string) => void;
  onFloorChange: (v: string) => void;
  onDeliveryNotesChange: (v: string) => void;
}

export function PosDeliveryPanel({
  address,
  lat,
  lng,
  apartment,
  floor,
  deliveryNotes,
  onAddressChange,
  onLocationChange,
  onApartmentChange,
  onFloorChange,
  onDeliveryNotesChange,
}: PosDeliveryPanelProps) {
  const { t } = useLanguage();
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('delivery_zones').select('*').eq('is_active', true);
      setZones((data ?? []) as DeliveryZoneRow[]);
    })();
  }, []);

  const zoneStatus: ZonePillStatus = useMemo(() => {
    if (lat == null || lng == null) return { kind: 'idle' };
    const matched = findZoneForPoint(lng, lat, zones);
    if (!matched) return { kind: 'out' };
    return {
      kind: 'in',
      zoneId: matched.id,
      zoneName: matched.name,
      fee: Number(matched.delivery_fee ?? 0),
    };
  }, [lat, lng, zones]);

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="text-sm font-semibold text-cockpit-200">{t.posDeliveryPanelTitle}</h3>
      <OrderAddressMap
        apiKey={mapsKey}
        lat={lat}
        lng={lng}
        address={address}
        onLocationChange={onLocationChange}
        onAddressChange={onAddressChange}
        searchPlaceholder={t.posMapSearch}
        pinHint={t.posMapPinHint}
        loadingLabel={t.pleaseWait}
        unavailableLabel={t.posMapsUnavailable}
        addressLabel={t.orderAddressLabel}
        zones={zones}
        zoneStatus={zoneStatus}
        zonePillIn={t.orderZonePillIn}
        zonePillOut={t.posOutsideZone}
        zonePillChecking={t.orderZonePillChecking}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">{t.orderAddressApartment}</span>
          <input
            value={apartment}
            onChange={(e) => onApartmentChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">{t.orderAddressFloor}</span>
          <input
            value={floor}
            onChange={(e) => onFloorChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">{t.orderDeliveryNotesLabel}</span>
        <textarea
          value={deliveryNotes}
          onChange={(e) => onDeliveryNotesChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
        />
      </label>
      {zoneStatus.kind === 'out' ? (
        <p className="text-sm text-rose-300">{t.posOutsideZone}</p>
      ) : null}
    </div>
  );
}
