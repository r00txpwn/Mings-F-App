/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Override staff cockpit path (default `/spec-ops`). */
  readonly VITE_ADMIN_APP_PATH?: string;
  /** Comma-separated exact hostnames for staff SPA at `/` (subdomain split). */
  readonly VITE_SURFACE_ADMIN_HOSTS?: string;
  readonly VITE_SURFACE_ORDER_HOSTS?: string;
  readonly VITE_SURFACE_KIOSK_HOSTS?: string;
  readonly VITE_SURFACE_KDS_HOSTS?: string;
  readonly VITE_SURFACE_TRACK_HOSTS?: string;
  /** Public storefront URL for links from admin (path or subdomain). */
  readonly VITE_PUBLIC_ORDER_URL?: string;
  readonly VITE_PUBLIC_KIOSK_URL?: string;
  /** Fixed weather location for 7-day forecast widget. */
  readonly VITE_WEATHER_LAT?: string;
  readonly VITE_WEATHER_LON?: string;
  readonly VITE_KIOSK_SECRET?: string;
  readonly VITE_KDS_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@vercel/analytics/react' {
  export interface AnalyticsProps {
    beforeSend?: (event: unknown) => unknown;
    debug?: boolean;
    mode?: 'auto' | 'development' | 'production';
    scriptSrc?: string;
    dsn?: string;
    eventEndpoint?: string;
    viewEndpoint?: string;
    sessionEndpoint?: string;
    endpoint?: string;
  }

  export const Analytics: (
    props: AnalyticsProps & {
      framework?: string;
      route?: string | null;
      path?: string | null;
      basePath?: string;
      configString?: string;
    }
  ) => null;

  export function track(
    name: string,
    properties?: Record<string, string | number | boolean | null | undefined>,
    options?: { flags?: unknown }
  ): void;
}
