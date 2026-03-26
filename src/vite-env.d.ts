/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  /** Override staff cockpit path (default `/spec-ops`). */
  readonly VITE_ADMIN_APP_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
