import { Link } from 'react-router-dom';
import { BookOpen, Landmark, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
import { LessonCard } from '@/components/orchestra-core/LessonCard';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { getAllLessons, seriesIcon, lessonHref } from '@/lib/lessons';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Home() {
  const lessons = getAllLessons();
  const freeCount = lessons.filter(l => l.free).length;
  const seriesCount = new Set(lessons.map(l => l.series)).size;
  // Show the three free starter lessons — the ones a visitor can actually read
  // the moment they make an account, so the preview is never a tease.
  const preview = lessons.filter(l => l.free).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-24 md:py-32 text-center fade-in">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-6">Financial education · Kenya-first</div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-6">
            Money is a life skill, not a career.
          </h1>
          <p className="text-lg text-warm-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Every path needs it — studying, a job, a business, farming. Orchestra-Core is a complete
            curriculum in how money actually works, taught through Kenyan life.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
              Get started — free
            </Link>
            <Link to="/lessons" className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-primary text-primary hover:bg-background transition">
              Browse the lessons
            </Link>
          </div>
          <p className="text-xs text-faint mt-6">
            {freeCount} lessons free with an account · {lessons.length} published so far
          </p>
        </div>
      </section>

      {/* Why Orchestra-Core */}
      <section className="container-prose py-24">
        <div className="text-center mb-14">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">Why Orchestra-Core</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Ordered, start to finish',
              body: `${seriesCount} series that build on each other from the first lesson. A curriculum you can actually complete — not a feed you keep scrolling.`,
            },
            {
              icon: Landmark,
              title: 'Kenyan by default',
              body: 'M-Pesa, SACCOs, mobile loans, the NSE, chamas, fees that arrive in termly lumps — the money you already handle, then the principle underneath it.',
            },
            {
              icon: ShieldCheck,
              title: 'Checked against the source',
              body: 'Figures come from the institutions that publish them — the Central Bank of Kenya, KRA, SASRA, the NSE — and they are dated, so you can see when they were accurate.',
            },
          ].map(f => (
            <div key={f.title} className="p-7 rounded-xl border border-border bg-background">
              <div className="w-11 h-11 rounded-lg bg-blush flex items-center justify-center text-primary mb-5">
                <f.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl text-foreground mb-2">{f.title}</h3>
              <p className="text-warm-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free starter lessons */}
      {preview.length > 0 && (
        <section className="container-prose py-12 pb-24">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">Start here — free</div>
            <h2 className="font-serif text-4xl text-foreground">Read before you decide.</h2>
            <p className="text-warm-muted mt-3 max-w-md mx-auto">
              The first lesson of every series is free with an account. Real lessons, not samples.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {preview.map(l => (
              <LessonCard
                key={l.code}
                icon={seriesIcon(l.series)}
                title={l.title}
                module={`${l.seriesTitle} · Module ${l.module}`}
                readTime={`${l.estMinutes} min read`}
                premium={false}
                to={lessonHref(l)}
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/lessons" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              Browse all lessons <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* What you're paying for */}
      <section className="border-t border-border">
        <div className="container-narrow py-24">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">What you're paying for</div>
            <h2 className="font-serif text-4xl text-foreground mb-6">Time, and trust.</h2>
            <p className="text-warm-muted leading-relaxed mb-4">
              Not information that exists nowhere else. You're paying because the research is already done,
              put in the right order, checked against the institutions that set the numbers, and written so
              someone starting from zero can follow it. You read it — you don't have to assemble it.
            </p>
            <p className="text-warm-muted leading-relaxed mb-6">
              And it stays education, not advice. Orchestra-Core explains how money, institutions and markets
              work so you can decide for yourself. It never tells you what to buy, never touches your money,
              and never sells your data.
            </p>
            <Link to="/faq" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              Questions people ask <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-blush border-y border-border">
        <div className="container-narrow py-24 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">No subscriptions. Ever.</div>
          <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-3">{PRICE_LABEL}</h2>
          <p className="text-warm-muted mb-3">
            One-time. Unlocks every lesson in every series — current and future — for as long as Orchestra-Core operates.
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-warm-muted mb-8">
            <Smartphone className="w-3.5 h-3.5 text-primary" /> Pay with M-Pesa
          </p>
          <div>
            <Link to="/pricing" className="inline-flex items-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
              See what's included
            </Link>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
