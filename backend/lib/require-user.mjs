import jwt from 'jsonwebtoken';
import { findUserByIdentifier } from './db.mjs';

// Express middleware: verifies the bearer token and attaches `req.user`.
// Routes that move money or create records on someone's behalf must use this —
// trusting an identifier from the request body would let anyone book, or pay,
// as anyone else.
export async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }

  const user = await findUserByIdentifier(payload.identifier);
  if (!user) return res.status(401).json({ error: 'Account not found.' });

  req.user = user;
  next();
}
