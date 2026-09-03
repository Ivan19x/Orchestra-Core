import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { findUserByIdentifier, createUserWithPassword, setUserPassword } from '../lib/db.mjs';
import { sendPasswordReset } from '../lib/notify.mjs';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password.mjs';

const router = Router();

// Shared by signup and login.
const authLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Wait 10 minutes.' },
});

function issueToken(user, email) {
  return jwt.sign(
    { sub: user.id, identifier: email, paid: user.has_paid },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

function userResponse(user, email) {
  return { id: user.id, identifier: email, paid: user.has_paid, licenseKey: user.license_key };
}

function normalise(raw) {
  return String(raw).trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// POST /api/auth/signup — Body: { identifier, password }
router.post('/signup', authLimit, async (req, res) => {
  const { identifier: raw, password } = req.body;
  if (!raw || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const email = normalise(raw);
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  const strengthError = validatePasswordStrength(password);
  if (strengthError) return res.status(400).json({ error: strengthError });

  try {
    const existing = await findUserByIdentifier(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }

    const user = await createUserWithPassword(email, await hashPassword(password));
    res.json({ token: issueToken(user, email), user: userResponse(user, email) });
  } catch (err) {
    // A race between two signups for the same email surfaces as a unique
    // violation — report it as the conflict it is, not a 500.
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }
    console.error('signup error', err);
    res.status(500).json({ error: 'Could not create account. Try again.' });
  }
});

// POST /api/auth/login — Body: { identifier, password }
router.post('/login', authLimit, async (req, res) => {
  const { identifier: raw, password } = req.body;
  if (!raw || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const email = normalise(raw);
  try {
    const user = await findUserByIdentifier(email);
    // Always run the comparison, even with no user, so response timing doesn't
    // reveal which emails have accounts.
    const valid = await verifyPassword(password, user?.password_hash);
    if (!user || !user.password_hash || !valid) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    res.json({ token: issueToken(user, email), user: userResponse(user, email) });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Sign in failed. Try again.' });
  }
});

// ── Password reset (emailed 10-minute link) ────────────────────────────────
const resetLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reset requests. Wait 10 minutes.' },
});

// A reset token is a short-lived JWT bound to a fingerprint of the user's
// CURRENT password hash. Once the password changes that fingerprint changes,
// so the link becomes single-use without needing any DB state.
function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(passwordHash || 'none').digest('hex').slice(0, 16);
}

// POST /api/auth/request-reset — Body: { identifier }
// Always responds 200 so it can't be used to probe which emails have accounts.
router.post('/request-reset', resetLimit, async (req, res) => {
  const { identifier: raw } = req.body;
  if (!raw) return res.status(400).json({ error: 'Email is required.' });

  const email = normalise(raw);
  try {
    if (isEmail(email)) {
      const user = await findUserByIdentifier(email);
      if (user) {
        const token = jwt.sign(
          { sub: user.id, identifier: email, purpose: 'reset', pf: passwordFingerprint(user.password_hash) },
          process.env.JWT_SECRET,
          { expiresIn: '10m' },
        );
        const link = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
        await sendPasswordReset(email, link).catch(err => console.error('reset email failed', err));
      }
    }
  } catch (err) {
    console.error('request-reset error', err);
  }
  res.json({ ok: true });
});

// POST /api/auth/reset-password — Body: { token, password }
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password are required.' });

  const strengthError = validatePasswordStrength(password);
  if (strengthError) return res.status(400).json({ error: strengthError });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
  }
  if (payload.purpose !== 'reset') return res.status(400).json({ error: 'Invalid reset link.' });

  try {
    const user = await findUserByIdentifier(payload.identifier);
    if (!user) return res.status(400).json({ error: 'Invalid reset link.' });
    if (payload.pf !== passwordFingerprint(user.password_hash)) {
      return res.status(400).json({ error: 'This reset link has already been used. Request a new one.' });
    }

    const passwordHash = await hashPassword(password);
    await setUserPassword(user.id, passwordHash);
    const updated = { ...user, password_hash: passwordHash };
    res.json({ token: issueToken(updated, payload.identifier), user: userResponse(updated, payload.identifier) });
  } catch (err) {
    console.error('reset-password error', err);
    res.status(500).json({ error: 'Could not reset password. Try again.' });
  }
});

// GET /api/auth/me — validates a JWT and returns the current user
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const user = await findUserByIdentifier(payload.identifier);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      id: user.id,
      identifier: payload.identifier,
      paid: user.has_paid,
      licenseKey: user.license_key,
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
});

export default router;
