import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { findUserByIdentifier, upsertUser } from '../lib/db.mjs';
import { issueOtp, verifyOtp } from '../lib/otp.mjs';
import { sendOtp } from '../lib/notify.mjs';

const router = Router();

const sendLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 3, message: { error: 'Too many OTP requests. Wait 10 minutes.' } });
const verifyLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 8, message: { error: 'Too many attempts. Wait 10 minutes.' } });

function normalise(raw) {
  const s = raw.trim().toLowerCase();
  if (s.includes('@')) return s;
  // normalise phone to E.164 for Kenya: 07xx → +2547xx, +254 → as-is
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+254${digits.slice(1)}`;
  return `+${digits}`;
}

// POST /api/auth/send-otp
router.post('/send-otp', sendLimit, async (req, res) => {
  const { identifier: raw } = req.body;
  if (!raw) return res.status(400).json({ error: 'identifier required' });

  const identifier = normalise(raw);
  try {
    const code = await issueOtp(identifier);
    await sendOtp(identifier, code);
    res.json({ ok: true, identifier });
  } catch (err) {
    console.error('send-otp error', err);
    res.status(500).json({ error: 'Failed to send code. Try again.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyLimit, async (req, res) => {
  const { identifier: raw, code } = req.body;
  if (!raw || !code) return res.status(400).json({ error: 'identifier and code required' });

  const identifier = normalise(raw);
  try {
    const valid = await verifyOtp(identifier, String(code).trim());
    if (!valid) return res.status(401).json({ error: 'Invalid or expired code.' });

    const user = await upsertUser(identifier);
    const token = jwt.sign(
      { sub: user.id, identifier, paid: user.has_paid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    res.json({
      token,
      user: { id: user.id, identifier, paid: user.has_paid, licenseKey: user.license_key },
    });
  } catch (err) {
    console.error('verify-otp error', err);
    res.status(500).json({ error: 'Verification failed. Try again.' });
  }
});

// GET /api/auth/me  — validates a JWT and returns current user
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const user = await findUserByIdentifier(payload.identifier);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ id: user.id, identifier: payload.identifier, paid: user.has_paid, licenseKey: user.license_key });
  } catch {
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
});

export default router;
