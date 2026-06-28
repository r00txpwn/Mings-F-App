import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapIcon, RefreshCw, Settings as SettingsIcon, Truck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PageHeader } from '../components/cockpit';
import { useDeliveryAdmin } from './delivery/useDeliveryAdmin';
import { ZonesTab, type ZonesTabTranslations } from './delivery/ZonesTab';
import { SettingsTab, type SettingsTabTranslations } from './delivery/SettingsTab';
import { DispatchTab, type DispatchTabTranslations } from './delivery/DispatchTab';

type Tab = 'zones' | 'settings' | 'dispatch';

const TAB_QUERY_KEY = 'tab';

function readTabFromLocation(): Tab {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(TAB_QUERY_KEY);
  if (raw === 'zones' || raw === 'settings' || raw === 'dispatch') return raw;
  return 'zones';
}

function writeTabToLocation(tab: Tab) {
  const params = new URLSearchParams(window.location.search);
  if (tab === 'zones') params.delete(TAB_QUERY_KEY);
  else params.set(TAB_QUERY_KEY, tab);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
}

export function DeliveryScreen() {
  const { t } = useLanguage();
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const admin = useDeliveryAdmin();

  const [tab, setTab] = useState<Tab>(() => readTabFromLocation());
  const [toast, setToast] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    writeTabToLocation(tab);
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showError = useCallback((message: string) => setToast({ kind: 'error', message }), []);
  const showInfo = useCallback((message: string) => setToast({ kind: 'info', message }), []);

  const zonesT = useMemo<ZonesTabTranslations>(
    () => ({
      deleteLabel: t.delete,
      title: t.deliveryZonesTitle,
      description: t.deliveryZonesDescription,
      newButton: t.deliveryZonesNew,
      emptyTitle: t.deliveryZonesEmptyTitle,
      emptyHint: t.deliveryZonesEmptyHint,
      colName: t.deliveryZonesColName,
      colVertices: t.deliveryZonesColVertices,
      colFee: t.deliveryZonesColFee,
      colMinOrder: t.deliveryZonesColMinOrder,
      colActive: t.deliveryZonesColActive,
      colActions: t.deliveryZonesColActions,
      newZoneTitle: t.deliveryZoneNewTitle,
      editZoneTitle: t.deliveryZoneEditTitle,
      fieldName: t.deliveryZoneFieldName,
      fieldFee: t.deliveryZoneFieldFee,
      fieldMinOrder: t.deliveryZoneFieldMinOrder,
      fieldFreeThreshold: t.deliveryZoneFieldFreeThreshold,
      fieldSortOrder: t.deliveryZoneFieldSortOrder,
      fieldActive: t.deliveryZoneFieldActive,
      fieldPolygon: t.deliveryZoneFieldPolygon,
      polygonHint: t.deliveryZonePolygonHint,
      clearShape: t.deliveryZoneClearShape,
      polygonRequired: t.deliveryZonePolygonRequired,
      preview: t.deliveryZonePreview,
      previewLoading: t.deliveryZonePreviewLoading,
      previewUnavailable: t.deliveryZonePreviewUnavailable,
      previewEmpty: t.deliveryZonePreviewEmpty,
      vertices: t.deliveryZoneVertices,
      cancel: t.cancel,
      save: t.deliveryZoneSave,
      saving: t.deliveryZoneSaving,
      toastSaveError: t.deliveryZoneSaveError,
      toastDeleteConfirm: t.deliveryZoneDeleteConfirm,
      toastDeleteError: t.deliveryZoneDeleteError,
      toastToggleError: t.deliveryZoneToggleError,
    }),
    [t],
  );

  const settingsT = useMemo<SettingsTabTranslations>(
    () => ({
      title: t.deliverySettingsTitle,
      description: t.deliverySettingsDescription,
      kitchenOpen: t.deliverySettingsKitchenOpen,
      kitchenOpenHint: t.deliverySettingsKitchenOpenHint,
      deliveryEnabled: t.deliverySettingsDeliveryEnabled,
      takeawayEnabled: t.deliverySettingsTakeawayEnabled,
      globalMinOrder: t.deliverySettingsGlobalMinOrder,
      defaultPrep: t.deliverySettingsDefaultPrep,
      defaultPrepHint: t.deliverySettingsDefaultPrepHint,
      globalFreeThreshold: t.deliverySettingsGlobalFreeThreshold,
      kitchenLocationTitle: t.deliverySettingsKitchenLocationTitle,
      kitchenLocationHint: t.deliverySettingsKitchenLocationHint,
      kitchenLatitude: t.deliverySettingsKitchenLatitude,
      kitchenLongitude: t.deliverySettingsKitchenLongitude,
      kitchenLocationInvalid: t.deliverySettingsKitchenLocationInvalid,
      dispatchMode: t.deliverySettingsDispatchMode,
      dispatchAuto: t.deliverySettingsDispatchAuto,
      dispatchManual: t.deliverySettingsDispatchManual,
      hours: t.deliverySettingsHours,
      hoursHint: t.deliverySettingsHoursHint,
      closed: t.deliverySettingsClosed,
      open: t.deliverySettingsOpenAt,
      close: t.deliverySettingsCloseAt,
      save: t.deliverySettingsSave,
      saving: t.deliverySettingsSaving,
      saved: t.deliverySettingsSaved,
      saveError: t.deliverySettingsSaveError,
      closingSoonMinutesLabel: t.deliverySettingsClosingSoonLabel,
      closingSoonMinutesHint: t.deliverySettingsClosingSoonHint,
      pauseActive: t.deliverySettingsPauseActive,
      cancelPause: t.deliverySettingsCancelPause,
      hoursInvalid: t.deliverySettingsHoursInvalid,
      statusOpenNow: t.deliverySettingsStatusOpenNow,
      statusClosedNow: t.deliverySettingsStatusClosedNow,
      statusPaused: t.deliverySettingsStatusPaused,
      todayHours: t.deliverySettingsTodayHours,
      todayClosed: t.deliverySettingsTodayClosed,
      specialDayBadge: t.deliverySettingsSpecialDayBadge,
      acceptingOrders: t.deliverySettingsAcceptingOrders,
      stoppedOrders: t.deliverySettingsStoppedOrders,
      acceptingOrdersHint: t.deliverySettingsAcceptingOrdersHint,
      stoppedOrdersHint: t.deliverySettingsStoppedOrdersHint,
      dayOpen: t.deliverySettingsDayOpen,
      weeklyHours: t.deliverySettingsWeeklyHours,
      specialDaysTitle: t.deliverySettingsSpecialDaysTitle,
      specialDaysHint: t.deliverySettingsSpecialDaysHint,
      specialDayAdd: t.deliverySettingsSpecialDayAdd,
      specialDayRemove: t.deliverySettingsSpecialDayRemove,
      specialDayDate: t.deliverySettingsSpecialDayDate,
      specialDayClosedAllDay: t.deliverySettingsSpecialDayClosedAllDay,
      specialDayCustomHours: t.deliverySettingsSpecialDayCustomHours,
      specialDayNote: t.deliverySettingsSpecialDayNote,
      specialDayNoteHint: t.deliverySettingsSpecialDayNoteHint,
      specialDayNoteEn: t.deliverySettingsSpecialDayNoteEn,
      specialDayNoteAz: t.deliverySettingsSpecialDayNoteAz,
      specialDayNoteRu: t.deliverySettingsSpecialDayNoteRu,
      specialDayDuplicateDate: t.deliverySettingsSpecialDayDuplicateDate,
      specialDaysInvalid: t.deliverySettingsSpecialDaysInvalid,
      days: {
        mon: t.deliverySettingsDayMon,
        tue: t.deliverySettingsDayTue,
        wed: t.deliverySettingsDayWed,
        thu: t.deliverySettingsDayThu,
        fri: t.deliverySettingsDayFri,
        sat: t.deliverySettingsDaySat,
        sun: t.deliverySettingsDaySun,
      },
    }),
    [t],
  );

  const dispatchT = useMemo<DispatchTabTranslations>(
    () => ({
      title: t.deliveryDispatchTitle,
      description: t.deliveryDispatchDescription,
      empty: t.deliveryDispatchEmpty,
      colOrder: t.deliveryDispatchColOrder,
      colCustomer: t.deliveryDispatchColCustomer,
      colAddress: t.deliveryDispatchColAddress,
      colStatus: t.deliveryDispatchColStatus,
      colActions: t.deliveryDispatchColActions,
      noWolt: t.deliveryDispatchNoWolt,
      manuallyDispatched: t.deliveryDispatchManuallyDispatched,
      trackOpen: t.deliveryDispatchTrackOpen,
      trackCopy: t.deliveryDispatchTrackCopy,
      trackCopied: t.deliveryDispatchTrackCopied,
      actionDispatch: t.deliveryDispatchActionDispatch,
      actionMarkManual: t.deliveryDispatchActionMarkManual,
      actionCancel: t.deliveryDispatchActionCancel,
      toastInvokeError: t.deliveryDispatchInvokeError,
      toastInvokeOk: t.deliveryDispatchInvokeOk,
    }),
    [t],
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'zones', label: t.deliveryTabZones, icon: <MapIcon className="h-4 w-4" /> },
    { id: 'settings', label: t.deliveryTabSettings, icon: <SettingsIcon className="h-4 w-4" /> },
    { id: 'dispatch', label: t.deliveryTabDispatch, icon: <Truck className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        eyebrow={t.operations}
        title={t.deliveryScreenTitle}
        description={t.deliveryScreenDescription}
        icon={Truck}
        actions={
          <button
            type="button"
            onClick={() => void admin.refreshAll()}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-cockpit-400"
            aria-label={t.deliveryRefresh}
          >
            <RefreshCw className={`h-5 w-5 ${admin.loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === tabItem.id
                ? 'bg-cockpit-500 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'zones' ? (
        <ZonesTab
          zones={admin.zones}
          apiKey={apiKey}
          loading={admin.loading}
          upsertZone={admin.upsertZone}
          setZoneActive={admin.setZoneActive}
          deleteZone={admin.deleteZone}
          refresh={admin.refreshAll}
          t={zonesT}
          onError={showError}
        />
      ) : null}

      {tab === 'settings' ? (
        <SettingsTab
          settings={admin.settings}
          loading={admin.loading}
          updateSettings={admin.updateSettings}
          t={settingsT}
          onError={showError}
          onSaved={showInfo}
        />
      ) : null}

      {tab === 'dispatch' ? (
        <DispatchTab
          orders={admin.dispatchOrders}
          loading={admin.loading}
          refresh={admin.refreshAll}
          t={dispatchT}
          onError={showError}
          onInfo={showInfo}
        />
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
            toast.kind === 'error'
              ? 'border-rose-500/40 bg-rose-500/15 text-rose-100'
              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
