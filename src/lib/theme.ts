import { useState, useEffect } from 'react';

// Light/dark theme via a `dark` class on <html> (Tailwind darkMode: 'class').
// The initial class is applied pre-paint by an inline script in index.html so
// there's no flash; this hook just reads/toggles it and persists the choice.
// Default is light — dark is opt-in (the inline script only adds `dark` when
// the user has explicitly chosen it).

export type Theme = 'light' | 'dark';

const KEY = 'oc_theme';
const EVENT = 'oc_theme_change';

function current(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    const handler = () => setTheme(current());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  function toggle() {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem(KEY, next); } catch { /* private mode — keep going */ }
    window.dispatchEvent(new Event(EVENT));
  }

  return { theme, toggle };
}
