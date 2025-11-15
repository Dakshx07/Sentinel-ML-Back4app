/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACK4APP_APP_ID: string;
  readonly VITE_BACK4APP_JS_KEY: string;
  readonly VITE_BACK4APP_SERVER_URL: string;
  readonly VITE_ML_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

