import { CTABand } from '@/components/orchestra-core/CTABand';

export default function About() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">About</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Why Orchestra-Core exists.</h1>
        </div>
      </section>

      <section className="container-narrow py-16 prose prose-lg">
        <div className="space-y-6 text-foreground leading-relaxed">
          <p className="text-warm-muted">
            I'm a student in Nairobi. Orchestra-Core started because financial literacy wasn't something my school taught — and the apps I tried either wanted my data, my monthly subscription, or both.
          </p>
          <p className="text-warm-muted">
            What I actually wanted was simple: clear lessons that explain how money works the way a patient teacher would. Why central banks raise rates. What an M-Pesa float actually is. How a payslip is really put together. Not advice — understanding.
          </p>
          <p className="text-warm-muted">
            So I built Orchestra-Core: clear, practical, Kenya-first lessons on how money actually works — M-Pesa, SACCOs, the NSE, taxes, real shillings. One payment, no subscriptions, yours to keep, written to a depth most people never get access to.
          </p>

          <div className="my-12 p-8 rounded-2xl bg-blush border border-border">
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Mission</div>
            <p className="font-serif text-2xl text-foreground leading-snug">
              Make the financial knowledge of the wealthy available to anyone with a phone — without the jargon, the upsells, or the surveillance.
            </p>
          </div>

          <p className="text-warm-muted">
            Orchestra-Core is built for Kenya first because that's home. Expanding beyond is the goal — but only when each new market gets lessons that actually fit it, not a translation of the Kenya version.
          </p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
