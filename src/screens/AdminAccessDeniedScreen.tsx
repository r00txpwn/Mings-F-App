import { ChefHat, LogOut, Monitor, ShieldX, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/shadcn/card';

export function AdminAccessDeniedScreen() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="cockpit-app flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md p-8 text-center shadow-lg">
        <CardContent className="p-0">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full border border-destructive/30 bg-destructive/10 p-4">
              <ShieldX className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.adminAccessDeniedTitle}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.adminAccessDeniedBody}</p>
          <div className="mt-8 flex flex-col gap-3">
            <a href="/pos" className="neon-btn-primary w-full justify-center">
              <ShoppingCart className="h-4 w-4" />
              {t.adminAccessGoToPos}
            </a>
            <a href="/kds" className="neon-btn-secondary w-full justify-center">
              <ChefHat className="h-4 w-4" />
              {t.adminAccessGoToKds}
            </a>
            <a href="/kiosk" className="neon-btn-secondary w-full justify-center">
              <Monitor className="h-4 w-4" />
              {t.adminAccessGoToKiosk}
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
