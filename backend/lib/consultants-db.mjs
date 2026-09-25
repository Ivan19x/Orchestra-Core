import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Columns safe to send to the public. Deliberately excludes the vetting fields
// (id_last4, review_notes, documents_received) — those are internal.
const PUBLIC_COLUMNS =
  'id, slug, full_name, headline, bio, photo_url, specialities, hourly_rate_kes, session_modes, service_area';

// ── consultants ────────────────────────────────────────────────────────────

export async function listApprovedConsultants() {
  const { data, error } = await supabase
    .from('consultants')
    .select(PUBLIC_COLUMNS)
    .eq('status', 'approved')
    .order('hourly_rate_kes', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getApprovedConsultantBySlug(slug) {
  const { data } = await supabase
    .from('consultants')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  return data;
}

// Used when creating a booking: we need the rate from the database, never from
// the browser, or the price could be edited in the request.
export async function getApprovedConsultantById(id) {
  const { data } = await supabase
    .from('consultants')
    .select('id, slug, full_name, hourly_rate_kes, session_modes, status, user_id')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();
  return data;
}

export async function getConsultantByUserId(userId) {
  const { data } = await supabase
    .from('consultants')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function slugExists(slug) {
  const { data } = await supabase.from('consultants').select('id').eq('slug', slug).maybeSingle();
  return Boolean(data);
}

export async function createApplication(fields) {
  const { data, error } = await supabase.from('consultants').insert(fields).select().single();
  if (error) throw error;
  return data;
}

// ── availability ───────────────────────────────────────────────────────────

export async function getAvailability(consultantId) {
  const { data, error } = await supabase
    .from('consultant_availability')
    .select('weekday, start_minute, end_minute')
    .eq('consultant_id', consultantId);
  if (error) throw error;
  return data ?? [];
}

// ── bookings ───────────────────────────────────────────────────────────────

// Every booking that could still occupy a slot. 'failed' and 'cancelled' are
// excluded so an abandoned payment doesn't hold a time hostage forever.
export async function getBlockingBookings(consultantId, fromIso, toIso) {
  const { data, error } = await supabase
    .from('bookings')
    .select('starts_at, duration_minutes')
    .eq('consultant_id', consultantId)
    .in('status', ['pending_payment', 'confirmed', 'completed'])
    .gte('starts_at', fromIso)
    .lte('starts_at', toIso);
  if (error) throw error;
  return data ?? [];
}

export async function createBooking(fields) {
  const { data, error } = await supabase.from('bookings').insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function getBookingByRef(ref) {
  const { data } = await supabase.from('bookings').select('*').eq('ref', ref).maybeSingle();
  return data;
}

export async function getBookingByCheckoutId(checkoutRequestId) {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('checkout_request_id', checkoutRequestId)
    .maybeSingle();
  return data;
}

export async function attachBookingCheckoutIds(ref, merchantRequestId, checkoutRequestId) {
  const { error } = await supabase
    .from('bookings')
    .update({ merchant_request_id: merchantRequestId, checkout_request_id: checkoutRequestId })
    .eq('ref', ref);
  if (error) throw error;
}

// Only ever transitions a row that is still awaiting payment, so the callback
// and the status poll racing each other cannot confirm the same booking twice.
export async function confirmBooking(ref, mpesaReceipt) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', mpesa_receipt: mpesaReceipt ?? null, paid_at: new Date().toISOString() })
    .eq('ref', ref)
    .eq('status', 'pending_payment')
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function failBooking(ref, resultDesc) {
  await supabase
    .from('bookings')
    .update({ status: 'failed', result_desc: resultDesc ?? null })
    .eq('ref', ref)
    .eq('status', 'pending_payment');
}

export async function listBookingsForUser(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('ref, starts_at, duration_minutes, mode, location, meeting_link, amount_kes, status, consultants(full_name, slug)')
    .eq('user_id', userId)
    .order('starts_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── contact ────────────────────────────────────────────────────────────────

export async function saveContactMessage(fields) {
  const { data, error } = await supabase.from('contact_messages').insert(fields).select().single();
  if (error) throw error;
  return data;
}

// ── availability (teacher-managed) ─────────────────────────────────────────

// Replaces a teacher's whole week in one go. Simpler and safer than diffing
// individual rows: the editor always submits the complete picture, so there is
// no way to end up with a half-applied schedule.
export async function replaceAvailability(consultantId, windows) {
  const { error: delError } = await supabase
    .from('consultant_availability')
    .delete()
    .eq('consultant_id', consultantId);
  if (delError) throw delError;

  if (!windows.length) return [];

  const { data, error } = await supabase
    .from('consultant_availability')
    .insert(windows.map(w => ({
      consultant_id: consultantId,
      weekday: w.weekday,
      start_minute: w.startMinute,
      end_minute: w.endMinute,
    })))
    .select();
  if (error) throw error;
  return data;
}

// ── bookings: lifecycle ────────────────────────────────────────────────────

export async function listBookingsForConsultant(consultantId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('ref, starts_at, duration_minutes, mode, location, learner_note, amount_kes, teacher_fee_kes, status, payout_status, payout_month, refund_status, users(email)')
    .eq('consultant_id', consultantId)
    .in('status', ['confirmed', 'completed', 'cancelled', 'no_show_teacher', 'no_show_learner', 'disputed'])
    .order('starts_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// One write for every lifecycle move, so a refund and a voided payout can never
// be applied half-way. `expectedStatuses` makes the update a no-op if the
// booking has already moved on — two people acting at once cannot both win.
export async function transitionBooking({ ref, expectedStatuses, patch }) {
  const { data, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('ref', ref)
    .in('status', expectedStatuses)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBookingWithParties(ref) {
  const { data } = await supabase
    .from('bookings')
    .select('*, users(email), consultants(full_name, slug, user_id)')
    .eq('ref', ref)
    .maybeSingle();
  return data;
}

// ── admin ──────────────────────────────────────────────────────────────────

export async function listConsultantsForAdmin(status) {
  let query = supabase
    .from('consultants')
    .select('id, slug, full_name, headline, status, hourly_rate_kes, session_fee_kes, monthly_base_kes, tier, qualifications, experience_years, id_last4, documents_received, session_modes, service_area, applied_at, users(email)')
    .order('applied_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateConsultant(id, patch) {
  const { data, error } = await supabase
    .from('consultants')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listPayoutsDue() {
  const { data, error } = await supabase
    .from('consultant_payouts_due')
    .select('*');
  if (error) throw error;
  return data ?? [];
}

// Settles a month for one teacher: every delivered, unpaid session in that
// month is stamped paid with the same M-Pesa reference, so the payment can be
// traced back to exactly what it covered.
export async function markPayoutPaid(consultantId, payoutMonth, reference) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      payout_status: 'paid',
      payout_reference: reference ?? null,
      payout_paid_at: new Date().toISOString(),
    })
    .eq('consultant_id', consultantId)
    .eq('payout_month', payoutMonth)
    .eq('payout_status', 'unpaid')
    .in('status', ['completed', 'no_show_learner'])
    .select('ref');
  if (error) throw error;
  return data ?? [];
}

export async function listRefundsDue() {
  const { data, error } = await supabase.from('refunds_due').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function listSessionsNeedingAttention() {
  const { data, error } = await supabase.from('sessions_needing_attention').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function listContactMessages(handled = false) {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('handled', handled)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function markContactHandled(id) {
  const { error } = await supabase.from('contact_messages').update({ handled: true }).eq('id', id);
  if (error) throw error;
}
