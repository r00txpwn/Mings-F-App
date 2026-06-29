import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, ScrollText } from 'lucide-react';
import { PageHeader } from '../components/cockpit';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import type { StaffSurface } from '../lib/logAuthEvent';

type AuditTab = 'actions' | 'changes' | 'signins';

interface AdminAuditRow {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  resource_table: string;
  resource_id: string | null;
  payload: unknown;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string;
  action: string;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
}

interface AuthEventRow {
  id: string;
  user_id: string | null;
  event_type: string;
  surface: string | null;
  device_type: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function payloadPreview(payload: unknown): string {
  if (payload == null) return '—';
  try {
    const s = JSON.stringify(payload);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  } catch {
    return '—';
  }
}

export function AuditLogScreen() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<AuditTab>('actions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminRows, setAdminRows] = useState<AdminAuditRow[]>([]);
  const [changeRows, setChangeRows] = useState<AuditLogRow[]>([]);
  const [authRows, setAuthRows] = useState<AuthEventRow[]>([]);
  const [emailByUserId, setEmailByUserId] = useState<Record<string, string>>({});

  const surfaceLabel = useCallback(
    (surface: string | null | undefined) => {
      const key = surface as StaffSurface | null;
      switch (key) {
        case 'cockpit':
          return t.auditLogSurfaceCockpit;
        case 'pos':
          return t.auditLogSurfacePos;
        case 'kds':
          return t.auditLogSurfaceKds;
        case 'kiosk':
          return t.auditLogSurfaceKiosk;
        case 'order-manager':
          return t.auditLogSurfaceOrderManager;
        default:
          return surface ?? '—';
      }
    },
    [t]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [adminRes, changeRes, authRes] = await Promise.all([
      supabase
        .from('admin_audit_log')
        .select('id, actor_id, actor_role, action, resource_table, resource_id, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from('audit_logs')
        .select('id, user_id, table_name, record_id, action, old_data, new_data, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
      supabase
        .from('auth_events')
        .select('id, user_id, event_type, surface, device_type, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
    ]);

    if (adminRes.error || changeRes.error || authRes.error) {
      setError(
        adminRes.error?.message ?? changeRes.error?.message ?? authRes.error?.message ?? t.errorOccurred
      );
      setLoading(false);
      return;
    }

    const admin = (adminRes.data ?? []) as AdminAuditRow[];
    const changes = (changeRes.data ?? []) as AuditLogRow[];
    const auth = (authRes.data ?? []) as AuthEventRow[];

    setAdminRows(admin);
    setChangeRows(changes);
    setAuthRows(auth);

    const ids = new Set<string>();
    for (const r of admin) if (r.actor_id) ids.add(r.actor_id);
    for (const r of changes) if (r.user_id) ids.add(r.user_id);
    for (const r of auth) if (r.user_id) ids.add(r.user_id);

    if (ids.size > 0) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, username')
        .in('id', Array.from(ids));
      const map: Record<string, string> = {};
      for (const p of profiles ?? []) {
        if (p.id && p.username) map[p.id] = p.username;
      }
      setEmailByUserId(map);
    } else {
      setEmailByUserId({});
    }

    setLoading(false);
  }, [t.errorOccurred]);

  useEffect(() => {
    void load();
  }, [load]);

  const who = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) return '—';
      return emailByUserId[userId] ?? shortId(userId);
    },
    [emailByUserId]
  );

  const tabs = useMemo(
    () =>
      [
        { id: 'actions' as const, label: t.auditLogTabActions, count: adminRows.length },
        { id: 'changes' as const, label: t.auditLogTabChanges, count: changeRows.length },
        { id: 'signins' as const, label: t.auditLogTabSignIns, count: authRows.length },
      ],
    [adminRows.length, authRows.length, changeRows.length, t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.auditLogTitle}
        description={t.auditLogSubtitle}
        icon={ScrollText}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === item.id
                ? 'bg-cockpit-600 text-white dark:bg-cockpit-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {item.label}
            <span className="ml-1.5 tabular-nums opacity-70">({item.count})</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
        </div>
      ) : (
        <div className="cockpit-panel overflow-x-auto">
          {tab === 'actions' && (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWhen}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWho}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColAction}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColResource}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColDetails}</th>
                </tr>
              </thead>
              <tbody>
                {adminRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t.auditLogEmpty}
                    </td>
                  </tr>
                ) : (
                  adminRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatWhen(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{who(row.actor_id)}</div>
                        {row.actor_role ? (
                          <div className="text-xs text-slate-500">{row.actor_role}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-cockpit-600 dark:text-cockpit-400">{row.action}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.resource_table}</div>
                        <div className="font-mono text-xs text-slate-500">{shortId(row.resource_id)}</div>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-slate-500">{payloadPreview(row.payload)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'changes' && (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWhen}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWho}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColAction}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColResource}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColDetails}</th>
                </tr>
              </thead>
              <tbody>
                {changeRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t.auditLogEmpty}
                    </td>
                  </tr>
                ) : (
                  changeRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatWhen(row.created_at)}</td>
                      <td className="px-4 py-3">{who(row.user_id)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.table_name}</div>
                        <div className="font-mono text-xs text-slate-500">{shortId(row.record_id)}</div>
                      </td>
                      <td className="max-w-md px-4 py-3 font-mono text-xs text-slate-500">
                        {row.action === 'DELETE' ? payloadPreview(row.old_data) : payloadPreview(row.new_data)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'signins' && (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWhen}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColWho}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColAction}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColSurface}</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.auditLogColDevice}</th>
                </tr>
              </thead>
              <tbody>
                {authRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t.auditLogEmpty}
                    </td>
                  </tr>
                ) : (
                  authRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatWhen(row.created_at)}</td>
                      <td className="px-4 py-3">{who(row.user_id)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.event_type}</td>
                      <td className="px-4 py-3">{surfaceLabel(row.surface)}</td>
                      <td className="px-4 py-3 text-slate-500">{row.device_type ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
