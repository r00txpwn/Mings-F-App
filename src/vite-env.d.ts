/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Override staff cockpit path (default `/spec-ops`). */
  readonly VITE_ADMIN_APP_PATH?: string;
  /** Fixed weather location for 7-day forecast widget. */
  readonly VITE_WEATHER_LAT?: string;
  readonly VITE_WEATHER_LON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
