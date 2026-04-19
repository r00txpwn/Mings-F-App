import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigCheck } from './ConfigCheck';
import { PublicNotFound } from './PublicNotFound';
import { getAppSurface, isStaffRoutePath, normalizePathname } from './lib/surfaceRouting';
import './index.css';

const pathname = window.location.pathname;
const pathNorm = normalizePathname(pathname);
const appSurface = getAppSurface();

void renderApp();

async function renderApp() {
  const root = createRoot(document.getElementById('root')!);

  if (appSurface === 'order') {
    if (pathNorm === '/order') {
      window.location.replace('/');
      return;
    }

    if (pathNorm === '/') {
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
      return;
    }

    if (pathNorm === '/track') {
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

    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <PublicNotFound />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
    return;
  }

  if (pathNorm === '/spec-ops') {
    window.location.replace('/');
    return;
  }

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
    return;
  }

  if (pathNorm === '/kds') {
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

  if (pathNorm === '/order') {
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
    return;
  }

  if (pathNorm === '/track') {
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

  if (isStaffRoutePath(pathNorm)) {
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
