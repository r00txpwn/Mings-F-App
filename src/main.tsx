/**
 * Dev entry — delegates to staff or storefront bundle based on VITE_BUILD_TARGET (from vite --mode).
 * Production builds use index-staff.html / index-storefront.html directly.
 */
import { getBuildTarget } from './lib/buildTarget';

void (async () => {
  if (getBuildTarget() === 'storefront') {
    await import('./main-storefront.tsx');
  } else {
    await import('./main-staff.tsx');
  }
})();
