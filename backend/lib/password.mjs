import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

// Used to keep login timing consistent whether or not the account exists -
// compares against this if no real hash is found, rather than short-circuiting.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0u';

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash || DUMMY_HASH);
}

export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}
