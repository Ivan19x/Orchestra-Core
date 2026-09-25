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

export function requestReset(identifier: string) {
  return request<{ ok: boolean }>('/api/auth/request-reset', {
    method: 'POST', body: JSON.stringify({ identifier }),
  });
}

export function resetPassword(token: string, password: string) {
  return request<AuthResult>('/api/auth/reset-password', {
    method: 'POST', body: JSON.stringify({ token, password }),
  });
}

// ── payment (M-Pesa via Safaricom Daraja) ──────────────────────────────────

// Triggers the STK Push — the "enter your M-Pesa PIN" prompt on the customer's
// phone. Resolves as soon as the prompt is sent, NOT when it's paid: poll
// getPaymentStatus(txRef) after this to find out what the customer did.
export function initiatePayment(identifier: string, phone: string) {
  return request<{ ok: boolean; txRef: string; message?: string }>(
    '/api/payment/initiate',
    { method: 'POST', body: JSON.stringify({ identifier, phone }) },
  );
}

export function getPaymentStatus(txRef: string) {
  return request<{ status: 'pending' | 'completed' | 'failed'; message?: string }>(
    `/api/payment/status/${txRef}`,
  );
}

// ── consultants & sessions ─────────────────────────────────────────────────

export interface Consultant {
  id: string;
  slug: string;
  full_name: string;
  headline?: string;
  bio?: string;
  photo_url?: string;
  specialities: string[];
  hourly_rate_kes: number;
  session_modes: ('online' | 'in_person')[];
  service_area?: string;
}

export interface BookingSummary {
  ref: string;
  starts_at: string;
  duration_minutes: number;
  mode: 'online' | 'in_person';
  location?: string;
  meeting_link?: string;
  amount_kes: number;
  status: string;
  consultants?: { full_name: string; slug: string };
}

export function listConsultants() {
  return request<{ consultants: Consultant[] }>('/api/consultants');
}

export function getConsultant(slug: string) {
  return request<{ consultant: Consultant }>(`/api/consultants/${slug}`);
}

export function getConsultantSlots(slug: string, durationMinutes: number) {
  return request<{ durationMinutes: number; slots: string[] }>(
    `/api/consultants/${slug}/slots?duration=${durationMinutes}`,
  );
}

export interface NewBooking {
  consultantSlug: string;
  startsAt: string;
  durationMinutes: number;
  mode: 'online' | 'in_person';
  location?: string;
  learnerNote?: string;
  phone: string;
}

export function createBooking(payload: NewBooking) {
  return request<{ ok: boolean; ref: string; amountKes: number; message?: string }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getBookingStatus(ref: string) {
  return request<{ status: string; message?: string }>(`/api/bookings/${ref}/status`);
}

export function listMyBookings() {
  return request<{ bookings: BookingSummary[] }>('/api/bookings/mine');
}

export interface ConsultantApplication {
  fullName: string;
  headline?: string;
  bio: string;
  qualifications: string;
  experienceYears?: number;
  idLast4?: string;
  specialities?: string[];
  sessionModes: ('online' | 'in_person')[];
  serviceArea?: string;
}

export function applyAsConsultant(payload: ConsultantApplication) {
  return request<{ ok: boolean; status: string }>('/api/consultants/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMyApplication() {
  return request<{
    application: null | {
      status: string;
      slug: string;
      fullName: string;
      documentsReceived: boolean;
      appliedAt: string;
    };
  }>('/api/consultants/me/application');
}

export function sendContactMessage(payload: { name?: string; email: string; subject?: string; body: string }) {
  return request<{ ok: boolean }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
