import { useState } from 'react';
import { Loader2, Printer, Wifi } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getPosPrintAgentUrl,
  getPosPrinterProfile,
  setPosPrintAgentUrl,
  setPosPrinterProfile,
  type PosPrinterProfile,
} from './posSettings';

export function PosSettingsTab() {
  const { t } = useLanguage();
  const [agentUrl, setAgentUrl] = useState(getPosPrintAgentUrl);
  const [profile, setProfile] = useState<PosPrinterProfile>(getPosPrinterProfile);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [busy, setBusy] = useState(false);

  const save = () => {
    setPosPrintAgentUrl(agentUrl);
    setPosPrinterProfile(profile);
  };

  const runHealth = async () => {
    save();
    setBusy(true);
    setHealthStatus('idle');
    try {
      const res = await fetch(`${agentUrl.replace(/\/$/, '')}/health`, { method: 'GET' });
      setHealthStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setHealthStatus('fail');
    } finally {
      setBusy(false);
    }
  };

  const runTestPrint = async () => {
    save();
    setBusy(true);
    setTestStatus('idle');
    try {
      const res = await fetch(`${agentUrl.replace(/\/$/, '')}/test-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      setTestStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold text-cockpit-200">{t.posSettingsTitle}</h2>

      <label className="block space-y-1">
        <span className="text-sm text-slate-300">{t.posPrintAgentUrl}</span>
        <input
          type="url"
          value={agentUrl}
          onChange={(e) => setAgentUrl(e.target.value)}
          onBlur={save}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          placeholder="http://127.0.0.1:9310"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-slate-300">{t.posPrinterProfile}</span>
        <select
          value={profile}
          onChange={(e) => {
            const next = e.target.value as PosPrinterProfile;
            setProfile(next);
            setPosPrinterProfile(next);
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
        >
          <option value="escpos_80mm">{t.posProfileEscpos80}</option>
          <option value="zpl_58mm">{t.posProfileZpl58}</option>
          <option value="zpl_40x30">{t.posProfileZpl40x30}</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runHealth()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
          {t.posTestConnection}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runTestPrint()}
          className="inline-flex items-center gap-2 rounded-lg border border-cockpit-500/40 bg-cockpit-500/20 px-3 py-2 text-sm font-semibold text-cockpit-200 hover:bg-cockpit-500/30 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          {t.posTestPrint}
        </button>
      </div>

      {healthStatus === 'ok' ? (
        <p className="text-sm text-emerald-300">{t.posAgentConnected}</p>
      ) : null}
      {healthStatus === 'fail' ? (
        <p className="text-sm text-rose-300">{t.posAgentUnreachable}</p>
      ) : null}
      {testStatus === 'ok' ? (
        <p className="text-sm text-emerald-300">{t.posTestPrintSent}</p>
      ) : null}
      {testStatus === 'fail' ? (
        <p className="text-sm text-rose-300">{t.posTestPrintFailed}</p>
      ) : null}
    </div>
  );
}
