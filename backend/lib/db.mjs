import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ── users ──────────────────────────────────────────────────────────────────

export async function findUserByIdentifier(identifier) {
  const isEmail = identifier.includes('@');
  const col = isEmail ? 'email' : 'phone';
  const { data } = await supabase.from('users').select('*').eq(col, identifier).maybeSingle();
  return data;
}

export async function upsertUser(identifier) {
  const isEmail = identifier.includes('@');
  const col = isEmail ? 'email' : 'phone';
  const { data, error } = await supabase
    .from('users')
    .upsert({ [col]: identifier }, { onConflict: col, ignoreDuplicates: false })
    .select()
    .single();
  if (error) throw error;
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

// Throws on a unique-constraint violation if the identifier already has an
// account - that's the desired behavior (signup should fail, not silently
// overwrite an existing account's password).
export async function createUserWithPassword(identifier, passwordHash) {
  const isEmail = identifier.includes('@');
  const col = isEmail ? 'email' : 'phone';
  const { data, error } = await supabase
    .from('users')
    .insert({ [col]: identifier, password_hash: passwordHash })
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

// ── otp_codes ──────────────────────────────────────────────────────────────

export async function saveOtp(identifier, codeHash, expiresAt) {
  const { error } = await supabase
    .from('otp_codes')
    .insert({ identifier, code_hash: codeHash, expires_at: expiresAt });
  if (error) throw error;
}

export async function getLatestOtp(identifier) {
  const { data } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('identifier', identifier)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function markOtpUsed(id) {
  await supabase.from('otp_codes').update({ used: true }).eq('id', id);
}

// ── payments ───────────────────────────────────────────────────────────────

export async function createPayment(userId, txRef, amount, currency, method) {
  const { data, error } = await supabase
    .from('payments')
    .insert({ user_id: userId, tx_ref: txRef, amount, currency, payment_method: method, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPaymentByTxRef(txRef) {
  const { data } = await supabase.from('payments').select('*').eq('tx_ref', txRef).maybeSingle();
  return data;
}

export async function completePayment(txRef, flwTxId) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'completed', flw_tx_id: String(flwTxId) })
    .eq('tx_ref', txRef)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function failPayment(txRef) {
  await supabase.from('payments').update({ status: 'failed' }).eq('tx_ref', txRef);
}

export async function updatePaymentExternalId(txRef, externalId) {
  await supabase.from('payments').update({ flw_tx_id: String(externalId) }).eq('tx_ref', txRef);
}

export async function getPaymentByExternalId(externalId) {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('flw_tx_id', String(externalId))
    .maybeSingle();
  return data;
}
