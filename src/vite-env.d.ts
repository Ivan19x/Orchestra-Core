/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DOWNLOAD_URL_WIN?: string;
  readonly VITE_DOWNLOAD_URL_MAC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
