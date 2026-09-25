import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import {
  getApprovedConsultantBySlug, getApprovedConsultantById, getAvailability,
  getBlockingBookings, createBooking, getBookingByRef, attachBookingCheckoutIds,
  confirmBooking, failBooking, listBookingsForUser,
} from '../lib/consultants-db.mjs';
import { getUserById } from '../lib/db.mjs';
import { isSlotBookable, eatPayoutMonth } from '../lib/slots.mjs';
import { stkPush, stkQuery, normalizeMsisdn, darajaConfigured } from '../lib/daraja.mjs';
import { requireUser } from '../lib/require-user.mjs';
import { sendBookingConfirmed } from '../lib/notify.mjs';

const router = Router();

const SLOT_DAYS = 21;
const LEAD_HOURS = 12;
const ALLOWED_DURATIONS = [60, 120];

const bookLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts. Try again in an hour.' },
});

// POST /api/bookings — reserve a slot and send the M-Pesa prompt.
router.post('/', bookLimit, requireUser, async (req, res) => {
  const { consultantSlug, startsAt, durationMinutes, mode, location, learnerNote, phone } = req.body;

  if (!consultantSlug || !startsAt || !mode) {
    return res.status(400).json({ error: 'Choose a consultant, a time and a session type.' });
  }

  const duration = Number(durationMinutes) || 60;
  if (!ALLOWED_DURATIONS.includes(duration)) {
    return res.status(400).json({ error: 'Sessions are 1 or 2 hours.' });
  }

  const msisdn = normalizeMsisdn(phone);
  if (!msisdn) return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' });

  if (!darajaConfigured()) {
    console.error('bookings: Daraja env vars are not fully configured');
    return res.status(503).json({ error: 'Payments are temporarily unavailable. Please try again later.' });
  }

  try {
    const summary = await getApprovedConsultantBySlug(consultantSlug);
    if (!summary) return res.status(404).json({ error: 'Consultant not found.' });

    // Re-read pricing from the database rather than trusting the request: the
    // browser knows the rate only to display it.
    const consultant = await getApprovedConsultantById(summary.id);
    if (!consultant) return res.status(404).json({ error: 'Consultant not found.' });

    if (!consultant.session_modes?.includes(mode)) {
      return res.status(400).json({ error: 'That consultant does not offer that kind of session.' });
    }
    if (mode === 'in_person' && !location) {
      return res.status(400).json({ error: 'Tell us where the in-person session should happen.' });
    }

    // The slot has to still be one this teacher offers, and still be free.
    const from = new Date().toISOString();
    const to = new Date(Date.now() + (SLOT_DAYS + 1) * 86_400_000).toISOString();
    const [availability, busy] = await Promise.all([
      getAvailability(consultant.id),
      getBlockingBookings(consultant.id, from, to),
    ]);

    const bookable = isSlotBookable({
      startsAt, availability, busy,
      durationMinutes: duration, days: SLOT_DAYS, leadHours: LEAD_HOURS,
    });
    if (!bookable) {
      return res.status(409).json({ error: 'That time has just been taken or is no longer available. Pick another.' });
    }

    // Money, all derived here and snapshotted onto the row.
    const hours = duration / 60;
    const amount = Math.round(consultant.hourly_rate_kes * hours);
    const teacherFee = Math.round(consultant.session_fee_kes * hours);
    // Never let a mispriced teacher produce a negative platform fee.
    const platformFee = Math.max(0, amount - teacherFee);

    if (amount <= 0) {
      return res.status(409).json({ error: 'This consultant is not bookable yet. Please try another.' });
    }

    const ref = `OCB-${randomUUID()}`;
    await createBooking({
      ref,
      consultant_id: consultant.id,
      user_id: req.user.id,
      starts_at: new Date(startsAt).toISOString(),
      duration_minutes: duration,
      mode,
      location: mode === 'in_person' ? String(location).trim() : null,
      learner_note: learnerNote ? String(learnerNote).trim().slice(0, 1000) : null,
      hourly_rate_kes: consultant.hourly_rate_kes,
      amount_kes: amount,
      teacher_fee_kes: teacherFee,
      platform_fee_kes: platformFee,
      phone: msisdn,
      payout_month: eatPayoutMonth(startsAt),
      status: 'pending_payment',
    });

    const push = await stkPush({
      phone: msisdn,
      amount,
      accountReference: 'OCSession',
      description: 'Session',
    });
    await attachBookingCheckoutIds(ref, push.merchantRequestId, push.checkoutRequestId);

    res.json({
      ok: true,
      ref,
      amountKes: amount,
      message: push.customerMessage || 'Check your phone for the M-Pesa prompt.',
    });
  } catch (err) {
    console.error('booking create error', err);
    if (String(err.message).startsWith('STK_PUSH_FAILED')) {
      return res.status(502).json({ error: 'M-Pesa could not start the payment. Check the number and try again.' });
    }
    res.status(500).json({ error: 'Could not start the booking. Please try again.' });
  }
});

// GET /api/bookings/:ref/status — polled by the browser while the learner pays.
// As with the curriculum purchase, both this and Safaricom's callback can
// confirm a booking; whichever arrives first wins and the other is a no-op.
router.get('/:ref/status', requireUser, async (req, res) => {
  try {
    const booking = await getBookingByRef(req.params.ref);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ error: 'Not your booking.' });
    if (booking.status !== 'pending_payment') return res.json({ status: booking.status });

    if (booking.checkout_request_id) {
      const result = await stkQuery(booking.checkout_request_id);
      if (result.status === 'completed') {
        await settleBooking(booking, null);
        return res.json({ status: 'confirmed' });
      }
      if (result.status === 'failed') {
        await failBooking(booking.ref, result.desc);
        return res.json({ status: 'failed', message: result.desc });
      }
    }

    res.json({ status: 'pending_payment' });
  } catch (err) {
    console.error('booking status error', err);
    // A transient Daraja hiccup must not break the poll loop.
    res.json({ status: 'pending_payment' });
  }
});

// GET /api/bookings/mine — the learner's own sessions
router.get('/mine', requireUser, async (req, res) => {
  try {
    res.json({ bookings: await listBookingsForUser(req.user.id) });
  } catch (err) {
    console.error('bookings list error', err);
    res.status(500).json({ error: 'Could not load your sessions.' });
  }
});

// Shared by the poll above and the M-Pesa callback.
export async function settleBooking(booking, receipt) {
  const confirmed = await confirmBooking(booking.ref, receipt);
  if (!confirmed) return; // the other path got there first

  const [consultant, learner] = await Promise.all([
    getApprovedConsultantById(booking.consultant_id),
    getUserById(booking.user_id),
  ]);

  if (learner?.email) {
    await sendBookingConfirmed(confirmed, consultant, learner.email).catch(err =>
      console.error('booking confirmation email failed', err));
  }
}

export default router;
