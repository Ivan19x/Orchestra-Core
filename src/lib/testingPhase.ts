import { useState, useEffect } from 'react';

// Set VITE_TESTING_PHASE=true in Vercel to enable free testing mode.
// Remove the env var when paid access is ready — nothing else needs to change.
export const TESTING_PHASE = import.meta.env.VITE_TESTING_PHASE === 'true';

// Testing phase end date — update this if you extend the window (EAT = UTC+3)
export const TESTING_END = new Date('2026-06-30T20:59:59Z'); // June 30, 2026 at 23:59 EAT

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function calc(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

export function useCountdown(): TimeLeft | null {
  const [left, setLeft] = useState<TimeLeft | null>(() => calc(TESTING_END));
  useEffect(() => {
    const id = setInterval(() => setLeft(calc(TESTING_END)), 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

export function formatCountdown(t: TimeLeft): string {
  if (t.days > 0) return `${t.days}d ${t.hours}h ${t.minutes}m`;
  if (t.hours > 0) return `${t.hours}h ${t.minutes}m ${t.seconds}s`;
  return `${t.minutes}m ${t.seconds}s`;
}
