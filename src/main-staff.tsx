import App from './App.tsx';
import { PublicNotFound } from './PublicNotFound';
import { assertAdminPathDoesNotCollide, isAdminPath, normalizePathname } from './lib/adminPath';
import { renderShell } from './lib/bootstrapShell';
import { resolveHostedSurface } from './lib/surfaceHost';
import './index.css';

const pathNorm = normalizePathname(window.location.pathname);

void renderStaffApp();

async function renderStaffApp() {
  assertAdminPathDoesNotCollide();

  if (pathNorm === '/order-manager' || pathNorm === '/order-management') {
    const { OrderManagerApp } = await import('./order-manager/OrderManagerApp');
    renderShell(<OrderManagerApp />);
    return;
  }

  const hostSurface = resolveHostedSurface(window.location.hostname);

  // Path /kiosk and /kds must win on the staff host (e.g. sp.mings.az/kds) before hostSurface === 'admin'.
  if (hostSurface === 'kiosk' || pathNorm === '/kiosk') {
    const { KioskApp } = await import('./kiosk/KioskApp');
    renderShell(<KioskApp />);
    return;
  }

  if (hostSurface === 'kds' || pathNorm === '/kds') {
    const { KitchenDisplay } = await import('./kds/KitchenDisplay');
    renderShell(<KitchenDisplay />);
    return;
  }

  if (hostSurface === 'pos' || pathNorm === '/pos') {
    const { PosApp } = await import('./pos/PosApp');
    renderShell(<PosApp />);
    return;
  }

  const isStaffEntrypoint = isAdminPath(pathNorm);

  if (isStaffEntrypoint || hostSurface === 'admin') {
    renderShell(<App />);
    return;
  }

  renderShell(<PublicNotFound />);
}
