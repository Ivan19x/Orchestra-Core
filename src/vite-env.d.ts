/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API, e.g. https://orchestra-core.onrender.com */
  readonly VITE_API_URL?: string;
  /** Displayed price in KES. Keep in sync with PRICE_KES on the backend. */
  readonly VITE_PRICE_KES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;

// Built at build time from src/content/lessons/*.md by the lesson-index plugin
// in vite.config.ts — the lesson catalogue without the lesson bodies.
declare module 'virtual:lesson-index' {
  const lessons: {
    code: string;
    series: number;
    module: number;
    seriesTitle: string;
    title: string;
    free: boolean;
    estMinutes: number;
    summary: string;
  }[];
  export default lessons;
}
