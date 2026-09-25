// Session times are shown in East Africa Time regardless of the device clock.
// A learner in Nairobi and a teacher travelling abroad must read the same time
// off the same page, and "14:00" meaning two different things is the classic
// way a booking system loses someone an hour.

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function eatParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + EAT_OFFSET_MS);
  return {
    weekday: DAYS[d.getUTCDay()],
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

/** "14:00" */
export function eatTime(iso: string): string {
  const { hours, minutes } = eatParts(iso);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** "Tuesday 30 Sep" — the heading for a day's group of slots. */
export function eatDayLabel(iso: string): string {
  const { weekday, day, month } = eatParts(iso);
  return `${weekday} ${day} ${month}`;
}

/** "Tuesday 30 Sep, 14:00 EAT" */
export function eatFull(iso: string): string {
  return `${eatDayLabel(iso)}, ${eatTime(iso)} EAT`;
}

/** Stable key for grouping slots into days: "2026-09-30" in EAT. */
export function eatDateKey(iso: string): string {
  const { year, month, day } = eatParts(iso);
  const monthIndex = MONTHS.indexOf(month) + 1;
  return `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Slots grouped into days, preserving chronological order. */
export function groupSlotsByDay(slots: string[]): { key: string; label: string; slots: string[] }[] {
  const groups = new Map<string, { key: string; label: string; slots: string[] }>();
  for (const slot of slots) {
    const key = eatDateKey(slot);
    if (!groups.has(key)) groups.set(key, { key, label: eatDayLabel(slot), slots: [] });
    groups.get(key)!.slots.push(slot);
  }
  return [...groups.values()];
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-US')}`;
}

// ── Session state helpers ──────────────────────────────────────────────────
// Kept here rather than beside the status pill so the rules live in a plain
// module: a component file that also exports functions breaks fast refresh.

/** A no-show can only be reported after the session, and only for 48 hours. */
export const REPORT_WINDOW_HOURS = 48;

interface Timed { starts_at: string; duration_minutes: number }

export function sessionEndMs(b: Timed): number {
  return new Date(b.starts_at).getTime() + b.duration_minutes * 60_000;
}

export function sessionEnded(b: Timed, now = Date.now()): boolean {
  return now >= sessionEndMs(b);
}

export function withinReportWindow(b: Timed, now = Date.now()): boolean {
  const end = sessionEndMs(b);
  return now >= end && now <= end + REPORT_WINDOW_HOURS * 3_600_000;
}
