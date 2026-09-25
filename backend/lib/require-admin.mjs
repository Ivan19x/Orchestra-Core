import { requireUser } from './require-user.mjs';

// Who counts as an administrator, from the environment rather than the
// database: there is no row anyone could edit to grant themselves access, and
// no "make me admin" endpoint to get wrong. Set ADMIN_EMAILS on Render as a
// comma-separated list.
function adminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const allowed = adminEmails();
  return allowed.length > 0 && allowed.includes(String(email || '').toLowerCase());
}

// Runs requireUser first, then checks the allow-list.
export function requireAdmin(req, res, next) {
  requireUser(req, res, () => {
    if (!isAdminEmail(req.user?.email)) {
      // Deliberately a 404: an unauthorised caller learns nothing about
      // whether these routes exist at all.
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  });
}
