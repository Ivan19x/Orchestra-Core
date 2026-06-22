import { getToken } from './session';

// Falls back to the production backend (not localhost) so a packaged app
// without VITE_API_URL baked in at build time still works rather than
// silently failing every request against a port nothing is listening on.
const BASE = import.meta.env.VITE_API_URL ?? 'https://orchestra-core.onrender.com';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) throw new ApiError(res.status, body?.error ?? 'Request failed');
  return body as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ── auth ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: { id: string; identifier: string; paid: boolean; licenseKey?: string };
}

export function signup(identifier: string, password: string) {
  return request<AuthResult>('/api/auth/signup', {
    method: 'POST', body: JSON.stringify({ identifier, password }),
  });
}

export function login(identifier: string, password: string) {
  return request<AuthResult>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ identifier, password }),
  });
}

export function getMe() {
  return request<{ id: string; identifier: string; paid: boolean; licenseKey?: string }>('/api/auth/me');
}

// ── payment ────────────────────────────────────────────────────────────────

export function initiatePayment(identifier: string, method: 'mpesa' | 'card' | 'free', mpesaPhone?: string) {
  return request<{ ok: boolean; method: string; txRef: string; paymentLink?: string; message?: string }>(
    '/api/payment/initiate',
    { method: 'POST', body: JSON.stringify({ identifier, method, mpesaPhone }) },
  );
}

export function getPaymentStatus(txRef: string) {
  return request<{ status: 'pending' | 'completed' | 'failed' }>(`/api/payment/status/${txRef}`);
}

export function verifyCardPayment(txRef: string, invoiceId?: string) {
  return request<{ ok: boolean }>('/api/payment/verify', {
    method: 'POST', body: JSON.stringify({ tx_ref: txRef, invoice_id: invoiceId }),
  });
}
