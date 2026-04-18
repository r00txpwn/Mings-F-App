/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Legacy admin path override (kept for backward compatibility redirects). */
  readonly VITE_ADMIN_APP_PATH?: string;
  /** Build surface for subdomain deployment (`sp` or `order`). */
  readonly VITE_APP_SURFACE?: 'sp' | 'order';
  /** Customer app origin used by staff links (defaults by host mapping). */
  readonly VITE_ORDER_APP_ORIGIN?: string;
  /** Fixed weather location for 7-day forecast widget. */
  readonly VITE_WEATHER_LAT?: string;
  readonly VITE_WEATHER_LON?: string;
  /** Wolt merchant portal base URL for manual courier booking (staff kiosk board). */
  readonly VITE_WOLT_PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
