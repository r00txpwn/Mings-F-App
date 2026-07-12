import { AlertCircle, LogOut, RefreshCw, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getPublicOrderUrl } from '../lib/surfaceHost';
import { Alert, AlertDescription } from '@/components/shadcn/alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/shadcn/card';

export function StaffAccessDeniedScreen() {
  const { t } = useLanguage();
  const { signOut, refetchIsStaff } = useAuth();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await refetchIsStaff();
    setRetrying(false);
  };

  return (
    <div className="cockpit-app flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <CardContent className="p-0">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full border border-primary/30 bg-primary/10 p-4">
              <AlertCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-center text-xl font-bold text-foreground">{t.staffAccessDeniedTitle}</h1>
          <Alert className="mt-4 border-0 bg-transparent p-0 shadow-none">
            <AlertDescription className="text-center text-sm leading-relaxed text-muted-foreground">
              {t.staffAccessDeniedBody}
            </AlertDescription>
          </Alert>

          <div className="mt-8 flex flex-col gap-3">
            <Button variant="secondary" onClick={() => void handleRetry()} loading={retrying} className="w-full">
              {!retrying ? <RefreshCw className="h-4 w-4" /> : null}
              {t.staffAccessRetry}
            </Button>
            <a href={getPublicOrderUrl()} className="neon-btn-primary w-full justify-center">
              <ShoppingBag className="h-4 w-4" />
              {t.staffGoToOrder}
            </a>
            <Button variant="ghost" onClick={() => void signOut()} className="w-full text-muted-foreground">
              <LogOut className="h-4 w-4" />
              {t.staffSignOut}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
