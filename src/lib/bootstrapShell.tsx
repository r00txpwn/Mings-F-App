import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '../ErrorBoundary';
import { ConfigCheck } from '../ConfigCheck';

export function renderShell(node: ReactNode): void {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <ConfigCheck>
        <ErrorBoundary>{node}</ErrorBoundary>
      </ConfigCheck>
    </StrictMode>
  );
}
