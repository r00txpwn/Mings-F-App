import { ChefHat, LogOut, Monitor, ShieldX, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function AdminAccessDeniedScreen() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/25 bg-slate-900/80 p-8 text-center shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-4">
            <ShieldX className="h-10 w-10 text-rose-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">{t.adminAccessDeniedTitle}</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">{t.adminAccessDeniedBody}</p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/pos"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cockpit-600 py-3 text-sm font-semibold text-white transition hover:bg-cockpit-500"
          >
            <ShoppingCart className="h-4 w-4" />
            {t.adminAccessGoToPos}
          </a>
          <a
            href="/kds"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ChefHat className="h-4 w-4" />
            {t.adminAccessGoToKds}
          </a>
          <a
            href="/kiosk"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Monitor className="h-4 w-4" />
            {t.adminAccessGoToKiosk}
          </a>
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
