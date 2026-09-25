import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Check, Wallet, CalendarDays, AlertCircle } from 'lucide-react';
import {
  getTeacherProfile, getTeacherAvailability, saveTeacherAvailability,
  getTeacherBookings, completeBooking, cancelBooking, reportBooking,
  type TeacherProfile, type TeacherBooking, type AvailabilityWindow,
} from '@/lib/api';
import { useSession } from '@/lib/session';
import { eatFull, formatKes, sessionEnded, withinReportWindow } from '@/lib/sessionTime';
import { SessionStatusPill } from '@/components/orchestra-core/SessionStatus';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
function toMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function TeacherDashboard() {
  const session = useSession();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [bookings, setBookings] = useState<TeacherBooking[]>([]);
  const [earnings, setEarnings] = useState<{ month: string; sessions: number; sessionFeesKes: number; paid: boolean }[]>([]);
  const [monthlyBase, setMonthlyBase] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busyRef, setBusyRef] = useState('');

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    Promise.all([getTeacherProfile(), getTeacherAvailability(), getTeacherBookings()])
      .then(([p, a, b]) => {
        setProfile(p.consultant);
        setWindows(a.availability);
        setBookings(b.bookings);
        setEarnings(b.earnings);
        setMonthlyBase(b.monthlyBaseKes);
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Could not load your dashboard.'))
      .finally(() => setLoading(false));
  }, [session, navigate]);

  function addWindow() {
    setWindows(w => [...w, { weekday: 1, startMinute: 9 * 60, endMinute: 17 * 60 }]);
    setSaved(false);
  }
  function updateWindow(i: number, patch: Partial<AvailabilityWindow>) {
    setWindows(w => w.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setSaved(false);
  }
  function removeWindow(i: number) {
    setWindows(w => w.filter((_, j) => j !== i));
    setSaved(false);
  }

  async function saveAvailability() {
    setError(''); setSaving(true);
    try {
      await saveTeacherAvailability(windows);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function act(ref: string, fn: () => Promise<unknown>) {
    setError(''); setBusyRef(ref);
    try {
      await fn();
      const b = await getTeacherBookings();
      setBookings(b.bookings); setEarnings(b.earnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that session.');
    } finally {
      setBusyRef('');
    }
  }

  if (!session) return null;

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-32 text-warm-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  }

  if (loadError || !profile) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">No consultant profile</h1>
        <p className="text-sm text-warm-muted mb-8">{loadError || 'You have not applied to teach yet.'}</p>
        <Link to="/teach" className="text-sm text-primary hover:underline">Apply to teach →</Link>
      </section>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && !sessionEnded(b));
  const past = bookings.filter(b => b.status !== 'confirmed' || sessionEnded(b));
  const approved = profile.status === 'approved';

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-prose py-14">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Consultant dashboard</div>
          <h1 className="font-serif text-4xl text-foreground">{profile.fullName}</h1>
          {!approved && (
            <p className="text-sm text-warm-muted mt-3">
              Your profile is <strong className="text-foreground">{profile.status}</strong> — learners
              can't book you until it is approved.
            </p>
          )}
        </div>
      </section>

      <section className="container-prose py-12 space-y-12">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Pay */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Your pay</div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Per session', value: formatKes(profile.sessionFeeKes) },
              { label: 'Monthly base', value: formatKes(monthlyBase || profile.monthlyBaseKes) },
              { label: 'Learners pay', value: `${formatKes(profile.hourlyRateKes)}/hr` },
            ].map(x => (
              <div key={x.label} className="p-5 rounded-xl border border-border bg-background">
                <div className="text-xs text-faint mb-1">{x.label}</div>
                <div className="font-serif text-2xl text-foreground">{x.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-faint mt-3">
            Rates are set by Orchestra-Core so every learner pays the same for the same hour. Pay is
            settled monthly.
          </p>
        </div>

        {/* Earnings */}
        {earnings.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4 inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Earnings
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              {earnings.map(e => (
                <div key={e.month} className="flex items-center justify-between gap-4 p-4 border-b border-border last:border-b-0 text-sm">
                  <span className="text-foreground">{e.month}</span>
                  <span className="text-warm-muted">{e.sessions} session{e.sessions === 1 ? '' : 's'}</span>
                  <span className="text-foreground font-medium">{formatKes(e.sessionFeesKes)}</span>
                  <span className={`text-xs ${e.paid ? 'text-faint' : 'text-primary'}`}>
                    {e.paid ? 'Paid' : 'Due'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-faint mt-2">Session fees only — your monthly base is added on top when paid.</p>
          </div>
        )}

        {/* Availability */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-faint inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> When you're free
            </div>
            <button onClick={addWindow} className="text-xs text-primary hover:underline">+ Add a window</button>
          </div>

          {windows.length === 0 ? (
            <p className="text-sm text-warm-muted mb-4">
              Nothing set yet — until you add times, nobody can book you.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {windows.map((w, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-background">
                  <select value={w.weekday} onChange={e => updateWindow(i, { weekday: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground">
                    {DAYS.map((d, j) => <option key={d} value={j}>{d}</option>)}
                  </select>
                  <input type="time" value={toTime(w.startMinute)} step={1800}
                    onChange={e => updateWindow(i, { startMinute: toMinutes(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" />
                  <span className="text-warm-muted text-sm">to</span>
                  <input type="time" value={toTime(w.endMinute)} step={1800}
                    onChange={e => updateWindow(i, { endMinute: toMinutes(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground" />
                  <button onClick={() => removeWindow(i)} className="ml-auto text-xs text-warm-muted hover:text-foreground">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={saveAvailability} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && !saving && <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save availability'}
          </button>
          <p className="text-xs text-faint mt-2">All times are EAT. Sessions are booked on the hour inside these windows.</p>
        </div>

        {/* Upcoming */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Upcoming sessions</div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-warm-muted">Nothing booked yet.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <SessionRow key={b.ref} b={b} busy={busyRef === b.ref}
                  onCancel={() => act(b.ref, () => cancelBooking(b.ref))} />
              ))}
            </div>
          )}
        </div>

        {/* Past / needs action */}
        {past.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Past sessions</div>
            <div className="space-y-3">
              {past.map(b => (
                <SessionRow key={b.ref} b={b} busy={busyRef === b.ref}
                  onComplete={b.status === 'confirmed' && sessionEnded(b) ? () => act(b.ref, () => completeBooking(b.ref)) : undefined}
                  onNoShow={b.status === 'confirmed' && withinReportWindow(b) ? () => act(b.ref, () => reportBooking(b.ref)) : undefined} />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-faint">
          If a learner doesn't attend, mark it — you're still paid for the time you held. If you have to
          cancel, the learner is refunded in full and that session isn't paid. Full rules are in the{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>.
        </p>
      </section>
    </>
  );
}

function SessionRow({ b, busy, onCancel, onComplete, onNoShow }: {
  b: TeacherBooking; busy: boolean;
  onCancel?: () => void; onComplete?: () => void; onNoShow?: () => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-background">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <p className="text-sm text-foreground">{eatFull(b.starts_at)}</p>
          <p className="text-xs text-warm-muted">
            {b.users?.email ?? 'Learner'} · {b.duration_minutes / 60}h ·{' '}
            {b.mode === 'online' ? 'Online' : b.location || 'In person'}
          </p>
        </div>
        <SessionStatusPill status={b.status} />
      </div>

      {b.learner_note && (
        <p className="text-sm text-warm-muted bg-blush rounded-lg p-3 my-3">
          <span className="text-xs uppercase tracking-wider text-faint block mb-1">They want to cover</span>
          {b.learner_note}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <span className="text-xs text-faint">
          You earn {formatKes(b.teacher_fee_kes)}
          {b.payout_status === 'void' && ' · not payable'}
          {b.payout_status === 'paid' && ' · paid'}
        </span>
        <div className="flex gap-3">
          {onComplete && (
            <button onClick={onComplete} disabled={busy} className="text-sm text-primary hover:underline disabled:opacity-50">
              {busy ? '…' : 'Mark delivered'}
            </button>
          )}
          {onNoShow && (
            <button onClick={onNoShow} disabled={busy}
              className="inline-flex items-center gap-1 text-sm text-warm-muted hover:text-foreground disabled:opacity-50">
              <AlertCircle className="w-3.5 h-3.5" /> They didn't show
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} disabled={busy} className="text-sm text-warm-muted hover:text-foreground disabled:opacity-50">
              {busy ? '…' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
