// The cancellation and refund rules for one-to-one sessions, in one place.
//
// This file is the single source of truth. The API enforces it, the Terms page
// describes it, and the teacher and admin screens explain it — so when a rule
// changes it changes here, and nowhere else gets to disagree.
//
// The principle underneath all of it: if the teaching did not happen, the
// learner should not be out of pocket. A refund to the learner and a voided
// payout to the teacher are two halves of one event and always move together.

/** How long before a session a learner can still call it off for a full refund. */
export const CANCELLATION_WINDOW_HOURS = 24;

/** How long after a session ends someone can report that it did not happen. */
export const REPORT_WINDOW_HOURS = 48;

function hoursUntil(startsAt, now = Date.now()) {
  return (new Date(startsAt).getTime() - now) / 3_600_000;
}

export function sessionEnded(booking, now = Date.now()) {
  const end = new Date(booking.starts_at).getTime() + booking.duration_minutes * 60_000;
  return now >= end;
}

export function withinReportWindow(booking, now = Date.now()) {
  const end = new Date(booking.starts_at).getTime() + booking.duration_minutes * 60_000;
  return now >= end && now <= end + REPORT_WINDOW_HOURS * 3_600_000;
}

/**
 * What happens when a booking is cancelled.
 *
 * `by` is 'learner' | 'teacher' | 'admin'. Returns the booking status, what to
 * refund, whether the teacher's payout survives, and a sentence explaining it
 * that is safe to show to either party.
 */
export function resolveCancellation({ booking, by, now = Date.now() }) {
  const full = booking.amount_kes;

  // A teacher calling off a session is never the learner's problem.
  if (by === 'teacher') {
    return {
      status: 'cancelled',
      refundAmountKes: full,
      voidPayout: true,
      reason: 'The consultant cancelled this session, so it is refunded in full.',
    };
  }

  if (by === 'admin') {
    return {
      status: 'cancelled',
      refundAmountKes: full,
      voidPayout: true,
      reason: 'Cancelled by Orchestra-Core and refunded in full.',
    };
  }

  // Learner cancelling.
  const notice = hoursUntil(booking.starts_at, now);
  if (notice >= CANCELLATION_WINDOW_HOURS) {
    return {
      status: 'cancelled',
      refundAmountKes: full,
      voidPayout: true,
      reason: `Cancelled with more than ${CANCELLATION_WINDOW_HOURS} hours' notice, so it is refunded in full.`,
    };
  }

  // Inside the window the teacher has already held the time and turned other
  // work away, so they are still paid and the learner is not refunded.
  return {
    status: 'cancelled',
    refundAmountKes: 0,
    voidPayout: false,
    reason: `Cancelled with less than ${CANCELLATION_WINDOW_HOURS} hours' notice, so it is not refunded — your consultant had already held the time. Get in touch if something went wrong.`,
  };
}

/**
 * What happens when someone reports that a session did not take place.
 * `by` is 'learner' (the teacher did not show) or 'teacher' (the learner did not).
 */
export function resolveNoShow({ booking, by }) {
  if (by === 'learner') {
    // The learner was not taught. They get their money back, and nobody is
    // paid for a session that did not happen.
    return {
      status: 'no_show_teacher',
      refundAmountKes: booking.amount_kes,
      voidPayout: true,
      reason: 'Your consultant did not attend, so this session is refunded in full.',
    };
  }

  // The teacher showed up and held the hour; the learner did not attend.
  return {
    status: 'no_show_learner',
    refundAmountKes: 0,
    voidPayout: false,
    reason: 'Recorded as a missed session. Your consultant attended and is paid for the time held.',
  };
}

/** Both sides claim the other did not show — a person has to decide. */
export function disputed(note) {
  return {
    status: 'disputed',
    refundAmountKes: null,
    voidPayout: false,
    reason: note || 'Both parties reported a different account of this session. Orchestra-Core will review it.',
  };
}

/**
 * Plain-language policy, exported so the website can render exactly the rules
 * the API enforces rather than a hand-written copy that drifts out of date.
 */
export const POLICY_SUMMARY = [
  {
    situation: 'Your consultant does not show up',
    outcome: 'Full refund',
    detail: `Report it within ${REPORT_WINDOW_HOURS} hours of the session time and you are refunded in full. No teaching happened, so nothing is kept and your consultant is not paid for it.`,
  },
  {
    situation: 'Your consultant cancels',
    outcome: 'Full refund',
    detail: 'Whenever they cancel, and for whatever reason, you get everything back. You can rebook with them or anyone else.',
  },
  {
    situation: `You cancel more than ${CANCELLATION_WINDOW_HOURS} hours ahead`,
    outcome: 'Full refund',
    detail: 'There is still time for your consultant to fill the slot, so nothing is kept.',
  },
  {
    situation: `You cancel less than ${CANCELLATION_WINDOW_HOURS} hours ahead`,
    outcome: 'No refund',
    detail: 'Your consultant has already set the time aside and turned other work away. If something serious came up, contact us — this is applied by people, not automatically.',
  },
  {
    situation: 'You do not attend',
    outcome: 'No refund',
    detail: 'Your consultant was there and held the hour, so they are paid for it.',
  },
  {
    situation: 'The session could not happen because of a fault on our side',
    outcome: 'Full refund',
    detail: 'If our payment or booking system caused the problem, you are refunded in full — or we rebook you, whichever you prefer.',
  },
];
