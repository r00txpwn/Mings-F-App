import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigCheck } from './ConfigCheck';
import './index.css';

const pathname = window.location.pathname;

async function renderApp() {
  const root = createRoot(document.getElementById('root')!);

  if (pathname === '/kiosk') {
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
  } else if (pathname === '/kds') {
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
  } else {
    root.render(
      <StrictMode>
        <ConfigCheck>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ConfigCheck>
      </StrictMode>
    );
  }
}

renderApp();
