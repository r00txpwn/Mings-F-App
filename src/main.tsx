import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigCheck } from './ConfigCheck';
import { PublicNotFound } from './PublicNotFound';
import { assertAdminPathDoesNotCollide, isAdminPath, normalizePathname } from './lib/adminPath';
import './index.css';

// VITE_APP_SURFACE controls which routes are exposed:
//   'sp'    → sp.mings.az    (admin cockpit + KDS)
//   'order' → order.mings.az (online ordering + kiosk + order management)
const surface = (import.meta.env.VITE_APP_SURFACE ?? 'sp').trim();

const pathNorm = normalizePathname(window.location.pathname);

void renderApp();

async function renderApp() {
  const root = createRoot(document.getElementById('root')!);

  function wrap(child: React.ReactNode) {
    return (
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>{child}</ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  }

  if (surface === 'order') {
    // order.mings.az routes
    if (pathNorm === '/') {
      const { OrderApp } = await import('./order/OrderApp');
      root.render(wrap(<OrderApp />));
    } else if (pathNorm === '/track') {
      const { TrackingApp } = await import('./order/TrackingApp');
      root.render(wrap(<TrackingApp />));
    } else if (pathNorm === '/kiosk') {
      const { KioskApp } = await import('./kiosk/KioskApp');
      root.render(wrap(<KioskApp />));
    } else if (pathNorm === '/management') {
      const { OrderManagementApp } = await import('./order/OrderManagementApp');
      root.render(wrap(<OrderManagementApp />));
    } else {
      root.render(wrap(<PublicNotFound />));
    }
  } else {
    // sp.mings.az routes (default)
    assertAdminPathDoesNotCollide();

    if (pathNorm === '/kds') {
      const { KitchenDisplay } = await import('./kds/KitchenDisplay');
      root.render(wrap(<KitchenDisplay />));
    } else if (pathNorm === '/' || isAdminPath(pathNorm)) {
      root.render(wrap(<App />));
    } else {
      root.render(wrap(<PublicNotFound />));
    }
  }
}
