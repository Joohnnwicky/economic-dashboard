/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRED_API_KEY: string;
  readonly VITE_BLS_API_KEY: string;
  readonly VITE_ALPHA_VANTAGE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}