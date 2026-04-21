import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Google's 4-color G mark. Inlined so we don't pull a new icon dependency;
 * the SVG ships once per bundle entry and is cached with the rest of the JS.
 */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.84A10.99 10.99 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.65-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.36c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.65 2.84C6.7 7.3 9.13 5.36 12 5.36z"
      />
    </svg>
  );
}

export interface GoogleSignInButtonProps {
  /** Invoked on click. Should trigger `signInWithOAuth` and will cause a redirect. */
  onClick: () => Promise<{ error: unknown }>;
  /** Label shown in the idle state, e.g. `t.orderSignInGoogle`. */
  label: string;
  /** Label shown after click while waiting for the redirect to take effect. */
  redirectingLabel: string;
  /** Optional — rendered as a small error under the button if sign-in fails. */
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  onClick,
  label,
  redirectingLabel,
  onError,
  disabled,
  className,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy || disabled) return;
    setBusy(true);
    const { error } = await onClick();
    if (error) {
      setBusy(false);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Google sign-in failed';
      onError?.(message);
    }
    // Success → Supabase navigates to Google; we intentionally stay "busy".
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy || disabled}
      className={
        'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ' +
        (className ?? '')
      }
      aria-label={label}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <GoogleG className="h-4 w-4" />
      )}
      <span>{busy ? redirectingLabel : label}</span>
    </button>
  );
}
