import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigCheck } from './ConfigCheck';
import { PublicNotFound } from './PublicNotFound';
import { assertAdminPathDoesNotCollide, isAdminPath, normalizePathname } from './lib/adminPath';
import { resolveHostedSurface } from './lib/surfaceHost';
import './index.css';

const pathname = window.location.pathname;
const pathNorm = normalizePathname(pathname);

/** Admin and storefront are separate: no implicit redirect from `/` to `/order`. */
void renderApp();

async function renderApp() {
  assertAdminPathDoesNotCollide();

  const root = createRoot(document.getElementById('root')!);

  /** Mobile-first Wolt-style order ops — separate from the cockpit (`App`). */
  if (pathNorm === '/order-manager') {
    const { OrderManagerApp } = await import('./order-manager/OrderManagerApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <OrderManagerApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  const hostSurface = resolveHostedSurface(window.location.hostname);
  const isStaffEntrypoint = isAdminPath(pathNorm);

  // Admin cockpit (`/spec-ops` or override) — always this shell, including on order.* hosts.
  if (isStaffEntrypoint) {
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  if (hostSurface === 'admin') {
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  if (hostSurface === 'order') {
    if (pathNorm === '/track' || pathNorm === '/order/track') {
      const { TrackingApp } = await import('./order/TrackingApp');
      root.render(
        <StrictMode>
          <ConfigCheck>
            <ErrorBoundary>
              <TrackingApp />
            </ErrorBoundary>
          </ConfigCheck>
        </StrictMode>
      );
    } else {
      const { OrderApp } = await import('./order/OrderApp');
      root.render(
        <StrictMode>
          <ConfigCheck>
            <ErrorBoundary>
              <OrderApp />
            </ErrorBoundary>
          </ConfigCheck>
        </StrictMode>
      );
    }
    return;
  }

  if (hostSurface === 'kiosk') {
    const { KioskApp } = await import('./kiosk/KioskApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <KioskApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  if (hostSurface === 'kds') {
    const { KitchenDisplay } = await import('./kds/KitchenDisplay');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <KitchenDisplay />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  if (hostSurface === 'track') {
    const { TrackingApp } = await import('./order/TrackingApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <TrackingApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  // Path-based routing (localhost, preview URLs, or hosts without VITE_SURFACE_* set)
  if (pathNorm === '/kiosk') {
    const { KioskApp } = await import('./kiosk/KioskApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <KioskApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  } else if (pathNorm === '/kds') {
    const { KitchenDisplay } = await import('./kds/KitchenDisplay');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <KitchenDisplay />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  } else if (pathNorm === '/order') {
    const { OrderApp } = await import('./order/OrderApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <OrderApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  } else if (pathNorm === '/track' || pathNorm === '/order/track') {
    const { TrackingApp } = await import('./order/TrackingApp');
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <TrackingApp />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  } else if (pathNorm === '/') {
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <PublicNotFound />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  } else {
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <PublicNotFound />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
