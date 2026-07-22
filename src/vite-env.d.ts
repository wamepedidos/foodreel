/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_STAFF_PREVIEW?: string;
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string;
  readonly VITE_ORDERS_API_BASE?: string;
  readonly VITE_STAFF_PREVIEW_TOKEN?: string;
  readonly VITE_TABLE_ACCESS_TOKEN?: string;
  readonly VITE_USE_LOCAL_ORDER_BACKEND?: string;
}
