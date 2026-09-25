import { Router } from 'express';
import {
  getConsultantByUserId, getAvailability, replaceAvailability,
  listBookingsForConsultant,
} from '../lib/consultants-db.mjs';
import { requireUser } from '../lib/require-user.mjs';
import { CANCELLATION_WINDOW_HOURS, REPORT_WINDOW_HOURS } from '../lib/session-policy.mjs';

const router = Router();

// Everything here is scoped to the signed-in teacher's own consultant row —
// there is no route that takes a consultant id from the request, so one
// teacher can never read or edit another's schedule.
async function loadMe(req, res, next) {
  const consultant = await getConsultantByUserId(req.user.id);
  if (!consultant) return res.status(404).json({ error: 'You do not have a consultant profile.' });
  req.consultant = consultant;
  next();
}

// GET /api/teacher/me — profile, pay and where the application stands
router.get('/me', requireUser, loadMe, (req, res) => {
  const c = req.consultant;
  res.json({
    consultant: {
      id: c.id,
      slug: c.slug,
      fullName: c.full_name,
      headline: c.headline,
      status: c.status,
      documentsReceived: c.documents_received,
      // Pay is set by Orchestra-Core; shown here so a teacher always knows
      // exactly what they earn without having to ask.
      hourlyRateKes: c.hourly_rate_kes,
      sessionFeeKes: c.session_fee_kes,
      monthlyBaseKes: c.monthly_base_kes,
      sessionModes: c.session_modes,
      serviceArea: c.service_area,
    },
    policy: {
      cancellationWindowHours: CANCELLATION_WINDOW_HOURS,
      reportWindowHours: REPORT_WINDOW_HOURS,
    },
  });
});

// GET /api/teacher/availability
router.get('/availability', requireUser, loadMe, async (req, res) => {
  try {
    const windows = await getAvailability(req.consultant.id);
    res.json({
      availability: windows.map(w => ({
        weekday: w.weekday,
        startMinute: w.start_minute,
        endMinute: w.end_minute,
      })),
    });
  } catch (err) {
    console.error('availability read error', err);
    res.status(500).json({ error: 'Could not load your availability.' });
  }
});

// PUT /api/teacher/availability — replaces the whole week.
// Body: { availability: [{ weekday, startMinute, endMinute }] }
router.put('/availability', requireUser, loadMe, async (req, res) => {
  const windows = req.body?.availability;
  if (!Array.isArray(windows)) return res.status(400).json({ error: 'availability must be a list.' });
  if (windows.length > 40) return res.status(400).json({ error: 'That is too many time windows.' });

  for (const w of windows) {
    const { weekday, startMinute, endMinute } = w ?? {};
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: 'Each window needs a valid day.' });
    }
    if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
      return res.status(400).json({ error: 'Each window needs a start and an end time.' });
    }
    if (startMinute < 0 || endMinute > 1440 || endMinute <= startMinute) {
      return res.status(400).json({ error: 'A window must end after it starts, within the same day.' });
    }
  }

  // Overlapping windows on the same day would generate duplicate slots.
  const byDay = new Map();
  for (const w of windows) {
    const day = byDay.get(w.weekday) ?? [];
    day.push(w);
    byDay.set(w.weekday, day);
  }
  for (const [, day] of byDay) {
    const sorted = [...day].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMinute < sorted[i - 1].endMinute) {
        return res.status(400).json({ error: 'Two of your time windows overlap on the same day.' });
      }
    }
  }

  try {
    await replaceAvailability(req.consultant.id, windows);
    res.json({ ok: true, count: windows.length });
  } catch (err) {
    console.error('availability write error', err);
    res.status(500).json({ error: 'Could not save your availability.' });
  }
});

// GET /api/teacher/bookings — their sessions, plus what they have earned
router.get('/bookings', requireUser, loadMe, async (req, res) => {
  try {
    const bookings = await listBookingsForConsultant(req.consultant.id);

    // Earnings by month: only sessions that actually count towards pay.
    const earned = new Map();
    for (const b of bookings) {
      if (!['completed', 'no_show_learner'].includes(b.status)) continue;
      if (b.payout_status === 'void') continue;
      const month = b.payout_month ?? 'unknown';
      const row = earned.get(month) ?? { month, sessions: 0, sessionFeesKes: 0, paid: true };
      row.sessions += 1;
      row.sessionFeesKes += b.teacher_fee_kes ?? 0;
      if (b.payout_status !== 'paid') row.paid = false;
      earned.set(month, row);
    }

    res.json({
      bookings,
      monthlyBaseKes: req.consultant.monthly_base_kes,
      earnings: [...earned.values()].sort((a, b) => b.month.localeCompare(a.month)),
    });
  } catch (err) {
    console.error('teacher bookings error', err);
    res.status(500).json({ error: 'Could not load your sessions.' });
  }
});

export default router;
