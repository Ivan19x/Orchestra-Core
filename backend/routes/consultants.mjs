import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  listApprovedConsultants, getApprovedConsultantBySlug, getConsultantByUserId,
  getAvailability, getBlockingBookings, slugExists, createApplication,
} from '../lib/consultants-db.mjs';
import { generateSlots } from '../lib/slots.mjs';
import { requireUser } from '../lib/require-user.mjs';
import { sendApplicationReceived, notifyNewApplication } from '../lib/notify.mjs';

const router = Router();

const SLOT_DAYS = 21;      // how far ahead someone can book
const LEAD_HOURS = 12;     // minimum notice, so nobody books a session for 20 minutes' time

const applyLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { error: 'You have already applied recently. We will be in touch.' },
});

// GET /api/consultants — the public directory
router.get('/', async (_req, res) => {
  try {
    res.json({ consultants: await listApprovedConsultants() });
  } catch (err) {
    console.error('consultants list error', err);
    res.status(500).json({ error: 'Could not load consultants.' });
  }
});

// GET /api/consultants/:slug — one public profile
router.get('/:slug', async (req, res) => {
  try {
    const consultant = await getApprovedConsultantBySlug(req.params.slug);
    if (!consultant) return res.status(404).json({ error: 'Consultant not found.' });
    res.json({ consultant });
  } catch (err) {
    console.error('consultant fetch error', err);
    res.status(500).json({ error: 'Could not load that consultant.' });
  }
});

// GET /api/consultants/:slug/slots?duration=60 — free times for the next few weeks
router.get('/:slug/slots', async (req, res) => {
  const durationMinutes = Number(req.query.duration) || 60;
  if (![60, 120].includes(durationMinutes)) {
    return res.status(400).json({ error: 'Sessions are 60 or 120 minutes.' });
  }

  try {
    const consultant = await getApprovedConsultantBySlug(req.params.slug);
    if (!consultant) return res.status(404).json({ error: 'Consultant not found.' });

    const from = new Date().toISOString();
    const to = new Date(Date.now() + (SLOT_DAYS + 1) * 86_400_000).toISOString();

    const [availability, busy] = await Promise.all([
      getAvailability(consultant.id),
      getBlockingBookings(consultant.id, from, to),
    ]);

    res.json({
      durationMinutes,
      slots: generateSlots({ availability, busy, durationMinutes, days: SLOT_DAYS, leadHours: LEAD_HOURS }),
    });
  } catch (err) {
    console.error('slots error', err);
    res.status(500).json({ error: 'Could not load available times.' });
  }
});

// ── Applying to teach ───────────────────────────────────────────────────────

function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40) || 'teacher';
}

async function uniqueSlug(name) {
  const base = slugify(name);
  if (!(await slugExists(base))) return base;
  for (let i = 2; i < 50; i++) {
    const candidate = `${base}-${i}`;
    if (!(await slugExists(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// POST /api/consultants/apply — a teacher applies. Requires an account, so we
// know who they are and can write back to them.
//
// Note what this does NOT accept: a rate. Teachers deliver Orchestra-Core's
// curriculum, so pricing is set by Orchestra-Core after review — that is the
// whole point of routing payment through the site.
router.post('/apply', applyLimit, requireUser, async (req, res) => {
  const {
    fullName, headline, bio, qualifications, experienceYears,
    idLast4, specialities, sessionModes, serviceArea,
  } = req.body;

  if (!fullName || !bio || !qualifications) {
    return res.status(400).json({ error: 'Your name, a short bio and your qualifications are required.' });
  }

  const modes = Array.isArray(sessionModes) && sessionModes.length ? sessionModes : ['online'];
  if (modes.some(m => !['online', 'in_person'].includes(m))) {
    return res.status(400).json({ error: 'Sessions can be online, in person, or both.' });
  }
  if (modes.includes('in_person') && !serviceArea) {
    return res.status(400).json({ error: 'Tell us which areas you can travel to for in-person sessions.' });
  }

  try {
    const existing = await getConsultantByUserId(req.user.id);
    if (existing) {
      return res.status(409).json({
        error: 'You have already applied.',
        status: existing.status,
      });
    }

    const application = await createApplication({
      user_id: req.user.id,
      slug: await uniqueSlug(fullName),
      full_name: String(fullName).trim(),
      headline: headline ? String(headline).trim().slice(0, 120) : null,
      bio: String(bio).trim(),
      qualifications: String(qualifications).trim(),
      experience_years: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : null,
      // Only the last four digits — see the note in supabase-schema.sql.
      id_last4: idLast4 ? String(idLast4).replace(/\D/g, '').slice(-4) : null,
      specialities: Array.isArray(specialities) ? specialities.slice(0, 8) : [],
      session_modes: modes,
      service_area: serviceArea ? String(serviceArea).trim() : null,
      status: 'pending',
    });

    // Neither of these should be able to fail the application itself.
    await sendApplicationReceived(req.user.email, application.full_name).catch(err =>
      console.error('application email failed', err));
    await notifyNewApplication(application, req.user.email).catch(err =>
      console.error('admin notification failed', err));

    res.json({ ok: true, status: application.status });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'You have already applied.' });
    }
    console.error('consultant apply error', err);
    res.status(500).json({ error: 'Could not submit your application. Try again.' });
  }
});

// GET /api/consultants/me/application — lets an applicant see where they stand
router.get('/me/application', requireUser, async (req, res) => {
  try {
    const application = await getConsultantByUserId(req.user.id);
    if (!application) return res.json({ application: null });
    res.json({
      application: {
        status: application.status,
        slug: application.slug,
        fullName: application.full_name,
        documentsReceived: application.documents_received,
        appliedAt: application.applied_at,
      },
    });
  } catch (err) {
    console.error('application status error', err);
    res.status(500).json({ error: 'Could not load your application.' });
  }
});

export default router;
