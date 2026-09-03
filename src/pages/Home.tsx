import { Link } from 'react-router-dom';
import { BookOpen, Landmark, Shield, ArrowRight, Smartphone } from 'lucide-react';
import { LessonCard } from '@/components/orchestra-core/LessonCard';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { getAllLessons, seriesIcon, lessonHref } from '@/lib/lessons';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Home() {
  const lessons = getAllLessons();
  const freeCount = lessons.filter(l => l.free).length;
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
            Understand your money.
          </h1>
          <p className="text-lg text-warm-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Orchestra-Core teaches you how money actually works — clear, practical lessons built for the Kenyan
            reality. Read them at your own pace, in your browser. One payment, no subscriptions, yours to keep.
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
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">Why Orchestra-Core</div>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">A different kind of money app.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'A real curriculum', body: 'Series, modules, and lessons you can actually finish — written to a book-quality standard, not an endless feed.' },
            { icon: Landmark, title: 'Built for Kenya', body: 'M-Pesa, SACCOs, the NSE, mobile loans, taxes — real shillings and real habits, then the universal principles behind them.' },
            { icon: Shield, title: 'Honest by design', body: 'Education, not advice. We never tell you what to buy, never touch your money, and never sell your data.' },
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
            <h2 className="font-serif text-4xl text-foreground">A taste of what's inside.</h2>
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
