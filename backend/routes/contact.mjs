import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { saveContactMessage } from '../lib/consultants-db.mjs';
import { findUserByIdentifier } from '../lib/db.mjs';
import { forwardContactMessage } from '../lib/notify.mjs';

const router = Router();

const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please try again in an hour.' },
});

// POST /api/contact — the contact form. Open to signed-out visitors, but if a
// token happens to be present we attach the account so replies have context.
router.post('/', contactLimit, async (req, res) => {
  const { name, email, subject, body } = req.body;

  if (!email || !body) return res.status(400).json({ error: 'Your email and a message are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (String(body).trim().length < 10) {
    return res.status(400).json({ error: 'Please write a little more so we can help.' });
  }

  // Best-effort identification — never a reason to reject the message.
  let userId = null;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      const user = await findUserByIdentifier(payload.identifier);
      userId = user?.id ?? null;
    } catch { /* signed-out or stale token: fine */ }
  }

  try {
    const message = await saveContactMessage({
      user_id: userId,
      name: name ? String(name).trim().slice(0, 120) : null,
      email: String(email).trim().toLowerCase(),
      subject: subject ? String(subject).trim().slice(0, 160) : null,
      body: String(body).trim().slice(0, 5000),
    });

    // The message is already saved, so a mail failure must not lose it or
    // show the sender an error — it is in the database either way.
    await forwardContactMessage(message).catch(err =>
      console.error('contact forward failed', err));

    res.json({ ok: true });
  } catch (err) {
    console.error('contact error', err);
    res.status(500).json({ error: 'Could not send your message. Please email us directly.' });
  }
});

export default router;
