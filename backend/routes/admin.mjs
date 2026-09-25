import { Router } from 'express';
import {
  listConsultantsForAdmin, updateConsultant, listPayoutsDue, markPayoutPaid,
  listRefundsDue, listSessionsNeedingAttention, listContactMessages,
  markContactHandled, getBookingWithParties, transitionBooking,
} from '../lib/consultants-db.mjs';
import { requireAdmin } from '../lib/require-admin.mjs';
import { sendConsultantApproved, sendSessionUpdate } from '../lib/notify.mjs';

const router = Router();

// Every route here is behind requireAdmin, which answers 404 rather than 403 —
// an unauthorised caller learns nothing about what exists.
router.use(requireAdmin);

// GET /api/admin/overview — the one screen worth opening daily
router.get('/overview', async (_req, res) => {
  try {
    const [pending, payouts, refunds, attention, messages] = await Promise.all([
      listConsultantsForAdmin('pending'),
      listPayoutsDue(),
      listRefundsDue(),
      listSessionsNeedingAttention(),
      listContactMessages(false),
    ]);
    res.json({
      counts: {
        pendingApplications: pending.length,
        payoutsDue: payouts.length,
        refundsDue: refunds.length,
        needsAttention: attention.length,
        unreadMessages: messages.length,
      },
      payouts, refunds, attention,
      applications: pending,
      messages,
    });
  } catch (err) {
    console.error('admin overview error', err);
    res.status(500).json({ error: 'Could not load the overview.' });
  }
});

// GET /api/admin/consultants?status=pending
router.get('/consultants', async (req, res) => {
  try {
    res.json({ consultants: await listConsultantsForAdmin(req.query.status || undefined) });
  } catch (err) {
    console.error('admin consultants error', err);
    res.status(500).json({ error: 'Could not load consultants.' });
  }
});

// PATCH /api/admin/consultants/:id — vetting decisions and pay.
// Pay is set here and nowhere else: teachers never name their own rate.
router.patch('/consultants/:id', async (req, res) => {
  const {
    status, hourlyRateKes, sessionFeeKes, monthlyBaseKes,
    tier, documentsReceived, reviewNotes,
  } = req.body;

  const patch = {};
  if (status) {
    if (!['pending', 'verifying', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Unknown status.' });
    }
    patch.status = status;
    if (status === 'approved') patch.verified_at = new Date().toISOString();
  }

  for (const [key, value] of [
    ['hourly_rate_kes', hourlyRateKes],
    ['session_fee_kes', sessionFeeKes],
    ['monthly_base_kes', monthlyBaseKes],
  ]) {
    if (value === undefined) continue;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return res.status(400).json({ error: `${key} must be a whole number of shillings.` });
    patch[key] = n;
  }

  if (tier !== undefined) patch.tier = String(tier).slice(0, 40);
  if (documentsReceived !== undefined) patch.documents_received = Boolean(documentsReceived);
  if (reviewNotes !== undefined) patch.review_notes = String(reviewNotes).slice(0, 2000);

  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });

  try {
    const updated = await updateConsultant(req.params.id, patch);

    // Approving with no rate set would put an unbookable profile live.
    if (updated.status === 'approved' && updated.hourly_rate_kes <= 0) {
      return res.status(400).json({
        error: 'Set an hourly rate before approving — a consultant with no rate cannot be booked.',
      });
    }

    if (patch.status === 'approved') {
      const full = await listConsultantsForAdmin();
      const withEmail = full.find(c => c.id === updated.id);
      if (withEmail?.users?.email) {
        await sendConsultantApproved(withEmail.users.email, updated).catch(err =>
          console.error('approval email failed', err));
      }
    }

    res.json({ ok: true, consultant: updated });
  } catch (err) {
    console.error('admin consultant update error', err);
    res.status(500).json({ error: 'Could not update that consultant.' });
  }
});

// ── Money ──────────────────────────────────────────────────────────────────

router.get('/payouts', async (_req, res) => {
  try {
    res.json({ payouts: await listPayoutsDue() });
  } catch (err) {
    console.error('admin payouts error', err);
    res.status(500).json({ error: 'Could not load payouts.' });
  }
});

// POST /api/admin/payouts/mark-paid — after you have actually sent the money.
// Body: { consultantId, payoutMonth, reference }
router.post('/payouts/mark-paid', async (req, res) => {
  const { consultantId, payoutMonth, reference } = req.body;
  if (!consultantId || !payoutMonth) {
    return res.status(400).json({ error: 'consultantId and payoutMonth are required.' });
  }
  try {
    const settled = await markPayoutPaid(consultantId, payoutMonth, reference);
    res.json({ ok: true, sessionsSettled: settled.length });
  } catch (err) {
    console.error('mark payout error', err);
    res.status(500).json({ error: 'Could not record that payout.' });
  }
});

router.get('/refunds', async (_req, res) => {
  try {
    res.json({ refunds: await listRefundsDue() });
  } catch (err) {
    console.error('admin refunds error', err);
    res.status(500).json({ error: 'Could not load refunds.' });
  }
});

// POST /api/admin/refunds/:ref/paid — after sending the money back.
// Body: { reference }
router.post('/refunds/:ref/paid', async (req, res) => {
  try {
    const updated = await transitionBooking({
      ref: req.params.ref,
      expectedStatuses: ['cancelled', 'no_show_teacher', 'disputed', 'confirmed', 'completed'],
      patch: {
        refund_status: 'paid',
        refund_reference: req.body?.reference ? String(req.body.reference).trim() : null,
        refunded_at: new Date().toISOString(),
      },
    });
    if (!updated) return res.status(404).json({ error: 'Booking not found.' });

    const booking = await getBookingWithParties(req.params.ref);
    if (booking?.users?.email) {
      await sendSessionUpdate({
        to: booking.users.email,
        booking: updated,
        heading: 'Your refund has been sent',
        body: `We have sent ${updated.refund_amount_kes ? `KES ${updated.refund_amount_kes}` : 'your refund'} back to the M-Pesa number you paid from.`,
        consultantName: booking.consultants?.full_name,
      }).catch(err => console.error('refund email failed', err));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('refund mark error', err);
    res.status(500).json({ error: 'Could not record that refund.' });
  }
});

// POST /api/admin/bookings/:ref/resolve — settle a dispute or an unresolved session.
// Body: { status, refundAmountKes?, voidPayout?, note? }
router.post('/bookings/:ref/resolve', async (req, res) => {
  const { status, refundAmountKes, voidPayout, note } = req.body;
  const allowed = ['completed', 'cancelled', 'no_show_teacher', 'no_show_learner'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Unknown outcome.' });

  const refunding = Number(refundAmountKes) > 0;
  try {
    const updated = await transitionBooking({
      ref: req.params.ref,
      expectedStatuses: ['confirmed', 'disputed', 'no_show_teacher', 'no_show_learner', 'cancelled', 'completed'],
      patch: {
        status,
        resolution_note: note ? String(note).slice(0, 2000) : null,
        refund_status: refunding ? 'approved' : 'none',
        refund_amount_kes: refunding ? Number(refundAmountKes) : null,
        refund_reason: refunding ? (note || 'Resolved by Orchestra-Core.') : null,
        payout_status: voidPayout ? 'void' : 'unpaid',
        payout_voided_reason: voidPayout ? (note || 'Voided by Orchestra-Core.') : null,
      },
    });
    if (!updated) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ ok: true, booking: updated });
  } catch (err) {
    console.error('resolve error', err);
    res.status(500).json({ error: 'Could not resolve that session.' });
  }
});

// ── Messages ───────────────────────────────────────────────────────────────

router.get('/messages', async (req, res) => {
  try {
    res.json({ messages: await listContactMessages(req.query.handled === 'true') });
  } catch (err) {
    console.error('admin messages error', err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

router.post('/messages/:id/handled', async (req, res) => {
  try {
    await markContactHandled(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('mark message error', err);
    res.status(500).json({ error: 'Could not update that message.' });
  }
});

export default router;
