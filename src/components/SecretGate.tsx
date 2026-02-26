import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface SecretGateProps {
  secretKey: string;
  children: React.ReactNode;
}

export function SecretGate({ secretKey, children }: SecretGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (key && key === secretKey) {
      setAuthorized(true);
    }
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
