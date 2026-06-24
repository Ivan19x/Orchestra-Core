declare global {
  interface Window {
    Capacitor?: {
      getPlatform: () => 'android' | 'ios' | 'web';
      isNativePlatform: () => boolean;
    };
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.electronSetup;

export const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

export function getPlatform(): 'electron' | 'android' | 'ios' | 'web' {
  if (isElectron) return 'electron';
  if (typeof window !== 'undefined' && window.Capacitor) {
    return window.Capacitor.getPlatform();
  }
  return 'web';
}

export const isMobileApp = isCapacitor;
export const isDesktopApp = isElectron;

// Heuristic: is this a phone/tablet *browser* (as opposed to a laptop/desktop)?
// Used to decide whether to even offer local-AI setup — Ollama only runs on a
// computer, so on phones we just let the user keep reading. Conservative: only
// returns true for clear mobile signals.
export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return true;
  // iPadOS 13+ masquerades as desktop Safari — catch it via touch support.
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1) return true;
  return false;
}
