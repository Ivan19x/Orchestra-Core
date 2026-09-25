// Turning weekly availability into concrete bookable times.
//
// Kenya is UTC+3 all year with no daylight saving, so a fixed offset is correct
// here and avoids dragging in a timezone library. Availability is stored as
// minutes from midnight EAT; everything leaves this module as a UTC ISO string,
// and the browser renders it back in the viewer's local time.

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

/** 'YYYY-MM' for the month an instant falls in, in EAT — used to bucket payouts. */
export function eatPayoutMonth(date) {
  const eat = new Date(new Date(date).getTime() + EAT_OFFSET_MS);
  return `${eat.getUTCFullYear()}-${String(eat.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Midnight EAT on the calendar day `offsetDays` from now, as a UTC timestamp. */
function eatMidnightUtc(offsetDays) {
  const eatNow = new Date(Date.now() + EAT_OFFSET_MS);
  const day = Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate() + offsetDays);
  return day - EAT_OFFSET_MS;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Free, bookable start times for one teacher.
 *
 * `busy` must include bookings that are still awaiting payment, not just paid
 * ones — otherwise two people can be part-way through paying for the same hour.
 */
export function generateSlots({ availability, busy = [], durationMinutes = 60, days = 21, leadHours = 12 }) {
  const earliest = Date.now() + leadHours * 60 * 60 * 1000;

  const taken = busy.map(b => {
    const start = new Date(b.starts_at).getTime();
    return [start, start + (b.duration_minutes ?? 60) * 60_000];
  });

  const slots = [];

  for (let d = 0; d < days; d++) {
    const midnightUtc = eatMidnightUtc(d);
    // Weekday of that EAT calendar day (0 = Sunday), matching the stored value.
    const weekday = new Date(midnightUtc + EAT_OFFSET_MS).getUTCDay();

    for (const window of availability.filter(a => a.weekday === weekday)) {
      // Step by the session length: a 2-hour booking starts on a 2-hour grid
      // within the window, so we never offer a slot that can't fit.
      for (let m = window.start_minute; m + durationMinutes <= window.end_minute; m += durationMinutes) {
        const start = midnightUtc + m * 60_000;
        const end = start + durationMinutes * 60_000;

        if (start < earliest) continue;
        if (taken.some(([bs, be]) => overlaps(start, end, bs, be))) continue;

        slots.push(new Date(start).toISOString());
      }
    }
  }

  return slots.sort();
}

/**
 * Is `startsAt` a slot this teacher actually offers, and still free?
 * The browser sends a time back to us, so it has to be re-checked server-side —
 * a hand-edited request must not be able to book 3am or double-book an hour.
 */
export function isSlotBookable({ startsAt, availability, busy, durationMinutes, days, leadHours }) {
  const wanted = new Date(startsAt).toISOString();
  return generateSlots({ availability, busy, durationMinutes, days, leadHours }).includes(wanted);
}
