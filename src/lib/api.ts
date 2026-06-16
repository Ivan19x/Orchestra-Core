import { getToken } from './session';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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

export function sendOtp(identifier: string) {
  return request<{ ok: boolean; identifier: string }>('/api/auth/send-otp', {
    method: 'POST', body: JSON.stringify({ identifier }),
  });
}

export function verifyOtp(identifier: string, code: string) {
  return request<{ token: string; user: { id: string; identifier: string; paid: boolean; licenseKey?: string } }>(
    '/api/auth/verify-otp',
    { method: 'POST', body: JSON.stringify({ identifier, code }) },
  );
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
