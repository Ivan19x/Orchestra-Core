import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Video, MapPin, Loader2, Check, GraduationCap } from 'lucide-react';
import {
  getConsultant, getConsultantSlots, createBooking, getBookingStatus,
  ApiError, type Consultant,
} from '@/lib/api';
import { useSession } from '@/lib/session';
import { eatFull, eatTime, groupSlotsByDay, formatKes } from '@/lib/sessionTime';

type Mode = 'online' | 'in_person';
type Stage = 'choosing' | 'paying' | 'booked';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export default function ConsultantProfile() {
  const { slug = '' } = useParams();
  const session = useSession();

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loadError, setLoadError] = useState('');

  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState<Mode>('online');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');

  const [stage, setStage] = useState<Stage>('choosing');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getConsultant(slug)
      .then(r => {
        setConsultant(r.consultant);
        setMode(r.consultant.session_modes?.includes('online') ? 'online' : 'in_person');
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Could not load this consultant.'));
  }, [slug]);

  // Re-fetch times whenever the session length changes — a 2-hour session has
  // a different set of possible starts, not just a subset of the 1-hour ones.
  useEffect(() => {
    if (!consultant) return;
    setSlots(null);
    setSelected('');
    getConsultantSlots(slug, duration)
      .then(r => setSlots(r.slots))
      .catch(() => setSlots([]));
  }, [consultant, slug, duration]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };
  useEffect(() => stopPolling, []);

  const price = consultant ? Math.round(consultant.hourly_rate_kes * (duration / 60)) : 0;

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selected) return setError('Pick a time first.');
    if (mode === 'in_person' && !location.trim()) return setError('Tell us where the session should happen.');

    setSubmitting(true);
    try {
      const { ref } = await createBooking({
        consultantSlug: slug,
        startsAt: selected,
        durationMinutes: duration,
        mode,
        location: mode === 'in_person' ? location.trim() : undefined,
        learnerNote: note.trim() || undefined,
        phone,
      });

      setStage('paying');
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling();
          setError("We didn't get a confirmation. If you completed the payment, check your email — the booking confirms by itself.");
          setStage('choosing');
          return;
        }
        try {
          const { status, message } = await getBookingStatus(ref);
          if (status === 'confirmed') { stopPolling(); setStage('booked'); }
          else if (status === 'failed') {
            stopPolling();
            setError(message || 'The payment was cancelled or timed out. You can try again.');
            setStage('choosing');
          }
        } catch { /* transient — keep polling */ }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Someone else took the slot while this form was open.
        setError(err.message);
        getConsultantSlots(slug, duration).then(r => setSlots(r.slots)).catch(() => {});
        setSelected('');
      } else {
        setError(err instanceof Error ? err.message : 'Could not start the booking.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">Consultant not found</h1>
        <p className="text-sm text-warm-muted mb-8">{loadError}</p>
        <Link to="/consultants" className="text-sm text-primary hover:underline">Back to all consultants</Link>
      </section>
    );
  }

  if (!consultant) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-warm-muted">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  const days = groupSlotsByDay(slots ?? []);

  return (
    <section className="container-narrow py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Link to="/consultants" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-foreground transition mb-8">
          <ChevronLeft className="w-4 h-4" /> All consultants
        </Link>

        {/* Profile */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-primary shrink-0 overflow-hidden">
            {consultant.photo_url
              ? <img src={consultant.photo_url} alt="" className="w-full h-full object-cover" />
              : <GraduationCap className="w-6 h-6" strokeWidth={1.75} />}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl text-foreground leading-tight">{consultant.full_name}</h1>
            {consultant.headline && <p className="text-warm-muted mt-1">{consultant.headline}</p>}
            <p className="text-sm text-primary mt-2">{formatKes(consultant.hourly_rate_kes)} per hour</p>
          </div>
        </div>

        {consultant.bio && (
          <p className="text-warm-muted leading-relaxed mb-8 whitespace-pre-line">{consultant.bio}</p>
        )}

        {stage === 'booked' ? (
          <div className="rounded-2xl border border-border bg-blush p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-2">Your session is booked.</h2>
            <p className="text-sm text-warm-muted mb-2">{eatFull(selected)}</p>
            <p className="text-sm text-warm-muted mb-6">
              {mode === 'in_person'
                ? `In person — ${location}`
                : `${consultant.full_name} will send you a video link before the session.`}
            </p>
            <p className="text-xs text-faint">A confirmation email is on its way.</p>
          </div>
        ) : stage === 'paying' ? (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-2">Check your phone</h2>
            <p className="text-sm text-warm-muted">
              An M-Pesa prompt for {formatKes(price)} has been sent to <span className="text-foreground">{phone}</span>.
              Enter your PIN to confirm — this page updates by itself.
            </p>
            <p className="text-xs text-faint mt-4">Don't close this page. The time is held for you while you pay.</p>
          </div>
        ) : !session ? (
          <div className="rounded-2xl border border-border bg-blush p-8 text-center">
            <h2 className="font-serif text-2xl text-foreground mb-2">Sign in to book</h2>
            <p className="text-sm text-warm-muted mb-6">
              You need an account so we can send your confirmation and keep your session details.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/signup" className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
                Create free account
              </Link>
              <Link to="/login" className="text-sm text-warm-muted hover:text-foreground transition">
                Already have one? Sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} className="rounded-2xl border border-border bg-background p-6 md:p-8">
            <h2 className="font-serif text-2xl text-foreground mb-6">Book a session</h2>

            {/* Length */}
            <fieldset className="mb-6">
              <legend className="text-sm text-foreground mb-2">How long?</legend>
              <div className="flex gap-3">
                {[60, 120].map(d => (
                  <button
                    key={d} type="button" onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm transition ${duration === d ? 'border-primary bg-blush text-foreground' : 'border-border text-warm-muted hover:border-primary/30'}`}
                  >
                    {d / 60} hour{d === 60 ? '' : 's'}
                    <span className="block text-xs text-faint mt-0.5">
                      {formatKes(Math.round(consultant.hourly_rate_kes * (d / 60)))}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Mode */}
            {consultant.session_modes?.length > 1 && (
              <fieldset className="mb-6">
                <legend className="text-sm text-foreground mb-2">Where?</legend>
                <div className="flex gap-3">
                  {(['online', 'in_person'] as Mode[])
                    .filter(m => consultant.session_modes.includes(m))
                    .map(m => (
                      <button
                        key={m} type="button" onClick={() => setMode(m)}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm inline-flex items-center justify-center gap-2 transition ${mode === m ? 'border-primary bg-blush text-foreground' : 'border-border text-warm-muted hover:border-primary/30'}`}
                      >
                        {m === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        {m === 'online' ? 'Online' : 'In person'}
                      </button>
                    ))}
                </div>
              </fieldset>
            )}

            {mode === 'in_person' && (
              <div className="mb-6">
                <label htmlFor="loc" className="block text-sm text-foreground mb-1.5">Where should they come?</label>
                <input
                  id="loc" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Estate, area or landmark"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
                {consultant.service_area && (
                  <p className="text-xs text-faint mt-1.5">Travels to: {consultant.service_area}</p>
                )}
              </div>
            )}

            {/* Times */}
            <fieldset className="mb-6">
              <legend className="text-sm text-foreground mb-2">Pick a time <span className="text-faint">(EAT)</span></legend>
              {slots === null ? (
                <p className="text-sm text-warm-muted inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding free times…
                </p>
              ) : days.length === 0 ? (
                <p className="text-sm text-warm-muted">
                  No free times in the next three weeks. Try a shorter session, or{' '}
                  <Link to="/contact" className="text-primary hover:underline">message us</Link>.
                </p>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {days.map(day => (
                    <div key={day.key}>
                      <div className="text-xs uppercase tracking-wider text-faint mb-2">{day.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map(slot => (
                          <button
                            key={slot} type="button" onClick={() => setSelected(slot)}
                            className={`px-3 py-1.5 rounded-lg border text-sm transition ${selected === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-warm-muted hover:border-primary/40'}`}
                          >
                            {eatTime(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="mb-6">
              <label htmlFor="note" className="block text-sm text-foreground mb-1.5">
                What would you like to cover? <span className="text-faint">(optional)</span>
              </label>
              <textarea
                id="note" value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="e.g. I want to understand SACCOs before joining one"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="mpesa" className="block text-sm text-foreground mb-1.5">M-Pesa number</label>
              <input
                id="mpesa" type="tel" inputMode="tel" required value={phone}
                onChange={e => setPhone(e.target.value)} placeholder="0712 345 678"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              type="submit" disabled={submitting || !selected}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Sending prompt…' : `Book and pay ${formatKes(price)}`}
            </button>

            {selected && (
              <p className="text-xs text-faint text-center mt-3">{eatFull(selected)}</p>
            )}
          </form>
        )}

        <p className="text-xs text-faint mt-8">
          Sessions teach the Orchestra-Core curriculum. They are financial education, not personal
          financial advice — your consultant will explain how things work, but will not tell you what to
          buy, sell or invest in.
        </p>
      </div>
    </section>
  );
}
