// Single source of truth for the displayed price. The amount actually charged
// is set by PRICE_KES on the backend (Render); keep VITE_PRICE_KES in sync with
// it on Vercel so the site shows what it charges. Default 2000 (the real price)
// — set both to 10 for a cheap live test, then change both back.
export const PRICE_KES = Number(import.meta.env.VITE_PRICE_KES) || 2000;
export const PRICE_LABEL = `KES ${PRICE_KES.toLocaleString('en-US')}`;
