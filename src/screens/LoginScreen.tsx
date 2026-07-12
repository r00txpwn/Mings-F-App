import { useEffect, useState } from 'react';
import { Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { MingsWordmark } from '../components/MingsWordmark';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import {
  clearLoginFailures,
  formatLockout,
  getLockRemainingMs,
  registerLoginFailure,
} from '../lib/loginRateLimit';
import { Alert, AlertDescription } from '@/components/shadcn/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';

export function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  useEffect(() => {
    setLockRemainingMs(getLockRemainingMs(email));
  }, [email]);

  useEffect(() => {
    if (lockRemainingMs <= 0) return;
    const timer = window.setInterval(() => {
      const next = getLockRemainingMs(email);
      setLockRemainingMs(next);
      if (next <= 0) window.clearInterval(timer);
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
    const { error: signInError } = await signIn(nextEmail, nextPassword);

    if (signInError) {
      const message = signInError.message || 'Sign in failed';
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
    <div className="cockpit-app grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-amber-600 to-amber-900 px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-56 w-56 rounded-full bg-black/15 blur-3xl" />

        <div className="relative">
          <MingsWordmark className="h-11 w-auto max-w-[240px] object-contain brightness-0 invert" />
        </div>

        <div className="relative max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Spec Ops
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">{t.welcomeBack}</h1>
          <p className="text-base text-white/85">{t.businessManagement}</p>
        </div>

        <p className="relative text-xs text-white/60">{t.signInToAccount}</p>
      </section>

      <section className="flex min-h-screen flex-col justify-center bg-background px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <MingsWordmark className="mx-auto h-10 w-auto max-w-[200px] object-contain" />
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t.signInToAccount}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t.welcomeBack}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.businessManagement}</p>
          </div>

          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {lockRemainingMs > 0 && !error ? (
            <Alert className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Too many failed attempts. Try again in {formatLockout(lockRemainingMs)}.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="mb-6 space-y-4">
            <GoogleSignInButton
              onClick={() => signInWithGoogle()}
              label={t.orderSignInGoogle}
              redirectingLabel={t.orderSignInGoogleRedirecting}
              onError={(msg) => setError(msg)}
            />
            <div className="relative flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t.emailAddress}</span>
              <Separator className="flex-1" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email">{t.emailAddress}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="h-11 w-full" loading={loading} disabled={lockRemainingMs > 0}>
              {loading ? t.pleaseWait : lockRemainingMs > 0 ? 'Temporarily locked' : t.signIn}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
