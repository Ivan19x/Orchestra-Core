import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Video, MapPin, AlertCircle } from 'lucide-react';
import { listMyBookings, cancelBooking, reportBooking, type BookingSummary } from '@/lib/api';
import { useSession } from '@/lib/session';
import { eatFull, formatKes, sessionEnded, withinReportWindow } from '@/lib/sessionTime';
import { SessionStatusPill } from '@/components/orchestra-core/SessionStatus';

export default function MySessions() {
  const session = useSession();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [busyRef, setBusyRef] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    listMyBookings().then(r => setBookings(r.bookings)).catch(() => setBookings([]));
  }, [session, navigate]);

  async function refresh() {
    const r = await listMyBookings();
    setBookings(r.bookings);
  }

  async function handleCancel(b: BookingSummary) {
    setError(''); setNotice(''); setBusyRef(b.ref);
    try {
      const r = await cancelBooking(b.ref);
      setNotice(r.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel.');
    } finally {
      setBusyRef('');
    }
  }

  async function handleReport(b: BookingSummary) {
    setError(''); setNotice(''); setBusyRef(b.ref);
    try {
      const r = await reportBooking(b.ref);
      setNotice(r.message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not report this session.');
    } finally {
      setBusyRef('');
    }
  }

  if (!session) return null;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-16">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Your sessions</div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">Sessions you've booked.</h1>
        </div>
      </section>

      <section className="container-narrow py-12 space-y-4">
        {notice && (
          <div className="p-4 rounded-xl border border-primary/30 bg-blush text-sm text-foreground">{notice}</div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {bookings === null && (
          <div className="flex items-center gap-2 py-12 text-warm-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}

        {bookings?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-warm-muted mb-6">You haven't booked a session yet.</p>
            <Link to="/consultants" className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Find a consultant
            </Link>
          </div>
        )}

        {bookings?.map(b => {
          const ended = sessionEnded(b);
          const canCancel = b.status === 'confirmed' && !ended;
          const canReport = b.status === 'confirmed' && withinReportWindow(b);
          const busy = busyRef === b.ref;

          return (
            <div key={b.ref} className="p-5 rounded-xl border border-border bg-background">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <h2 className="text-foreground">{b.consultants?.full_name ?? 'Consultant'}</h2>
                  <p className="text-sm text-warm-muted">{eatFull(b.starts_at)}</p>
                </div>
                <SessionStatusPill status={b.status} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-warm-muted mb-4">
                <span className="inline-flex items-center gap-1">
                  {b.mode === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {b.mode === 'online' ? 'Online' : b.location || 'In person'}
                </span>
                <span>{b.duration_minutes / 60}h</span>
                <span>{formatKes(b.amount_kes)}</span>
              </div>

              {b.meeting_link && b.status === 'confirmed' && (
                <a href={b.meeting_link} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm text-primary hover:underline mb-4">
                  Join the session →
                </a>
              )}

              {(canCancel || canReport) && (
                <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
                  {canCancel && (
                    <button onClick={() => handleCancel(b)} disabled={busy}
                      className="text-sm text-warm-muted hover:text-foreground transition disabled:opacity-50">
                      {busy ? 'Working…' : 'Cancel this session'}
                    </button>
                  )}
                  {canReport && (
                    <button onClick={() => handleReport(b)} disabled={busy}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {busy ? 'Working…' : 'My consultant didn\'t show up'}
                    </button>
                  )}
                </div>
              )}

              {canCancel && (
                <p className="text-xs text-faint mt-2">
                  Free to cancel up to 24 hours before. After that the time is already held for you.
                </p>
              )}
            </div>
          );
        })}

        <p className="text-xs text-faint pt-6">
          How cancellations and refunds work is set out in the{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>. If something
          went wrong that doesn't fit the buttons above,{' '}
          <Link to="/contact" className="text-primary hover:underline">tell us</Link> — a person reads it.
        </p>
      </section>
    </>
  );
}
