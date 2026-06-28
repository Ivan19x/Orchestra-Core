import { Landmark, Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
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

      {/* A real curriculum */}
      <section className="container-prose py-24 border-b border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">01 · A real curriculum</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">Lessons you can actually finish.</h2>
            <p className="text-warm-muted leading-relaxed">
              Orchestra-Core is organised into series, each covering a distinct area of financial life — money basics,
              adult-life money, the Kenyan financial system, investing, the psychology of money, and more. Every
              series is broken into short modules written in plain language, to a book-quality standard. You read at
              your own pace, not in an endless feed.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-background space-y-3">
            {[
              ['Series 1 · Money Basics', 'What money is, budgeting, saving, debt, inflation…'],
              ['Series 2 · Adult Life Money', 'Payslips, rent, loans, insurance, taxes, scams…'],
              ['Series 4 · Kenya Money', 'M-Pesa, SACCOs, the NSE, T-bills, land, chamas…'],
            ].map(([t, s]) => (
              <div key={t} className="flex items-center gap-3 p-3 rounded-lg bg-blush">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{t}</div>
                  <div className="text-xs text-warm-muted truncate">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Kenya */}
      <section className="container-prose py-24 border-b border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex items-center justify-center">
            <div className="w-56 h-56 rounded-3xl border-2 border-foreground bg-background flex items-center justify-center">
              <Landmark className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">02 · Built for Kenya</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">Real shillings, real habits.</h2>
            <p className="text-warm-muted leading-relaxed">
              Every lesson uses the financial world you actually live in — M-Pesa fees and Fuliza, SACCOs and the NSE,
              PAYE and SHIF on your payslip, mobile loans and the CRB. We teach the universal principles of money
              through Kenyan examples first, so the knowledge is immediately usable — then it travels anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* One payment */}
      <section className="container-prose py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">03 · Yours to keep</div>
            <h2 className="font-serif text-4xl text-foreground mb-4">One payment. Owned forever.</h2>
            <p className="text-warm-muted leading-relaxed mb-4">
              The starter lesson in each series is free to read with a free account. One payment unlocks the full
              library — every current and future lesson — with no subscription, ever. Read it all directly in your
              browser, nothing to install.
            </p>
            <p className="text-warm-muted leading-relaxed">
              Orchestra-Core is <strong className="text-foreground font-medium">education, not advice</strong>: we teach
              you how money works so you can decide for yourself. We never tell you what to buy, never touch your
              money, and never sell your data.
            </p>
            <Link to="/lessons" className="inline-flex items-center mt-6 text-sm text-primary hover:underline">
              Browse the lessons →
            </Link>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-blush flex items-center justify-center">
            <div className="w-40 h-40 rounded-3xl border-2 border-foreground bg-background flex items-center justify-center">
              <Shield className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
