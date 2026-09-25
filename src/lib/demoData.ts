// The demo build's fake world.
//
// This file exists so the whole site can be clicked through with no backend,
// no database and no M-Pesa — for showing partners, and for reviewing design
// and copy. It is only ever bundled into `npm run build:demo`; the real build
// never imports it.
//
// State lives in memory and resets on reload, apart from the chosen persona,
// which persists so a refresh doesn't drop you back to signed-out.

import { saveSession, clearSession, dispatchSessionChange, type SessionUser } from './session';

export const DEMO = import.meta.env.VITE_DEMO === 'true';

// ── Personas ───────────────────────────────────────────────────────────────

export type PersonaId = 'visitor' | 'free' | 'paid' | 'teacher' | 'admin';

export interface Persona {
  id: PersonaId;
  label: string;
  blurb: string;
  user: SessionUser | null;
}

export const PERSONAS: Persona[] = [
  {
    id: 'visitor',
    label: 'Visitor',
    blurb: 'Signed out. Can browse, cannot read a lesson.',
    user: null,
  },
  {
    id: 'free',
    label: 'Free account',
    blurb: 'Reads the first lesson of each series. Sees the paywall on the rest.',
    user: { id: 'u-free', identifier: 'wanjiku@example.com', paid: false },
  },
  {
    id: 'paid',
    label: 'Full access',
    blurb: 'Paid. Every lesson unlocked, and has sessions booked.',
    user: { id: 'u-paid', identifier: 'otieno@example.com', paid: true, licenseKey: 'OC-7F2A91C4-B3D8-4E01-9AA7-2C55' },
  },
  {
    id: 'teacher',
    label: 'Consultant',
    blurb: 'An approved teacher. Has availability, sessions and earnings.',
    user: { id: 'u-teacher', identifier: 'grace.njeri@example.com', paid: true, licenseKey: 'OC-11B4D7E2-9C30-4F88-A612-77E9' },
  },
  {
    id: 'admin',
    label: 'Admin',
    blurb: 'You. Approvals, payouts, refunds and the inbox.',
    user: { id: 'u-admin', identifier: 'admin@orchestra-core.co.ke', paid: true, licenseKey: 'OC-ADMIN-0000-0000-0000-0001' },
  },
];

const PERSONA_KEY = 'oc_demo_persona';

export function currentPersona(): Persona {
  let id: string | null = null;
  try { id = localStorage.getItem(PERSONA_KEY); } catch { /* private window */ }
  return PERSONAS.find(p => p.id === id) ?? PERSONAS[0];
}

export function setPersona(id: PersonaId) {
  const persona = PERSONAS.find(p => p.id === id) ?? PERSONAS[0];
  try { localStorage.setItem(PERSONA_KEY, persona.id); } catch { /* ignore */ }

  if (persona.user) saveSession(`demo-token-${persona.id}`, persona.user);
  else clearSession();

  dispatchSessionChange();
}

/** Re-apply the stored persona on boot, so a refresh keeps you signed in. */
export function bootPersona() {
  const persona = currentPersona();
  if (persona.user) saveSession(`demo-token-${persona.id}`, persona.user);
  else clearSession();
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Everything is async in the real API, so the demo waits too — buttons show
 *  their loading states exactly as they will in production. */
export function wait<T>(value: T, ms = 320): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

const DAY = 86_400_000;

/** An ISO time `days` from now, at a given hour in EAT. */
export function at(days: number, hourEat: number, minute = 0): string {
  const now = new Date(Date.now() + 3 * 3_600_000); // shift to EAT
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days);
  return new Date(base + hourEat * 3_600_000 + minute * 60_000 - 3 * 3_600_000).toISOString();
}

export function thisMonth(): string {
  const eat = new Date(Date.now() + 3 * 3_600_000);
  return `${eat.getUTCFullYear()}-${String(eat.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function lastMonth(): string {
  const eat = new Date(Date.now() + 3 * 3_600_000);
  const d = new Date(Date.UTC(eat.getUTCFullYear(), eat.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// ── Consultants ────────────────────────────────────────────────────────────

export interface DemoConsultant {
  id: string;
  slug: string;
  full_name: string;
  headline: string;
  bio: string;
  photo_url?: string;
  specialities: string[];
  hourly_rate_kes: number;
  session_modes: ('online' | 'in_person')[];
  service_area?: string;
}

export const CONSULTANTS: DemoConsultant[] = [
  {
    id: 'c-grace',
    slug: 'grace-njeri',
    full_name: 'Grace Njeri',
    headline: 'Economics teacher, 9 years in Nairobi',
    bio: 'I taught secondary economics for nine years before moving into adult financial education. I am at my best with people who think they are bad at maths — usually they were just taught badly.\n\nWe work through the curriculum at whatever pace suits you, using your own payslip, your own M-Pesa statement, your own SACCO.',
    specialities: ['Budgeting', 'SACCOs', 'Payslips & tax'],
    hourly_rate_kes: 1500,
    session_modes: ['online', 'in_person'],
    service_area: 'Nairobi CBD, Westlands, Kilimani',
  },
  {
    id: 'c-brian',
    slug: 'brian-omondi',
    full_name: 'Brian Omondi',
    headline: 'CPA(K), teaches evenings and weekends',
    bio: 'Qualified accountant. I spend most sessions on the things people are quietly anxious about: debt they are not sure how to get out of, whether a loan is a good idea, and what their payslip deductions actually mean.\n\nNo judgement, and no jargon unless I explain it first.',
    specialities: ['Debt', 'Loans & credit', 'Taxes'],
    hourly_rate_kes: 1800,
    session_modes: ['online'],
  },
  {
    id: 'c-amina',
    slug: 'amina-hassan',
    full_name: 'Amina Hassan',
    headline: 'Financial literacy trainer, Mombasa',
    bio: 'I run group trainings for chamas and SACCOs, and take one-to-one sessions alongside that. Strongest on the investing series — money market funds, T-bills, and the NSE — explained for people starting from nothing.',
    specialities: ['Investing', 'Chamas', 'Money market funds'],
    hourly_rate_kes: 1500,
    session_modes: ['online', 'in_person'],
    service_area: 'Mombasa, Nyali, Bamburi',
  },
];

// Weekly availability per consultant: [weekday, startHour, endHour] in EAT.
export const AVAILABILITY: Record<string, [number, number, number][]> = {
  'grace-njeri': [[1, 9, 13], [2, 9, 17], [4, 14, 19], [6, 9, 13]],
  'brian-omondi': [[2, 18, 21], [3, 18, 21], [6, 8, 14]],
  'amina-hassan': [[1, 10, 16], [3, 10, 16], [5, 10, 14]],
};
