import { AlertCircle, Loader2, LogOut, RefreshCw, ShoppingBag, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getPublicOrderUrl } from '../lib/surfaceHost';

export function StaffAccessDeniedScreen() {
  const { t } = useLanguage();
  const { signOut, refetchIsStaff, staffLookupError } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const isConnectivity = Boolean(staffLookupError);

  const handleRetry = async () => {
    setRetrying(true);
    await refetchIsStaff();
    setRetrying(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12">
      <div
        className={`w-full max-w-md rounded-2xl border bg-slate-900/80 p-8 shadow-xl ${
          isConnectivity ? 'border-sky-500/25' : 'border-amber-500/25'
        }`}
      >
        <div className="mb-6 flex justify-center">
          <div
            className={`rounded-full border p-4 ${
              isConnectivity
                ? 'border-sky-500/30 bg-sky-500/10'
                : 'border-amber-500/30 bg-amber-500/10'
            }`}
          >
            {isConnectivity ? (
              <WifiOff className="h-10 w-10 text-sky-400" />
            ) : (
              <AlertCircle className="h-10 w-10 text-amber-400" />
            )}
          </div>
        </div>
        <h1 className="text-center text-xl font-bold text-white">
          {isConnectivity ? t.staffConnectivityTitle : t.staffAccessDeniedTitle}
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-400">
          {isConnectivity ? t.staffConnectivityBody : t.staffAccessDeniedBody}
        </p>
        {isConnectivity && staffLookupError ? (
          <p className="mt-2 text-center text-xs text-slate-500">{staffLookupError}</p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t.staffAccessRetry}
          </button>
          {!isConnectivity ? (
            <a
              href={getPublicOrderUrl()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cockpit-600 py-3 text-sm font-semibold text-white transition hover:bg-cockpit-500"
            >
              <ShoppingBag className="h-4 w-4" />
              {t.staffGoToOrder}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-slate-500 transition hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            {t.staffSignOut}
          </button>
        </div>
      </div>
    </div>
  );
}
