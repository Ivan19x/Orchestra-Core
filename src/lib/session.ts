import { useState, useEffect } from 'react';

export interface SessionUser {
  id: string;
  identifier: string;
  paid: boolean;
  licenseKey?: string;
}

const TOKEN_KEY = 'oc_token';
const USER_KEY = 'oc_user';

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(getStoredUser);

  useEffect(() => {
    const handler = () => setUser(getStoredUser());
    window.addEventListener('oc_session_change', handler);
    return () => window.removeEventListener('oc_session_change', handler);
  }, []);

  return user;
}

export function dispatchSessionChange() {
  window.dispatchEvent(new Event('oc_session_change'));
}
