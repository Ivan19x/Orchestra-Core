import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ── users ──────────────────────────────────────────────────────────────────

export async function findUserByIdentifier(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  return data;
}

export async function getUserById(userId) {
  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function markUserPaid(userId, licenseKey) {
  const { error } = await supabase
    .from('users')
    .update({ has_paid: true, license_key: licenseKey })
    .eq('id', userId);
  if (error) throw error;
}

// Throws on a unique-constraint violation if the email already has an account —
// that's the desired behavior (signup should fail, not silently overwrite an
// existing account's password).
export async function createUserWithPassword(email, passwordHash) {
  const { data, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setUserPassword(userId, passwordHash) {
  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', userId);
  if (error) throw error;
}

// ── payments ───────────────────────────────────────────────────────────────

export async function createPayment({ userId, txRef, amount, phone }) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      tx_ref: txRef,
      amount,
      currency: 'KES',
      payment_method: 'mpesa',
      phone,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPaymentByTxRef(txRef) {
  const { data } = await supabase.from('payments').select('*').eq('tx_ref', txRef).maybeSingle();
  return data;
}

export async function getPaymentByCheckoutId(checkoutRequestId) {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('checkout_request_id', checkoutRequestId)
    .maybeSingle();
  return data;
}

export async function attachCheckoutIds(txRef, merchantRequestId, checkoutRequestId) {
  const { error } = await supabase
    .from('payments')
    .update({
      merchant_request_id: merchantRequestId,
      checkout_request_id: checkoutRequestId,
    })
    .eq('tx_ref', txRef);
  if (error) throw error;
}

// Only ever transitions a row that is still pending. The `.eq('status',
// 'pending')` filter is what makes double-completion impossible when the
// callback and the status poll race each other — the loser gets no row back
// and knows not to issue a second licence key.
export async function completePayment(txRef, mpesaReceipt) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      mpesa_receipt: mpesaReceipt ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('tx_ref', txRef)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function failPayment(txRef, resultDesc) {
  await supabase
    .from('payments')
    .update({ status: 'failed', result_desc: resultDesc ?? null })
    .eq('tx_ref', txRef)
    .eq('status', 'pending');
}
