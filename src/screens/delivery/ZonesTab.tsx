import { useCallback, useState } from 'react';
import { Edit3, Plus, Power, Trash2 } from 'lucide-react';
import type { DeliveryZoneRow } from '../../types/online';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ZoneEditorDialog, type ZoneEditorTranslations } from './ZoneEditorDialog';

export interface ZonesTabTranslations extends ZoneEditorTranslations {
  deleteLabel: string;
  title: string;
  description: string;
  newButton: string;
  emptyTitle: string;
  emptyHint: string;
  colName: string;
  colVertices: string;
  colFee: string;
  colMinOrder: string;
  colActive: string;
  colActions: string;
  toastSaveError: string;
  toastDeleteConfirm: string;
  toastDeleteError: string;
  toastToggleError: string;
}

interface ZonesTabProps {
  zones: DeliveryZoneRow[];
  apiKey: string | undefined;
  loading: boolean;
  upsertZone: (
    zone: Partial<DeliveryZoneRow> & { name: string; polygon: DeliveryZoneRow['polygon'] },
  ) => Promise<{ error: { message: string } | null }>;
  setZoneActive: (id: string, isActive: boolean) => Promise<{ error: { message: string } | null }>;
  deleteZone: (id: string) => Promise<{ error: { message: string } | null }>;
  refresh: () => Promise<void>;
  t: ZonesTabTranslations;
  onError: (message: string) => void;
}

function vertexCount(polygon: DeliveryZoneRow['polygon'] | null | undefined): number {
  const ring = polygon?.coordinates?.[0];
  if (!Array.isArray(ring)) return 0;
  // GeoJSON closes the ring; report the visible vertex count.
  return Math.max(0, ring.length - 1);
}

export function ZonesTab({
  zones,
  apiKey,
  loading,
  upsertZone,
  setZoneActive,
  deleteZone,
  refresh,
  t,
  onError,
}: ZonesTabProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorZone, setEditorZone] = useState<DeliveryZoneRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<DeliveryZoneRow | null>(null);

  const openNew = useCallback(() => {
    setEditorZone(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((zone: DeliveryZoneRow) => {
    setEditorZone(zone);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(
    async (next: {
      id?: string;
      name: string;
      polygon: DeliveryZoneRow['polygon'];
      delivery_fee: number;
      min_order_amount: number;
      free_delivery_threshold: number | null;
      sort_order: number;
      is_active: boolean;
    }) => {
      setSaving(true);
      const { error } = await upsertZone(next);
      setSaving(false);
      if (error) {
        onError(`${t.toastSaveError}: ${error.message}`);
        return;
      }
      setEditorOpen(false);
      await refresh();
    },
    [upsertZone, refresh, onError, t.toastSaveError],
  );

  const handleToggle = useCallback(
    async (zone: DeliveryZoneRow) => {
      const { error } = await setZoneActive(zone.id, !zone.is_active);
      if (error) onError(`${t.toastToggleError}: ${error.message}`);
    },
    [setZoneActive, onError, t.toastToggleError],
  );

  const handleDelete = useCallback(
    async (zone: DeliveryZoneRow) => {
      const { error } = await deleteZone(zone.id);
      if (error) onError(`${t.toastDeleteError}: ${error.message}`);
    },
    [deleteZone, onError, t.toastDeleteError],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500">{t.description}</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-cockpit-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-cockpit-600"
        >
          <Plus className="h-4 w-4" />
          {t.newButton}
        </button>
      </div>

      {loading && zones.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-500">
          …
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
          <p className="text-sm font-medium text-slate-200">{t.emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>{t.colName}</span>
            <span>{t.colVertices}</span>
            <span>{t.colFee}</span>
            <span>{t.colMinOrder}</span>
            <span>{t.colActive}</span>
            <span>{t.colActions}</span>
          </div>
          <div className="divide-y divide-white/5">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{zone.name}</p>
                  {zone.free_delivery_threshold ? (
                    <p className="truncate text-[11px] text-slate-500">
                      {t.fieldFreeThreshold}: ₼{Number(zone.free_delivery_threshold).toFixed(2)}
                    </p>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-slate-400">{vertexCount(zone.polygon)}</span>
                <span className="font-mono text-xs text-slate-200">
                  ₼{Number(zone.delivery_fee).toFixed(2)}
                </span>
                <span className="font-mono text-xs text-slate-200">
                  ₼{Number(zone.min_order_amount).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleToggle(zone)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                    zone.is_active
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                      : 'border-slate-500/30 bg-slate-500/15 text-slate-400 hover:bg-slate-500/25'
                  }`}
                  aria-pressed={zone.is_active}
                >
                  <Power className="h-3 w-3" />
                  {zone.is_active ? 'on' : 'off'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(zone)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cockpit-400"
                    aria-label={t.editZoneTitle}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteZone(zone)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label={t.toastDeleteConfirm.replace('{name}', zone.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ZoneEditorDialog
        apiKey={apiKey}
        zone={editorZone}
        open={editorOpen}
        saving={saving}
        onCancel={() => (saving ? null : setEditorOpen(false))}
        onSave={(next) => void handleSave(next)}
        t={t}
      />
      <ConfirmDialog
        open={confirmDeleteZone !== null}
        title={t.deleteLabel}
        message={
          confirmDeleteZone
            ? t.toastDeleteConfirm.replace('{name}', confirmDeleteZone.name)
            : t.toastDeleteConfirm
        }
        confirmLabel={t.deleteLabel}
        cancelLabel={t.cancel}
        onCancel={() => setConfirmDeleteZone(null)}
        onConfirm={() => {
          if (!confirmDeleteZone) return;
          void handleDelete(confirmDeleteZone);
          setConfirmDeleteZone(null);
        }}
      />
    </div>
  );
}
