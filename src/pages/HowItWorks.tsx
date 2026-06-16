import { Smartphone, Lock, BookOpen } from 'lucide-react';
import { CTABand } from '@/components/orchestra-core/CTABand';

export default function HowItWorks() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-24 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">How it works</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Three things to understand about Orchestra-Core.</h1>
        </div>
      </section>

      {/* Meet your coach */}
      <section className="container-prose py-24 border-b border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">01 · Meet your coach</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">A coach in your pocket who actually explains things.</h2>
            <p className="text-warm-muted leading-relaxed">
              Ask Orchestra-Core anything — from "what's a P/E ratio" to "why did the market drop today" — and get a plain-English answer with the reasoning shown. No jargon dumps. No "consult a financial advisor" cop-outs.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-blush border border-border space-y-3">
            <Bubble who="you">Why do markets drop?</Bubble>
            <Bubble who="coach">Markets usually fall for one of a few reasons: central banks signal rates staying high (which reduces the value of future earnings), a big company misses expectations and drags sentiment, or a geopolitical event shifts risk appetite. Often it's several things stacking. I don't have live data — but I can walk you through exactly how each of those mechanisms works.</Bubble>
          </div>
        </div>
      </section>

      {/* Private */}
      <section className="container-prose py-24 border-b border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex items-center justify-center">
            <div className="relative w-56 h-80 rounded-3xl border-2 border-foreground bg-background flex items-center justify-center">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-foreground" />
              <Lock className="w-16 h-16 text-primary" strokeWidth={1.5} />
              <Smartphone className="absolute -bottom-4 -right-4 w-10 h-10 text-warm-muted bg-background p-1.5 rounded-full border border-border" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">02 · Built to stay private</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">Your money questions never leave your device.</h2>
            <p className="text-warm-muted leading-relaxed">
              Orchestra-Core runs locally on your computer. Your learning data and financial questions never leave your device — no server logs what you ask, no analytics tracks what you read. You buy once through a secure payment page; after that, nothing you do in the app touches the internet unless you turn on the optional Deep Dive web research toggle.
            </p>
          </div>
        </div>
      </section>

      {/* Lessons */}
      <section className="container-prose py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">03 · How lessons work</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">A curriculum, not an endless feed.</h2>
            <p className="text-warm-muted leading-relaxed mb-4">
              Orchestra-Core is organized into series, each covering a distinct area of financial life. Three series are live now — <strong className="text-foreground font-medium">Money basics</strong>, <strong className="text-foreground font-medium">Smart money</strong>, and <strong className="text-foreground font-medium">Kenya money</strong> — with six more in development. Each series has lessons you can actually finish.
            </p>
            <p className="text-warm-muted leading-relaxed">
              The first lessons in every series are free forever. Premium lessons — the deeper analysis pieces — unlock with one payment.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-background space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blush">
              <BookOpen className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm text-foreground">Money basics</div>
                <div className="text-xs text-warm-muted">8 lessons · First 4 free</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blush">
              <BookOpen className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm text-foreground">Smart money</div>
                <div className="text-xs text-warm-muted">4 modules · 3 premium</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blush">
              <BookOpen className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm text-foreground">Kenya money</div>
                <div className="text-xs text-warm-muted">4 modules · 2 premium</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

function Bubble({ who, children }: { who: 'you' | 'coach'; children: React.ReactNode }) {
  const isYou = who === 'you';
  return (
    <div className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isYou ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-background border border-border text-foreground rounded-bl-sm'}`}>
        {children}
      </div>
    </div>
  );
}
