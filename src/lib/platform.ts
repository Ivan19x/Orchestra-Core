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
