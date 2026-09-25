import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, ShieldCheck, CalendarClock, Wallet } from 'lucide-react';
import { applyAsConsultant, getMyApplication, ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

type Mode = 'online' | 'in_person';

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending: {
    title: 'Your application is in.',
    body: 'Next we need your documents. Check your email — reply to it with your national ID, your teaching or professional certificates, and any school documents supporting your experience.',
  },
  verifying: {
    title: 'We are checking your documents.',
    body: 'Thanks — we have what we need and a person is reviewing it. We will write to you either way.',
  },
  approved: {
    title: 'You are approved.',
    body: 'Your profile is live and learners can book you. Your rate, session fee and monthly base are set — check your email for the figures.',
  },
  rejected: {
    title: 'We could not approve this application.',
    body: 'We have emailed you the reason. You are welcome to reply if you think we have it wrong.',
  },
  suspended: {
    title: 'Your profile is paused.',
    body: 'Your profile is not currently visible to learners. Check your email, or get in touch.',
  },
};

export default function Teach() {
  const session = useSession();

  const [existing, setExisting] = useState<{ status: string; fullName: string } | null>(null);
  const [checked, setChecked] = useState(false);

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [idLast4, setIdLast4] = useState('');
  const [specialities, setSpecialities] = useState('');
  const [modes, setModes] = useState<Mode[]>(['online']);
  const [serviceArea, setServiceArea] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!session) { setChecked(true); return; }
    getMyApplication()
      .then(r => setExisting(r.application ? { status: r.application.status, fullName: r.application.fullName } : null))
      .catch(() => { /* not fatal — they can still apply and get a clear 409 */ })
      .finally(() => setChecked(true));
  }, [session]);

  function toggleMode(m: Mode) {
    setModes(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (modes.length === 0) return setError('Choose at least one way you can teach.');
    if (modes.includes('in_person') && !serviceArea.trim()) {
      return setError('Tell us which areas you can travel to.');
    }

    setSubmitting(true);
    try {
      await applyAsConsultant({
        fullName: fullName.trim(),
        headline: headline.trim() || undefined,
        bio: bio.trim(),
        qualifications: qualifications.trim(),
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        idLast4: idLast4.trim() || undefined,
        specialities: specialities.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8),
        sessionModes: modes,
        serviceArea: modes.includes('in_person') ? serviceArea.trim() : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('You have already applied — check your email.');
      else setError(err instanceof Error ? err.message : 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  }

  const status = submitted ? 'pending' : existing?.status;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Teach with us</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Earn on the side, teaching.</h1>
          <p className="text-warm-muted max-w-lg mx-auto">
            Deliver the Orchestra-Core curriculum one-to-one, on your own schedule. You teach our
            material, so you never have to write lessons or argue about price.
          </p>
        </div>
      </section>

      <section className="container-prose py-16">
        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {[
            { icon: Wallet, title: 'A monthly base, plus per session', body: 'You are paid a monthly base regardless, and a set fee for every session you deliver. Paid out monthly.' },
            { icon: CalendarClock, title: 'Your own hours', body: 'You set the days and times you are available. Learners can only book inside them.' },
            { icon: ShieldCheck, title: 'Verified, so learners trust it', body: 'We check your ID, certificates and school documents before your profile goes live.' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-border bg-background">
              <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary mb-4">
                <f.icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h2 className="text-foreground mb-1.5">{f.title}</h2>
              <p className="text-sm text-warm-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="max-w-xl mx-auto">
          {!checked ? (
            <div className="flex items-center justify-center gap-2 py-8 text-warm-muted">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : !session ? (
            <div className="rounded-2xl border border-border bg-blush p-8 text-center">
              <h2 className="font-serif text-2xl text-foreground mb-2">Create an account to apply</h2>
              <p className="text-sm text-warm-muted mb-6">
                You will use the same account to manage your availability and see your bookings.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link to="/signup" className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
                  Create account
                </Link>
                <Link to="/login" className="text-sm text-warm-muted hover:text-foreground transition">Sign in</Link>
              </div>
            </div>
          ) : status ? (
            <div className="rounded-2xl border border-border bg-blush p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">
                {STATUS_COPY[status]?.title ?? 'Application received.'}
              </h2>
              <p className="text-sm text-warm-muted leading-relaxed">
                {STATUS_COPY[status]?.body ?? 'We will be in touch by email.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-background p-6 md:p-8">
              <h2 className="font-serif text-2xl text-foreground mb-1">Apply to teach</h2>
              <p className="text-sm text-warm-muted mb-7">
                Takes a few minutes. We will email you straight away with the documents to send.
              </p>

              <Field label="Full name" id="name">
                <input id="name" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass} placeholder="As it appears on your ID" />
              </Field>

              <Field label="One line about you" id="headline" optional>
                <input id="headline" value={headline} onChange={e => setHeadline(e.target.value)}
                  className={inputClass} placeholder="e.g. Economics teacher, 8 years in Nairobi" />
              </Field>

              <Field label="About you" id="bio">
                <textarea id="bio" required rows={4} value={bio} onChange={e => setBio(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="How you teach, and who you are good with. Learners read this." />
              </Field>

              <Field label="Your qualifications" id="quals">
                <textarea id="quals" required rows={3} value={qualifications} onChange={e => setQualifications(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Degrees, teaching certificates, institutions, licence numbers" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Years teaching" id="years" optional>
                  <input id="years" type="number" min="0" max="60" value={experienceYears}
                    onChange={e => setExperienceYears(e.target.value)} className={inputClass} placeholder="5" />
                </Field>
                <Field label="Last 4 of ID" id="id4" optional>
                  <input id="id4" inputMode="numeric" maxLength={4} value={idLast4}
                    onChange={e => setIdLast4(e.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="1234" />
                </Field>
              </div>
              <p className="text-xs text-faint -mt-3 mb-5">
                Four digits only, to match against the ID you email us. We never store your full ID number.
              </p>

              <Field label="Topics you are strongest on" id="spec" optional>
                <input id="spec" value={specialities} onChange={e => setSpecialities(e.target.value)}
                  className={inputClass} placeholder="Budgeting, SACCOs, taxes (comma separated)" />
              </Field>

              <fieldset className="mb-5">
                <legend className="block text-sm text-foreground mb-1.5">How can you teach?</legend>
                <div className="flex gap-3">
                  {([['online', 'Online'], ['in_person', 'In person']] as [Mode, string][]).map(([m, label]) => (
                    <button key={m} type="button" onClick={() => toggleMode(m)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm transition ${modes.includes(m) ? 'border-primary bg-blush text-foreground' : 'border-border text-warm-muted hover:border-primary/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {modes.includes('in_person') && (
                <Field label="Areas you can travel to" id="area">
                  <input id="area" value={serviceArea} onChange={e => setServiceArea(e.target.value)}
                    className={inputClass} placeholder="e.g. Nairobi CBD, Westlands, Kilimani" />
                </Field>
              )}

              <p className="text-xs text-faint mb-5">
                Pay is set by Orchestra-Core — a monthly base plus a fee per session. Sessions teach our
                curriculum as financial education, so consultants never give personal investment advice.
              </p>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Sending…' : 'Submit application'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition';

function Field({ label, id, optional, children }: {
  label: string; id: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm text-foreground mb-1.5">
        {label}{optional && <span className="text-faint"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}
