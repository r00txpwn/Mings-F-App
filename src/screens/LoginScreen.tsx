import { useEffect, useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { MingsWordmark } from '../components/MingsWordmark';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  clearLoginFailures,
  formatLockout,
  getLockRemainingMs,
  registerLoginFailure,
} from '../lib/loginRateLimit';

export function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  useEffect(() => {
    const next = getLockRemainingMs(email);
    setLockRemainingMs(next);
  }, [email]);

  useEffect(() => {
    if (lockRemainingMs <= 0) return;
    const timer = window.setInterval(() => {
      const next = getLockRemainingMs(email);
      setLockRemainingMs(next);
      if (next <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email, lockRemainingMs]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get('email') ?? '').trim();
    const submittedPassword = String(formData.get('password') ?? '');
    const nextEmail = email.trim() || submittedEmail;
    const nextPassword = password || submittedPassword;

    if (!nextEmail || !nextPassword) {
      setError(t.fillAllFields);
      return;
    }

    if (nextPassword.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    const remaining = getLockRemainingMs(nextEmail);
    if (remaining > 0) {
      setLockRemainingMs(remaining);
      setError(`Too many failed attempts. Try again in ${formatLockout(remaining)}.`);
      return;
    }

    setLoading(true);

    const { error } = await signIn(nextEmail, nextPassword);

    if (error) {
      const message = error.message || 'Sign in failed';
      const normalized = message.toLowerCase();
      const isCredentialFailure =
        normalized.includes('invalid login credentials') ||
        normalized.includes('email not confirmed') ||
        normalized.includes('invalid credentials');

      if (isCredentialFailure) {
        const nextRemaining = registerLoginFailure(nextEmail);
        if (nextRemaining > 0) {
          setLockRemainingMs(nextRemaining);
          setError(`Too many failed attempts. Try again in ${formatLockout(nextRemaining)}.`);
        } else {
          setError(message);
        }
      } else {
        setError(message);
      }
    } else {
      clearLoginFailures(nextEmail);
      setLockRemainingMs(0);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.18),transparent)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(51, 65, 85, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51, 65, 85, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-cockpit-glow backdrop-blur-xl">
          <div className="border-b border-white/5 bg-gradient-to-r from-cockpit-950/50 to-transparent px-8 py-8">
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl bg-black px-6 py-4 shadow-lg shadow-black/50 ring-1 ring-white/10">
                <MingsWordmark className="mx-auto h-12 w-auto max-w-[220px] object-contain object-center" />
              </div>
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-cockpit-400">
              {t.signInToAccount}
            </p>
            <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-white">{t.welcomeBack}</h1>
            <p className="mt-2 text-center text-sm text-slate-400">{t.signInToAccount}</p>
          </div>

          <div className="px-8 pb-8 pt-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {lockRemainingMs > 0 && !error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-sm">
                  Too many failed attempts. Try again in {formatLockout(lockRemainingMs)}.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.emailAddress}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-slate-600 focus:border-cockpit-500/50 focus:outline-none focus:ring-2 focus:ring-cockpit-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-slate-600 focus:border-cockpit-500/50 focus:outline-none focus:ring-2 focus:ring-cockpit-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || lockRemainingMs > 0}
                className="w-full rounded-xl bg-gradient-to-r from-cockpit-600 to-cockpit-700 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-cockpit-500/25 transition hover:from-cockpit-500 hover:to-cockpit-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t.pleaseWait : lockRemainingMs > 0 ? 'Temporarily locked' : t.signIn}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">{t.businessManagement}</p>
      </div>
    </div>
  );
}
