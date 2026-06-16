import { Link } from 'react-router-dom';
import { BookOpen, Brain, Shield, FileText, Heart, ArrowRight, Clock } from 'lucide-react';
import { LessonCard } from '@/components/orchestra-core/LessonCard';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { TESTING_PHASE, useCountdown, formatCountdown } from '@/lib/testingPhase';

export default function Home() {
  const countdown = useCountdown();

  return (
    <>
      {/* Hero */}
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-24 md:py-32 text-center fade-in">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-6">Private AI coach · Curriculum-based</div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-6">
            Understanding Money.
          </h1>
          <p className="text-lg text-warm-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Orchestra-Core is a private AI coach and curriculum that teaches you how smart money actually thinks — in plain language, one payment, no subscriptions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pricing" className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
              Get Orchestra-Core — one-time payment
            </Link>
            <Link to="/how-it-works" className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-primary text-primary hover:bg-blush transition">
              See how it works
            </Link>
          </div>
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
            { icon: BookOpen, title: 'Learn at your pace', body: 'A real curriculum — not an infinite chat window. Series, modules, and lessons you can actually finish.' },
            { icon: Brain, title: 'Think like smart money', body: 'Read filings, balance sheets, and market moves the way the people who move markets do.' },
            { icon: Shield, title: 'Private by design', body: 'Orchestra-Core runs on your device. Your financial questions and learning data never leave it. No tracking, no analytics on what you read or ask.' },
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

      {/* Sample lesson */}
      <section className="container-prose py-12 pb-24">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">Sample lesson</div>
          <h2 className="font-serif text-4xl text-foreground">A taste of what's inside.</h2>
        </div>
        <div className="max-w-md mx-auto">
          <LessonCard icon={FileText} title="How Warren Buffett reads a balance sheet" module="Smart money · Module 1" readTime="12 min read" />
        </div>
        <div className="text-center mt-8">
          <Link to="/lessons" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Browse all lessons <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-blush border-y border-border">
        <div className="container-narrow py-24 text-center">
          {TESTING_PHASE ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
                <Clock className="w-3 h-3" />
                Testing phase
              </div>
              <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-3">Free</h2>
              <p className="text-warm-muted mb-2">Access every lesson at no cost during the testing phase.</p>
              {countdown && (
                <p className="text-sm text-faint mb-8">Paid access (KES 1,500) returns in {formatCountdown(countdown)}</p>
              )}
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">No subscriptions. Ever.</div>
              <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-3">KES 1,500</h2>
              <p className="text-warm-muted mb-8">One-time. Access to every lesson and every update, for as long as Orchestra-Core operates.</p>
            </>
          )}
          <Link to="/pricing" className="inline-flex items-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            {TESTING_PHASE ? 'Get free access' : 'Get Orchestra-Core'}
          </Link>
        </div>
      </section>

      {/* Support teaser */}
      <section className="container-prose py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center text-primary mx-auto mb-5">
            <Heart className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Support keeps Orchestra-Core free for those who can't pay.</h2>
          <p className="text-warm-muted mb-6 leading-relaxed">
            Contributions help Orchestra-Core grow — more lessons, more series, and eventually a free hosted tier for learners who can't pay. Built by a student in Nairobi, Kenya.
          </p>
          <Link to="/support" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            Learn how to contribute <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <CTABand />
    </>
  );
}
