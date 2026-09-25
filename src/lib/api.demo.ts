// A stand-in for src/lib/api.ts used ONLY by `npm run build:demo`.
//
// It exports exactly the same names with the same shapes, so every page,
// button, loading state and error path behaves as it will in production —
// there is no demo-specific branching anywhere in the pages themselves.
// vite.config.ts aliases '@/lib/api' to this file in demo mode.
//
// Everything is in memory: changes survive navigation, and reset on reload.

import {
  CONSULTANTS, AVAILABILITY, PERSONAS, currentPersona,
  wait, at, thisMonth, lastMonth,
} from './demoData';
import { getStoredUser, saveSession, dispatchSessionChange, type SessionUser } from './session';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function persona() { return currentPersona().id; }

// ── auth ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: { id: string; identifier: string; paid: boolean; licenseKey?: string };
}

export async function signup(identifier: string, _password: string): Promise<AuthResult> {
  const user: SessionUser = { id: 'u-demo', identifier, paid: false };
  await wait(null);
  return { token: 'demo-token', user };
}

export async function login(identifier: string, _password: string): Promise<AuthResult> {
  // Signing in as any of the demo addresses drops you into that persona, so a
  // partner can try the real sign-in form and land somewhere sensible.
  const match = PERSONAS.find(p => p.user?.identifier === identifier.trim().toLowerCase());
  const user: SessionUser = match?.user ?? { id: 'u-demo', identifier, paid: false };
  await wait(null);
  return { token: 'demo-token', user };
}

export async function getMe() {
  const stored = getStoredUser();
  if (!stored) throw new ApiError(401, 'Not signed in.');
  return wait(stored);
}

export async function requestReset(_identifier: string) { return wait({ ok: true }); }

export async function resetPassword(_token: string, password: string): Promise<AuthResult> {
  const stored = getStoredUser() ?? { id: 'u-demo', identifier: 'you@example.com', paid: false };
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');
  return wait({ token: 'demo-token', user: stored });
}

// ── curriculum purchase ────────────────────────────────────────────────────

export async function initiatePayment(_identifier: string, phone: string) {
  if (!/^(?:\+?254|0)?[71]\d{8}$/.test(phone.replace(/\s/g, ''))) {
    throw new ApiError(400, 'Enter a valid Safaricom number, e.g. 0712 345 678.');
  }
  purchaseStartedAt = Date.now();
  return wait({ ok: true, txRef: 'OC-DEMO-1', message: 'Check your phone for the M-Pesa prompt.' });
}

let purchaseStartedAt = 0;

export async function getPaymentStatus(_txRef: string) {
  // Confirms a few seconds in, so the waiting screen is actually visible.
  if (Date.now() - purchaseStartedAt < 4500) return wait({ status: 'pending' as const }, 120);

  const stored = getStoredUser();
  if (stored) {
    saveSession('demo-token', { ...stored, paid: true, licenseKey: 'OC-DEMO-7F2A-91C4-B3D8-4E01' });
    dispatchSessionChange();
  }
  return wait({ status: 'completed' as const }, 120);
}

// ── consultants ────────────────────────────────────────────────────────────

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

export async function listConsultants() {
  return wait({ consultants: CONSULTANTS as Consultant[] });
}

export async function getConsultant(slug: string) {
  const consultant = CONSULTANTS.find(c => c.slug === slug);
  if (!consultant) throw new ApiError(404, 'Consultant not found.');
  return wait({ consultant: consultant as Consultant });
}

export async function getConsultantSlots(slug: string, durationMinutes: number) {
  const windows = AVAILABILITY[slug] ?? [];
  const slots: string[] = [];
  const hours = durationMinutes / 60;

  for (let d = 1; d <= 21; d++) {
    const eat = new Date(Date.now() + 3 * 3_600_000 + d * 86_400_000);
    const weekday = eat.getUTCDay();
    for (const [wd, from, to] of windows) {
      if (wd !== weekday) continue;
      for (let h = from; h + hours <= to; h += hours) {
        const iso = at(d, h);
        if (!booked.some(b => b.slug === slug && b.startsAt === iso)) slots.push(iso);
      }
    }
  }
  return wait({ durationMinutes, slots: slots.sort() });
}

// ── bookings ───────────────────────────────────────────────────────────────

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

interface DemoBooking extends BookingSummary {
  slug: string;
  startsAt: string;
  teacher_fee_kes: number;
  payout_status: string;
  payout_month: string;
  refund_status: string;
  learner_note?: string;
  users?: { email: string };
}

// Seeded so "Full access" and "Consultant" both have a believable history.
const booked: DemoBooking[] = [
  {
    ref: 'OCB-DEMO-1', slug: 'grace-njeri', startsAt: at(3, 10), starts_at: at(3, 10),
    duration_minutes: 60, mode: 'online', amount_kes: 1500, status: 'confirmed',
    meeting_link: 'https://meet.example.com/orchestra-demo',
    consultants: { full_name: 'Grace Njeri', slug: 'grace-njeri' },
    teacher_fee_kes: 900, payout_status: 'unpaid', payout_month: thisMonth(), refund_status: 'none',
    learner_note: 'I want to understand my payslip deductions before I ask for a raise.',
    users: { email: 'otieno@example.com' },
  },
  {
    ref: 'OCB-DEMO-2', slug: 'grace-njeri', startsAt: at(-6, 14), starts_at: at(-6, 14),
    duration_minutes: 120, mode: 'in_person', location: 'Westlands, Nairobi',
    amount_kes: 3000, status: 'completed',
    consultants: { full_name: 'Grace Njeri', slug: 'grace-njeri' },
    teacher_fee_kes: 1800, payout_status: 'unpaid', payout_month: thisMonth(), refund_status: 'none',
    users: { email: 'otieno@example.com' },
  },
  {
    ref: 'OCB-DEMO-3', slug: 'grace-njeri', startsAt: at(-34, 11), starts_at: at(-34, 11),
    duration_minutes: 60, mode: 'online', amount_kes: 1500, status: 'no_show_teacher',
    consultants: { full_name: 'Grace Njeri', slug: 'grace-njeri' },
    teacher_fee_kes: 900, payout_status: 'void', payout_month: lastMonth(), refund_status: 'approved',
    users: { email: 'wanjiku@example.com' },
  },
  {
    ref: 'OCB-DEMO-4', slug: 'grace-njeri', startsAt: at(-40, 16), starts_at: at(-40, 16),
    duration_minutes: 60, mode: 'online', amount_kes: 1500, status: 'completed',
    consultants: { full_name: 'Grace Njeri', slug: 'grace-njeri' },
    teacher_fee_kes: 900, payout_status: 'paid', payout_month: lastMonth(), refund_status: 'none',
    users: { email: 'otieno@example.com' },
  },
];

export interface NewBooking {
  consultantSlug: string;
  startsAt: string;
  durationMinutes: number;
  mode: 'online' | 'in_person';
  location?: string;
  learnerNote?: string;
  phone: string;
}

let bookingStartedAt = 0;
let pendingRef = '';

export async function createBooking(payload: NewBooking) {
  if (!/^(?:\+?254|0)?[71]\d{8}$/.test(payload.phone.replace(/\s/g, ''))) {
    throw new ApiError(400, 'Enter a valid Safaricom number, e.g. 0712 345 678.');
  }
  const consultant = CONSULTANTS.find(c => c.slug === payload.consultantSlug);
  if (!consultant) throw new ApiError(404, 'Consultant not found.');

  const amount = Math.round(consultant.hourly_rate_kes * (payload.durationMinutes / 60));
  pendingRef = `OCB-DEMO-${booked.length + 1}`;
  bookingStartedAt = Date.now();

  booked.unshift({
    ref: pendingRef, slug: consultant.slug,
    startsAt: payload.startsAt, starts_at: payload.startsAt,
    duration_minutes: payload.durationMinutes, mode: payload.mode,
    location: payload.location, amount_kes: amount, status: 'pending_payment',
    meeting_link: payload.mode === 'online' ? 'https://meet.example.com/orchestra-demo' : undefined,
    consultants: { full_name: consultant.full_name, slug: consultant.slug },
    teacher_fee_kes: Math.round(amount * 0.6), payout_status: 'unpaid',
    payout_month: thisMonth(), refund_status: 'none',
    learner_note: payload.learnerNote,
    users: { email: getStoredUser()?.identifier ?? 'you@example.com' },
  });

  return wait({ ok: true, ref: pendingRef, amountKes: amount, message: 'Check your phone for the M-Pesa prompt.' });
}

export async function getBookingStatus(ref: string) {
  if (Date.now() - bookingStartedAt < 4500) return wait({ status: 'pending_payment' }, 120);
  const booking = booked.find(b => b.ref === ref);
  if (booking && booking.status === 'pending_payment') booking.status = 'confirmed';
  return wait({ status: 'confirmed' }, 120);
}

export async function listMyBookings() {
  const email = getStoredUser()?.identifier;
  const mine = booked.filter(b => b.status !== 'pending_payment' || b.ref === pendingRef);
  // The teacher persona is shown the learner view of their own test bookings
  // too, so every screen has something in it.
  return wait({ bookings: (persona() === 'free' ? mine.filter(b => b.users?.email === email) : mine) as BookingSummary[] });
}

export async function cancelBooking(ref: string) {
  const b = booked.find(x => x.ref === ref);
  if (!b) throw new ApiError(404, 'Booking not found.');
  const hoursAway = (new Date(b.starts_at).getTime() - Date.now()) / 3_600_000;
  const full = hoursAway >= 24;
  b.status = 'cancelled';
  b.refund_status = full ? 'approved' : 'none';
  b.payout_status = full ? 'void' : 'unpaid';
  return wait({
    ok: true, status: 'cancelled', refundAmountKes: full ? b.amount_kes : 0,
    message: full
      ? "Cancelled with more than 24 hours' notice, so it is refunded in full."
      : "Cancelled with less than 24 hours' notice, so it is not refunded — your consultant had already held the time.",
  });
}

export async function reportBooking(ref: string, _note?: string) {
  const b = booked.find(x => x.ref === ref);
  if (!b) throw new ApiError(404, 'Booking not found.');
  const asTeacher = persona() === 'teacher';
  b.status = asTeacher ? 'no_show_learner' : 'no_show_teacher';
  b.refund_status = asTeacher ? 'none' : 'approved';
  b.payout_status = asTeacher ? 'unpaid' : 'void';
  return wait({
    ok: true, status: b.status,
    refundAmountKes: asTeacher ? 0 : b.amount_kes,
    message: asTeacher
      ? 'Recorded as a missed session. Your consultant attended and is paid for the time held.'
      : 'Your consultant did not attend, so this session is refunded in full.',
  });
}

export async function completeBooking(ref: string) {
  const b = booked.find(x => x.ref === ref);
  if (b) b.status = 'completed';
  return wait({ ok: true, status: 'completed' });
}

// ── applying to teach ──────────────────────────────────────────────────────

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

let submittedApplication = false;

export async function applyAsConsultant(_payload: ConsultantApplication) {
  submittedApplication = true;
  return wait({ ok: true, status: 'pending' });
}

export async function getMyApplication() {
  if (persona() === 'teacher') {
    return wait({
      application: {
        status: 'approved', slug: 'grace-njeri', fullName: 'Grace Njeri',
        documentsReceived: true, appliedAt: at(-60, 9),
      },
    });
  }
  if (submittedApplication) {
    return wait({
      application: {
        status: 'pending', slug: 'you', fullName: 'You',
        documentsReceived: false, appliedAt: new Date().toISOString(),
      },
    });
  }
  return wait({ application: null });
}

// ── contact ────────────────────────────────────────────────────────────────

export async function sendContactMessage(_payload: { name?: string; email: string; subject?: string; body: string }) {
  return wait({ ok: true }, 500);
}

// ── teacher portal ─────────────────────────────────────────────────────────

export interface AvailabilityWindow { weekday: number; startMinute: number; endMinute: number }

export interface TeacherProfile {
  id: string; slug: string; fullName: string; headline?: string; status: string;
  documentsReceived: boolean; hourlyRateKes: number; sessionFeeKes: number;
  monthlyBaseKes: number; sessionModes: string[]; serviceArea?: string;
}

export interface TeacherBooking {
  ref: string; starts_at: string; duration_minutes: number; mode: string;
  location?: string; learner_note?: string; amount_kes: number; teacher_fee_kes: number;
  status: string; payout_status: string; payout_month?: string; refund_status: string;
  users?: { email: string };
}

export async function getTeacherProfile() {
  if (persona() !== 'teacher') {
    throw new ApiError(404, 'You do not have a consultant profile.');
  }
  return wait({
    consultant: {
      id: 'c-grace', slug: 'grace-njeri', fullName: 'Grace Njeri',
      headline: 'Economics teacher, 9 years in Nairobi', status: 'approved',
      documentsReceived: true, hourlyRateKes: 1500, sessionFeeKes: 900,
      monthlyBaseKes: 5000, sessionModes: ['online', 'in_person'],
      serviceArea: 'Nairobi CBD, Westlands, Kilimani',
    } as TeacherProfile,
    policy: { cancellationWindowHours: 24, reportWindowHours: 48 },
  });
}

let teacherWindows: AvailabilityWindow[] = (AVAILABILITY['grace-njeri'] ?? []).map(
  ([weekday, from, to]) => ({ weekday, startMinute: from * 60, endMinute: to * 60 }),
);

export async function getTeacherAvailability() {
  return wait({ availability: teacherWindows });
}

export async function saveTeacherAvailability(availability: AvailabilityWindow[]) {
  teacherWindows = availability;
  return wait({ ok: true, count: availability.length }, 500);
}

export async function getTeacherBookings() {
  const mine = booked.filter(b => b.slug === 'grace-njeri') as unknown as TeacherBooking[];
  return wait({
    bookings: mine,
    monthlyBaseKes: 5000,
    earnings: [
      { month: thisMonth(), sessions: 2, sessionFeesKes: 2700, paid: false },
      { month: lastMonth(), sessions: 6, sessionFeesKes: 5400, paid: true },
    ],
  });
}

// ── admin ──────────────────────────────────────────────────────────────────

export interface AdminApplication {
  id: string; slug: string; full_name: string; headline?: string; status: string;
  hourly_rate_kes: number; session_fee_kes: number; monthly_base_kes: number;
  qualifications?: string; experience_years?: number; id_last4?: string;
  documents_received: boolean; session_modes: string[]; service_area?: string;
  applied_at: string; users?: { email: string };
}

export interface PayoutRow {
  payout_month: string; consultant_id: string; full_name: string; sessions: number;
  learners_paid_kes: number; orchestra_core_kept_kes: number; session_fees_owed_kes: number;
  monthly_base_kes: number; total_owed_kes: number;
}

export interface RefundRow {
  ref: string; refund_amount_kes: number; refund_reason?: string; booking_status: string;
  starts_at: string; refund_to_phone?: string; learner_email: string; consultant: string;
}

export interface ContactRow {
  id: string; name?: string; email: string; subject?: string; body: string; created_at: string;
}

const applications: AdminApplication[] = [
  {
    id: 'a-1', slug: 'peter-kamau', full_name: 'Peter Kamau',
    headline: 'Banker, 6 years retail lending', status: 'pending',
    hourly_rate_kes: 0, session_fee_kes: 0, monthly_base_kes: 0,
    qualifications: 'BCom Finance, University of Nairobi (2018).\nACCA Part 2.\nSix years at a retail bank, latterly in lending.',
    experience_years: 6, id_last4: '4417', documents_received: true,
    session_modes: ['online'], applied_at: at(-2, 11),
    users: { email: 'peter.kamau@example.com' },
  },
  {
    id: 'a-2', slug: 'mercy-atieno', full_name: 'Mercy Atieno',
    headline: 'Secondary business studies teacher', status: 'pending',
    hourly_rate_kes: 0, session_fee_kes: 0, monthly_base_kes: 0,
    qualifications: 'BEd Business Studies, Kenyatta University (2015).\nTSC registered.\nEight years teaching, currently in Kisumu.',
    experience_years: 8, id_last4: '9082', documents_received: false,
    session_modes: ['online', 'in_person'], service_area: 'Kisumu, Kisumu West',
    applied_at: at(-1, 8), users: { email: 'mercy.atieno@example.com' },
  },
];

const messages: ContactRow[] = [
  {
    id: 'm-1', name: 'Joseph Mwangi', email: 'joseph@example.com',
    subject: 'Paid but cannot see the lessons',
    body: 'I paid this morning and got the M-Pesa message, code SLK7XQ2P9M, but when I sign in it still asks me to pay. Please help.',
    created_at: at(0, 9),
  },
  {
    id: 'm-2', name: 'Faith', email: 'faith@example.com',
    subject: 'Do you cover HELB?',
    body: 'Hi, before I pay — is there a lesson about HELB repayment? I am finishing uni next year and nobody has explained how it works.',
    created_at: at(-1, 15),
  },
];

export async function getAdminOverview() {
  if (persona() !== 'admin') throw new ApiError(404, 'Not found');

  const payouts: PayoutRow[] = [
    {
      payout_month: thisMonth(), consultant_id: 'c-grace', full_name: 'Grace Njeri',
      sessions: 2, learners_paid_kes: 4500, orchestra_core_kept_kes: 1800,
      session_fees_owed_kes: 2700, monthly_base_kes: 5000, total_owed_kes: 7700,
    },
    {
      payout_month: thisMonth(), consultant_id: 'c-amina', full_name: 'Amina Hassan',
      sessions: 3, learners_paid_kes: 4500, orchestra_core_kept_kes: 1800,
      session_fees_owed_kes: 2700, monthly_base_kes: 3000, total_owed_kes: 5700,
    },
  ];

  const refunds: RefundRow[] = booked
    .filter(b => b.refund_status === 'approved')
    .map(b => ({
      ref: b.ref, refund_amount_kes: b.amount_kes,
      refund_reason: 'Your consultant did not attend, so this session is refunded in full.',
      booking_status: b.status, starts_at: b.starts_at,
      refund_to_phone: '254712345678', learner_email: b.users?.email ?? 'learner@example.com',
      consultant: b.consultants?.full_name ?? 'Consultant',
    }));

  const attention = [{
    ref: 'OCB-DEMO-9', status: 'disputed', starts_at: at(-3, 13),
    learner_email: 'wanjiku@example.com', consultant: 'Brian Omondi',
  }];

  return wait({
    counts: {
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      payoutsDue: payouts.length,
      refundsDue: refunds.length,
      needsAttention: attention.length,
      unreadMessages: messages.length,
    },
    payouts, refunds, attention,
    applications: applications.filter(a => a.status === 'pending'),
    messages,
  });
}

export async function updateConsultantAdmin(id: string, patch: Record<string, unknown>) {
  const app = applications.find(a => a.id === id);
  if (app && typeof patch.status === 'string') app.status = patch.status;
  return wait({ ok: true }, 450);
}

export async function markPayoutPaidAdmin(_consultantId: string, _month: string, _reference: string) {
  return wait({ ok: true, sessionsSettled: 2 }, 450);
}

export async function markRefundPaidAdmin(ref: string, _reference: string) {
  const b = booked.find(x => x.ref === ref);
  if (b) b.refund_status = 'paid';
  return wait({ ok: true }, 450);
}

export async function resolveBookingAdmin(_ref: string, _payload: {
  status: string; refundAmountKes?: number; voidPayout?: boolean; note?: string;
}) {
  return wait({ ok: true }, 450);
}

export async function markMessageHandled(id: string) {
  const i = messages.findIndex(m => m.id === id);
  if (i >= 0) messages.splice(i, 1);
  return wait({ ok: true }, 350);
}
