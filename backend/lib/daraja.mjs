// Safaricom Daraja (M-Pesa) client — OAuth, STK Push, and STK Query.
//
// This is a direct integration with Safaricom, not a payment aggregator. That
// means the money lands in your own Paybill/Till and there is no per-transaction
// middleman fee beyond Safaricom's own — but it also means WE are responsible
// for the token lifecycle, the timestamp/password scheme, and reconciling the
// asynchronous callback. All of that lives in this one file.
//
// Required env (see backend/.env.example):
//   MPESA_ENV               'sandbox' | 'production'
//   MPESA_CONSUMER_KEY      from the Daraja app
//   MPESA_CONSUMER_SECRET   from the Daraja app
//   MPESA_SHORTCODE         the shortcode the passkey belongs to
//   MPESA_PASSKEY           Lipa na M-Pesa Online passkey
//   MPESA_CALLBACK_URL      public https URL Safaricom POSTs the result to
// Optional:
//   MPESA_PARTY_B           defaults to MPESA_SHORTCODE (set to the Till number
//                           when using Buy Goods, where it differs from the
//                           store/head-office number that owns the passkey)
//   MPESA_TRANSACTION_TYPE  'CustomerPayBillOnline' (default) | 'CustomerBuyGoodsOnline'

const IS_PRODUCTION = process.env.MPESA_ENV === 'production';

const BASE = IS_PRODUCTION
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

export function darajaConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE &&
    process.env.MPESA_PASSKEY &&
    process.env.MPESA_CALLBACK_URL,
  );
}

// ── Phone normalisation ────────────────────────────────────────────────────
// Daraja only accepts 2547XXXXXXXX / 2541XXXXXXXX (12 digits, no +).
export function normalizeMsisdn(input) {
  const digits = String(input || '').replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('254')) return digits;
  if (digits.length === 10 && digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) return `254${digits}`;
  return null;
}

// ── OAuth token (cached) ───────────────────────────────────────────────────
// Daraja tokens last ~3600s. Re-fetching on every request is slow and gets
// throttled, so cache it and refresh a minute before it actually expires.
let cachedToken = null;
let cachedTokenExpiry = 0;

export async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString('base64');

  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Daraja OAuth failed (${res.status}): ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  cachedTokenExpiry = Date.now() + (Number(data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

// ── Timestamp + password ───────────────────────────────────────────────────
// Safaricom wants local (EAT, UTC+3) time as YYYYMMDDHHmmss. Deriving it from
// UTC rather than the server clock's timezone means this stays correct on
// Render/Fly/anywhere, which all run in UTC.
export function darajaTimestamp(now = new Date()) {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const p = (n, len = 2) => String(n).padStart(len, '0');
  return [
    p(eat.getUTCFullYear(), 4),
    p(eat.getUTCMonth() + 1),
    p(eat.getUTCDate()),
    p(eat.getUTCHours()),
    p(eat.getUTCMinutes()),
    p(eat.getUTCSeconds()),
  ].join('');
}

function darajaPassword(timestamp) {
  return Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString('base64');
}

// ── STK Push ───────────────────────────────────────────────────────────────
// Sends the "enter your M-Pesa PIN" prompt to the customer's phone. Returns
// { merchantRequestId, checkoutRequestId } — the payment is NOT complete yet;
// the result arrives later on the callback (and can be polled via stkQuery).
export async function stkPush({ phone, amount, accountReference, description }) {
  const msisdn = normalizeMsisdn(phone);
  if (!msisdn) throw new Error('INVALID_PHONE');

  const timestamp = darajaTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE;

  const body = {
    BusinessShortCode: shortcode,
    Password: darajaPassword(timestamp),
    Timestamp: timestamp,
    TransactionType: process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    // Daraja rejects non-integer amounts outright.
    Amount: Math.round(Number(amount)),
    PartyA: msisdn,
    PartyB: process.env.MPESA_PARTY_B || shortcode,
    PhoneNumber: msisdn,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    // Shows up on the customer's M-Pesa message and your statement.
    AccountReference: String(accountReference).slice(0, 12),
    TransactionDesc: String(description).slice(0, 13),
  };

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (data.ResponseCode !== '0') {
    const detail = data.errorMessage || data.ResponseDescription || data.CustomerMessage;
    throw new Error(`STK_PUSH_FAILED: ${detail || JSON.stringify(data)}`);
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage,
    msisdn,
  };
}

// ── STK Query ──────────────────────────────────────────────────────────────
// Asks Safaricom what happened to a push. Used as the belt-and-braces path so
// a lost or delayed callback never leaves a paying customer locked out.
//
// Returns 'completed' | 'failed' | 'pending'. While the customer still has the
// PIN prompt open Daraja answers with ResultCode 1032/1037 or an error body —
// all of which mean "not done yet", not "failed".
export async function stkQuery(checkoutRequestId) {
  const timestamp = darajaTimestamp();

  const res = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: darajaPassword(timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json().catch(() => ({}));

  // "The transaction is being processed" — still waiting on the customer.
  if (data.errorCode === '500.001.1001') return { status: 'pending', raw: data };
  if (data.ResultCode === undefined) return { status: 'pending', raw: data };

  const code = String(data.ResultCode);
  if (code === '0') return { status: 'completed', desc: data.ResultDesc, raw: data };
  // 1037 = timeout waiting for the user, 1032 = cancelled by the user,
  // 1 = insufficient balance. All terminal failures.
  return { status: 'failed', desc: data.ResultDesc, raw: data };
}

// ── Callback parsing ───────────────────────────────────────────────────────
// Safaricom's callback nests the useful values in a positional metadata array.
// This flattens it into something sane.
export function parseCallback(payload) {
  const cb = payload?.Body?.stkCallback;
  if (!cb) return null;

  const items = cb.CallbackMetadata?.Item ?? [];
  const get = name => items.find(i => i.Name === name)?.Value;

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: String(cb.ResultCode),
    resultDesc: cb.ResultDesc,
    amount: get('Amount'),
    receipt: get('MpesaReceiptNumber'),
    phone: get('PhoneNumber'),
  };
}
