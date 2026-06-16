import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

const STORAGE_KEY = 'oc_streak';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Tiny local-only learning streak: counts consecutive days the dashboard is opened. */
export function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    let count = 1;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const today = todayKey();
      if (raw) {
        const saved = JSON.parse(raw) as { date: string; count: number };
        if (saved.date === today) {
          count = saved.count;
        } else if (saved.date === yesterdayKey()) {
          count = saved.count + 1;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
    } catch {
      // localStorage unavailable — show a fresh streak without persisting
    }
    setStreak(count);
  }, []);

  if (streak === null) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blush border border-border text-sm text-foreground">
      <Flame className="w-4 h-4 text-primary" strokeWidth={1.75} />
      {streak} day{streak === 1 ? '' : 's'} learning
    </div>
  );
}
