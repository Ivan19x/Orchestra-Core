import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import {
  upsertUser, getUserById, createPayment,
  getPaymentByTxRef, getPaymentByExternalId,
  updatePaymentExternalId, completePayment, failPayment, markUserPaid,
} from '../lib/db.mjs';
import { generateLicenseKey } from '../lib/license.mjs';
import { sendLicenseConfirmation } from '../lib/notify.mjs';

const router = Router();

const initiateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Too many payment attempts. Try again later.' } });

const PRICE_KES = 1500;
const TESTING_FREE = process.env.TESTING_FREE === 'true';

// Live keys contain "_live_"; test keys contain "_test_"
const IS_BASE = (process.env.INTASEND_PUBLISHABLE_KEY ?? '').includes('_live_')
  ? 'https://payment.intasend.com/api/v1'
  : 'https://sandbox.intasend.com/api/v1';

function isHeaders() {
  return {
    Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;   // +254XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`; // 07XXXXXXXX
  if (digits.length === 9) return `254${digits}`;                         // 7XXXXXXXX
  return digits;
}

// POST /api/payment/initiate
// Body: { identifier, method: 'mpesa' | 'card', mpesaPhone? }
router.post('/initiate', initiateLimit, async (req, res) => {
  const { identifier, method, mpesaPhone } = req.body;
  if (!identifier || !method) return res.status(400).json({ error: 'identifier and method required' });
  const validMethods = TESTING_FREE ? ['mpesa', 'card', 'free'] : ['mpesa', 'card'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'method must be mpesa or card' });

  try {
    const user = await upsertUser(identifier);
    if (user.has_paid) return res.status(409).json({ error: 'already_paid', message: 'This account already has a licence. Sign in to access your download.' });

    const txRef = `OC-${randomUUID()}`;
    await createPayment(user.id, txRef, TESTING_FREE ? 0 : PRICE_KES, 'KES', method);

    // Testing phase: skip payment entirely and grant access immediately
    if (TESTING_FREE) {
      await handlePaymentSuccess({ user_id: user.id }, txRef, 'testing-free');
      return res.json({ ok: true, method: 'free', txRef });
    }

    const isEmail = identifier.includes('@');
    const customerEmail = isEmail ? identifier : 'customer@orchestracore.com';
    const customerPhone = normalizePhone(mpesaPhone || (!isEmail ? identifier : ''));
    const redirectUrl = `${process.env.FRONTEND_URL}/checkout?step=card-return&tx_ref=${txRef}`;

    if (method === 'mpesa') {
      const body = {
        public_key: process.env.INTASEND_PUBLISHABLE_KEY,
        currency: 'KES',
        email: customerEmail,
        first_name: 'Customer',
        last_name: '',
        phone_number: customerPhone,
        amount: PRICE_KES,
        narrative: 'Orchestra-Core Lifetime Access',
      };
      const r = await fetch(`${IS_BASE}/payment/mpesa-stk-push/`, {
        method: 'POST', headers: isHeaders(), body: JSON.stringify(body),
      });
      const data = await r.json();
      console.log('IntaSend STK response:', JSON.stringify(data));
      if (!data.invoice?.invoice_id) {
        await failPayment(txRef);
        const msg = data.details?.[0] || data.detail || data.message || 'M-Pesa request failed. Check the number and try again.';
        return res.status(502).json({ error: msg });
      }
      // Store invoice_id so status polling can check it
      await updatePaymentExternalId(txRef, data.invoice.invoice_id);
      return res.json({ ok: true, method: 'mpesa', txRef, message: 'Check your phone for the M-Pesa prompt.' });
    }

    // card: generate IntaSend hosted checkout link
    const body = {
      public_key: process.env.INTASEND_PUBLISHABLE_KEY,
      currency: 'KES',
      email: customerEmail,
      first_name: 'Customer',
      last_name: '',
      phone_number: customerPhone,
      amount: PRICE_KES,
      comment: 'Orchestra-Core Lifetime Access',
      redirect_url: redirectUrl,
    };
    const r = await fetch(`${IS_BASE}/checkout/`, {
      method: 'POST', headers: isHeaders(), body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!data.url) {
      await failPayment(txRef);
      return res.status(502).json({ error: 'Could not start payment. Try again.' });
    }
    await updatePaymentExternalId(txRef, data.id);
    res.json({ ok: true, method: 'card', txRef, paymentLink: data.url });
  } catch (err) {
    console.error('payment/initiate error', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/payment/status/:txRef — frontend polls this for M-Pesa completion
router.get('/status/:txRef', async (req, res) => {
  const payment = await getPaymentByTxRef(req.params.txRef);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });
  if (payment.status !== 'pending') return res.json({ status: payment.status });

  // Poll IntaSend for live status
  if (payment.flw_tx_id) {
    try {
      const r = await fetch(`${IS_BASE}/payment/status/`, {
        method: 'POST',
        headers: isHeaders(),
        body: JSON.stringify({ invoice_id: payment.flw_tx_id }),
      });
      const { invoice } = await r.json();
      if (invoice?.state === 'COMPLETE') {
        await handlePaymentSuccess(payment, req.params.txRef, payment.flw_tx_id);
        return res.json({ status: 'completed' });
      }
      if (invoice?.state === 'FAILED' || invoice?.state === 'CANCELLED') {
        await failPayment(req.params.txRef);
        return res.json({ status: 'failed' });
      }
    } catch (err) {
      console.error('status check error', err);
    }
  }

  res.json({ status: payment.status });
});

// POST /api/payment/verify — called after card redirect returns to our site
// Body: { tx_ref, invoice_id? }
router.post('/verify', async (req, res) => {
  const { tx_ref, invoice_id } = req.body;
  if (!tx_ref) return res.status(400).json({ error: 'tx_ref required' });

  const payment = await getPaymentByTxRef(tx_ref);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });
  if (payment.status === 'completed') return res.json({ ok: true, already: true });

  try {
    const invoiceId = invoice_id || payment.flw_tx_id;
    if (invoiceId) {
      const r = await fetch(`${IS_BASE}/payment/status/`, {
        method: 'POST',
        headers: isHeaders(),
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const { invoice } = await r.json();
      if (invoice?.state === 'COMPLETE') {
        await handlePaymentSuccess(payment, tx_ref, invoiceId);
        return res.json({ ok: true });
      }
      if (invoice?.state === 'FAILED' || invoice?.state === 'CANCELLED') {
        await failPayment(tx_ref);
        return res.status(402).json({ error: 'Payment was not successful.' });
      }
    }
    // Webhook may have already processed it between our check and now
    const fresh = await getPaymentByTxRef(tx_ref);
    if (fresh?.status === 'completed') return res.json({ ok: true });
    res.status(202).json({ pending: true, message: 'Payment still processing. Please wait a moment.' });
  } catch (err) {
    console.error('payment/verify error', err);
    res.status(500).json({ error: 'Could not verify payment. Contact support if you were charged.' });
  }
});

// POST /api/payment/webhook — IntaSend fires this on payment events
// IntaSend authenticates webhooks by including the webhook secret as a 'challenge' field in the body
router.post('/webhook', async (req, res) => {
  if (req.body.challenge !== process.env.INTASEND_WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorised');
  }

  const { invoice_id, state } = req.body;

  if (state === 'COMPLETE' && invoice_id) {
    const payment = await getPaymentByExternalId(invoice_id);
    if (payment && payment.status !== 'completed') {
      await handlePaymentSuccess(payment, payment.tx_ref, invoice_id);
    }
  } else if ((state === 'FAILED' || state === 'CANCELLED') && invoice_id) {
    const payment = await getPaymentByExternalId(invoice_id);
    if (payment) await failPayment(payment.tx_ref).catch(() => {});
  }

  res.sendStatus(200);
});

async function handlePaymentSuccess(payment, txRef, externalId) {
  const licenseKey = generateLicenseKey();
  await completePayment(txRef, externalId);
  await markUserPaid(payment.user_id, licenseKey);
  const user = await getUserById(payment.user_id);
  const identifier = user?.email || user?.phone;
  if (identifier) await sendLicenseConfirmation(identifier, licenseKey).catch(console.error);
}

export default router;
