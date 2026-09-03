// Single source of truth for the displayed price. The amount actually charged
// is set by PRICE_KES on the backend; keep VITE_PRICE_KES on Vercel in sync
// with it so the site shows what it charges.
//
// VITE_PRICE_KES is read at BUILD time, so changing it on Vercel needs a fresh
// deploy to take effect.
export const PRICE_KES = Number(import.meta.env.VITE_PRICE_KES) || 200;
export const PRICE_LABEL = `KES ${PRICE_KES.toLocaleString('en-US')}`;
