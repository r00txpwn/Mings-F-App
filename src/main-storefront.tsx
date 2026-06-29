import { PublicNotFound } from './PublicNotFound';
import { normalizePathname } from './lib/adminPath';
import { renderShell } from './lib/bootstrapShell';
import { resolveHostedSurface } from './lib/surfaceHost';
import './index.css';

const pathNorm = normalizePathname(window.location.pathname);

/** Staff-only paths must not ship in the storefront bundle runtime. */
const STAFF_ONLY_PATHS = new Set([
  '/spec-ops',
  '/order-manager',
  '/order-management',
  '/kiosk',
  '/kds',
  '/pos',
]);

void renderStorefrontApp();

async function renderStorefrontApp() {
  if (STAFF_ONLY_PATHS.has(pathNorm)) {
    renderShell(<PublicNotFound />);
    return;
  }

  const hostSurface = resolveHostedSurface(window.location.hostname);

  if (hostSurface === 'order' || hostSurface === 'track') {
    if (pathNorm === '/track' || hostSurface === 'track') {
      const { TrackingApp } = await import('./order/TrackingApp');
      renderShell(<TrackingApp />);
      return;
    }
    const { OrderApp } = await import('./order/OrderApp');
    renderShell(<OrderApp />);
    return;
  }

  if (pathNorm === '/track') {
    const { TrackingApp } = await import('./order/TrackingApp');
    renderShell(<TrackingApp />);
    return;
  }

  if (pathNorm === '/order' || pathNorm === '/') {
    const { OrderApp } = await import('./order/OrderApp');
    renderShell(<OrderApp />);
    return;
  }

  renderShell(<PublicNotFound />);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
