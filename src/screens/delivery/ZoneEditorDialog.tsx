import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import type { DeliveryZoneRow } from '../../types/online';
import {
  validateZoneGeoJson,
  type NormalisedPolygon,
} from './validateZoneGeoJson';
import { ZonePreviewMap } from './ZonePreviewMap';

export interface ZoneEditorTranslations {
  newZoneTitle: string;
  editZoneTitle: string;
  fieldName: string;
  fieldFee: string;
  fieldMinOrder: string;
  fieldFreeThreshold: string;
  fieldSortOrder: string;
  fieldActive: string;
  fieldPolygon: string;
  polygonHint: string;
  openGeoJsonIo: string;
  exportGeoJson: string;
  copied: string;
  preview: string;
  previewLoading: string;
  previewUnavailable: string;
  previewEmpty: string;
  errorEmpty: string;
  errorJson: string;
  errorPolygon: string;
  errorPoints: string;
  errorTooFew: string;
  autoClosed: string;
  vertices: string;
  cancel: string;
  save: string;
  saving: string;
}

interface ZoneEditorDialogProps {
  apiKey: string | undefined;
  zone: DeliveryZoneRow | null;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (next: {
    id?: string;
    name: string;
    polygon: NormalisedPolygon;
    delivery_fee: number;
    min_order_amount: number;
    free_delivery_threshold: number | null;
    sort_order: number;
    is_active: boolean;
  }) => void;
  t: ZoneEditorTranslations;
}

function formatPolygonText(polygon: DeliveryZoneRow['polygon'] | null): string {
  if (!polygon) return '';
  try {
    return JSON.stringify(polygon, null, 2);
  } catch {
    return '';
  }
}

export function ZoneEditorDialog({
  apiKey,
  zone,
  open,
  saving,
  onCancel,
  onSave,
  t,
}: ZoneEditorDialogProps) {
  const [name, setName] = useState('');
  const [fee, setFee] = useState('0');
  const [minOrder, setMinOrder] = useState('0');
  const [freeThreshold, setFreeThreshold] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [polygonText, setPolygonText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(zone?.name ?? '');
    setFee(String(zone?.delivery_fee ?? 0));
    setMinOrder(String(zone?.min_order_amount ?? 0));
    setFreeThreshold(zone?.free_delivery_threshold != null ? String(zone.free_delivery_threshold) : '');
    setSortOrder(String(zone?.sort_order ?? 0));
    setActive(zone?.is_active ?? true);
    setPolygonText(formatPolygonText(zone?.polygon ?? null));
    setCopied(false);
  }, [open, zone]);

  const validation = useMemo(() => validateZoneGeoJson(polygonText), [polygonText]);

  const errorMessage = useMemo(() => {
    if (!polygonText.trim()) return null;
    if (validation.ok) return null;
    switch (validation.error) {
      case 'invalid_json':
        return t.errorJson;
      case 'not_polygon':
      case 'no_ring':
        return t.errorPolygon;
      case 'invalid_point':
        return t.errorPoints;
      case 'too_few_points':
        return t.errorTooFew;
      default:
        return t.errorJson;
    }
  }, [validation, polygonText, t]);

  const polygonForPreview: NormalisedPolygon | null = validation.ok ? validation.polygon : null;

  const canSave = !saving && name.trim().length > 0 && validation.ok;

  const handleCopy = async () => {
    if (!validation.ok) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(validation.polygon, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSubmit = () => {
    if (!validation.ok) return;
    onSave({
      id: zone?.id,
      name: name.trim(),
      polygon: validation.polygon,
      delivery_fee: Number(fee) || 0,
      min_order_amount: Number(minOrder) || 0,
      free_delivery_threshold: freeThreshold.trim() === '' ? null : Number(freeThreshold) || 0,
      sort_order: Number(sortOrder) || 0,
      is_active: active,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={saving ? undefined : onCancel}
        aria-hidden
      />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            {zone ? t.editZoneTitle : t.newZoneTitle}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 disabled:opacity-40"
            aria-label={t.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="font-medium text-slate-400">{t.fieldName}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                placeholder="Baku Central"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-slate-400">{t.fieldSortOrder}</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-slate-400">{t.fieldFee} (₼)</span>
              <input
                type="number"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-slate-400">{t.fieldMinOrder} (₼)</span>
              <input
                type="number"
                step="0.01"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-slate-400">{t.fieldFreeThreshold} (₼)</span>
              <input
                type="number"
                step="0.01"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs">
              <span className="font-medium text-slate-300">{t.fieldActive}</span>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5 cursor-pointer accent-cockpit-500"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{t.fieldPolygon}</span>
              <div className="flex items-center gap-1">
                <a
                  href="https://geojson.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t.openGeoJsonIo}
                </a>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!validation.ok}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? t.copied : t.exportGeoJson}
                </button>
              </div>
            </div>
            <textarea
              value={polygonText}
              onChange={(e) => setPolygonText(e.target.value)}
              spellCheck={false}
              rows={8}
              placeholder='{"type":"Polygon","coordinates":[[[49.84,40.38],[49.92,40.38],[49.92,40.42],[49.84,40.42],[49.84,40.38]]]}'
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 font-mono text-[11px] leading-snug text-slate-100 focus:border-cockpit-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">{t.polygonHint}</p>

            {polygonText.trim() && validation.ok ? (
              <p className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {validation.vertices} {t.vertices}
                {validation.autoClosed ? ` · ${t.autoClosed}` : ''}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-400">{t.preview}</span>
            <ZonePreviewMap
              apiKey={apiKey}
              polygon={polygonForPreview}
              loadingLabel={t.previewLoading}
              unavailableLabel={t.previewUnavailable}
              emptyLabel={t.previewEmpty}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-slate-950/40 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-cockpit-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cockpit-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
