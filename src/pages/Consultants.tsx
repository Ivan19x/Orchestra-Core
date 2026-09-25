import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, MapPin, ArrowRight, Loader2, GraduationCap } from 'lucide-react';
import { listConsultants, type Consultant } from '@/lib/api';
import { formatKes } from '@/lib/sessionTime';
import { CTABand } from '@/components/orchestra-core/CTABand';

export default function Consultants() {
  const [consultants, setConsultants] = useState<Consultant[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listConsultants()
      .then(r => setConsultants(r.consultants))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load consultants.'));
  }, []);

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">One-to-one</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Book a consultant.</h1>
          <p className="text-warm-muted max-w-lg mx-auto">
            Sit down with a verified teacher and work through the Orchestra-Core curriculum at your own
            pace — online, or in person if you'd rather. Rates are set by us and are the same for everyone.
          </p>
        </div>
      </section>

      <section className="container-prose py-16">
        {error && (
          <div className="max-w-md mx-auto text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {!consultants && !error && (
          <div className="flex items-center justify-center gap-2 py-12 text-warm-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading consultants…
          </div>
        )}

        {consultants?.length === 0 && (
          <div className="max-w-md mx-auto text-center py-8">
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center text-primary mx-auto mb-5">
              <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-2">No consultants just yet.</h2>
            <p className="text-sm text-warm-muted mb-6">
              We're verifying our first teachers now. In the meantime the whole written curriculum is
              available to read on your own.
            </p>
            <Link to="/lessons" className="text-sm text-primary hover:underline">Browse the lessons →</Link>
          </div>
        )}

        {consultants && consultants.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {consultants.map(c => (
              <Link
                key={c.slug}
                to={`/consultants/${c.slug}`}
                className="group flex flex-col p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-blush transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blush group-hover:bg-background flex items-center justify-center text-primary shrink-0 overflow-hidden transition-colors">
                    {c.photo_url
                      ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" />
                      : <GraduationCap className="w-5 h-5" strokeWidth={1.75} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg text-foreground leading-snug">{c.full_name}</h2>
                    {c.headline && <p className="text-sm text-warm-muted leading-snug">{c.headline}</p>}
                  </div>
                </div>

                {c.specialities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.specialities.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] uppercase tracking-wider text-warm-muted border border-border rounded-full px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-warm-muted mb-5">
                  {c.session_modes?.includes('online') && (
                    <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> Online</span>
                  )}
                  {c.session_modes?.includes('in_person') && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.service_area || 'In person'}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <div className="font-serif text-2xl text-primary">{formatKes(c.hourly_rate_kes)}</div>
                    <div className="text-xs text-faint">per hour</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
                    Book <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14 p-6 rounded-2xl border border-border bg-blush">
          <h2 className="font-serif text-xl text-foreground mb-2">Teach with Orchestra-Core</h2>
          <p className="text-sm text-warm-muted mb-4 max-w-xl">
            We're looking for qualified teachers to deliver these sessions. It's paid work on your own
            schedule — a monthly base plus a fee for every session you take. You'll be verified before
            you start.
          </p>
          <Link
            to="/teach"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
          >
            Apply to teach
          </Link>
        </div>

        <p className="text-xs text-faint mt-8 max-w-2xl">
          Sessions teach the Orchestra-Core curriculum. They are financial education, not personal
          financial advice — a consultant will explain how something works, but will not tell you what to
          buy, sell or invest in.
        </p>
      </section>

      <CTABand />
    </>
  );
}
