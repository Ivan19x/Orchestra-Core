import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import {
  findUserByIdentifier, getUserById, createPayment,
  getPaymentByTxRef, getPaymentByCheckoutId,
  attachCheckoutIds, completePayment, failPayment, markUserPaid,
} from '../lib/db.mjs';
import { generateLicenseKey } from '../lib/license.mjs';
import { sendAccessConfirmation } from '../lib/notify.mjs';
import { stkPush, stkQuery, parseCallback, normalizeMsisdn, darajaConfigured } from '../lib/daraja.mjs';
import { getBookingByCheckoutId, failBooking } from '../lib/consultants-db.mjs';
import { settleBooking } from './bookings.mjs';

const router = Router();

const initiateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { error: 'Too many payment attempts. Try again in an hour.' },
});

// The single source of truth for what we charge. Keep VITE_PRICE_KES on Vercel
// in sync so the displayed price matches the charged one.
const PRICE_KES = Number(process.env.PRICE_KES) || 200;

// ── POST /api/payment/initiate ─────────────────────────────────────────────
// Body: { identifier, phone }
// Sends the M-Pesa PIN prompt to `phone` and returns a txRef the frontend polls.
router.post('/initiate', initiateLimit, async (req, res) => {
  const { identifier, phone } = req.body;
  if (!identifier) return res.status(400).json({ error: 'identifier required' });

  const msisdn = normalizeMsisdn(phone);
  if (!msisdn) {
    return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' });
  }

  if (!darajaConfigured()) {
    console.error('payment/initiate: Daraja env vars are not fully configured');
    return res.status(503).json({ error: 'Payments are temporarily unavailable. Please try again later.' });
  }

  try {
    // Only an existing account can pay — the checkout flow creates the account
    // first, so there is never a payment with no one to attach it to.
    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ error: 'No account found. Please sign up first.' });
    if (user.has_paid) {
      return res.status(409).json({ error: 'already_paid', message: 'This account already has full access. Just sign in.' });
    }

    const txRef = `OC-${randomUUID()}`;
    await createPayment({
      userId: user.id,
      txRef,
      amount: PRICE_KES,
      phone: msisdn,
    });

    const push = await stkPush({
      phone: msisdn,
      amount: PRICE_KES,
      accountReference: 'OrchestraC',
      description: 'Full access',
    });

    await attachCheckoutIds(txRef, push.merchantRequestId, push.checkoutRequestId);

    res.json({
      ok: true,
      txRef,
      message: push.customerMessage || 'Check your phone for the M-Pesa prompt.',
    });
  } catch (err) {
    console.error('payment/initiate error', err);
    if (String(err.message).startsWith('STK_PUSH_FAILED')) {
      return res.status(502).json({ error: 'M-Pesa could not start the payment. Check the number and try again.' });
    }
    res.status(500).json({ error: 'Something went wrong starting the payment. Please try again.' });
  }
});

// ── GET /api/payment/status/:txRef ─────────────────────────────────────────
// The frontend polls this every few seconds. Two things can complete a payment:
// Safaricom's callback (fast, but can be delayed or lost) and this query
// (authoritative). Having both means a paying customer is never left locked out
// because one webhook went missing.
router.get('/status/:txRef', async (req, res) => {
  try {
    const payment = await getPaymentByTxRef(req.params.txRef);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.status !== 'pending') return res.json({ status: payment.status });

    if (payment.checkout_request_id) {
      const result = await stkQuery(payment.checkout_request_id);
      if (result.status === 'completed') {
        await handlePaymentSuccess(payment, null);
        return res.json({ status: 'completed' });
      }
      if (result.status === 'failed') {
        await failPayment(payment.tx_ref, result.desc);
        return res.json({ status: 'failed', message: result.desc });
      }
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('payment/status error', err);
    // Never fail the poll loop on a transient Daraja hiccup — just keep waiting.
    res.json({ status: 'pending' });
  }
});

// ── POST /api/payment/callback/:secret ─────────────────────────────────────
// Safaricom POSTs the STK result here. Daraja does not sign its callbacks, so
// the URL itself carries an unguessable secret and we additionally verify the
// CheckoutRequestID against a payment we actually created and the amount
// against what we asked for. Always answer 200 — a non-200 makes Safaricom
// retry the same result repeatedly.
router.post('/callback/:secret', async (req, res) => {
  const ack = () => res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  if (req.params.secret !== process.env.MPESA_CALLBACK_SECRET) {
    console.warn('payment/callback: bad secret');
    return res.status(404).json({ ResultCode: 1, ResultDesc: 'Not found' });
  }

  try {
    const cb = parseCallback(req.body);
    if (!cb) {
      console.warn('payment/callback: unrecognised payload', JSON.stringify(req.body));
      return ack();
    }

    const payment = await getPaymentByCheckoutId(cb.checkoutRequestId);
    if (!payment) {
      // Session bookings are paid through the same Daraja shortcode, so an
      // unrecognised CheckoutRequestID may well be a booking rather than a
      // curriculum purchase. Both live behind this one callback URL.
      const handled = await handleBookingCallback(cb);
      if (!handled) console.warn('payment/callback: no payment or booking for', cb.checkoutRequestId);
      return ack();
    }
    if (payment.status === 'completed') return ack();

    if (cb.resultCode !== '0') {
      await failPayment(payment.tx_ref, cb.resultDesc);
      return ack();
    }

    // Guard against an underpaid/mismatched amount ever unlocking access.
    if (Number(cb.amount) < Number(payment.amount)) {
      console.warn(`payment/callback: amount mismatch — paid ${cb.amount}, expected ${payment.amount}`);
      await failPayment(payment.tx_ref, `Amount mismatch: received ${cb.amount}`);
      return ack();
    }

    await handlePaymentSuccess(payment, cb.receipt);
    ack();
  } catch (err) {
    console.error('payment/callback error', err);
    ack();
  }
});

// A callback whose CheckoutRequestID belongs to a session booking rather than
// a curriculum purchase. Returns true if it was ours to handle.
async function handleBookingCallback(cb) {
  const booking = await getBookingByCheckoutId(cb.checkoutRequestId);
  if (!booking) return false;
  if (booking.status !== 'pending_payment') return true;

  if (cb.resultCode !== '0') {
    await failBooking(booking.ref, cb.resultDesc);
    return true;
  }
  // Same guard as the curriculum purchase: an underpayment never unlocks.
  if (Number(cb.amount) < Number(booking.amount_kes)) {
    console.warn(`booking callback: amount mismatch — paid ${cb.amount}, expected ${booking.amount_kes}`);
    await failBooking(booking.ref, `Amount mismatch: received ${cb.amount}`);
    return true;
  }

  await settleBooking(booking, cb.receipt);
  return true;
}

// Marks the payment complete, issues the access key, and emails it. Safe to
// call twice — completePayment only ever transitions a pending row.
async function handlePaymentSuccess(payment, receipt) {
  const updated = await completePayment(payment.tx_ref, receipt);
  if (!updated) return; // another path (callback vs. poll) already completed it

  const licenseKey = generateLicenseKey();
  await markUserPaid(payment.user_id, licenseKey);

  const user = await getUserById(payment.user_id);
  if (user?.email) {
    await sendAccessConfirmation(user.email, licenseKey).catch(err =>
      console.error('access confirmation email failed', err),
    );
  }
}

export default router;
