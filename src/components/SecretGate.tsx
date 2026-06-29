import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface SecretGateProps {
  secretKey: string;
  children: React.ReactNode;
}

/** Read ?key= from the URL; restore '+' (query strings encode spaces as +). */
function readGateKeyFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('key') ?? '';
  return raw.replace(/ /g, '+');
}

export function SecretGate({ secretKey, children }: SecretGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const required = (secretKey ?? '').trim();
    // No secret in env → allow open access (local dev). In production, set VITE_KIOSK_SECRET.
    if (!required) {
      setAuthorized(true);
      setChecked(true);
      return;
    }
    const key = readGateKeyFromUrl();
    setAuthorized(key === required);
    setChecked(true);
  }, [secretKey]);

  if (!checked) return null;

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-400 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm">Invalid or missing access key</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
