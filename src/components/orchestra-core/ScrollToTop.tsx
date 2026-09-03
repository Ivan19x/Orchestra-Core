import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router keeps the scroll position across navigations. On a reading site
// that means clicking a lesson from halfway down the library drops you into the
// middle of the article. Reset to the top whenever the path changes.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
