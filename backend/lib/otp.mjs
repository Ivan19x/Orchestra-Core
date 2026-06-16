import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { saveOtp, getLatestOtp, markOtpUsed } from './db.mjs';

const OTP_TTL_MINUTES = 10;
const BCRYPT_ROUNDS = 8;

export function generateCode() {
  return String(randomInt(100000, 999999));
}

export async function issueOtp(identifier) {
  const code = generateCode();
  const hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
  await saveOtp(identifier, hash, expiresAt);
  return code;
}

export async function verifyOtp(identifier, code) {
  const row = await getLatestOtp(identifier);
  if (!row) return false;
  const valid = await bcrypt.compare(code, row.code_hash);
  if (!valid) return false;
  await markOtpUsed(row.id);
  return true;
}
