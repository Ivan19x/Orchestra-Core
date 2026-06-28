import { Check, Clock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { TESTING_PHASE, useCountdown, formatCountdown } from '@/lib/testingPhase';
import { PRICE_LABEL } from '@/lib/pricing';

const benefits = [
  'The full lesson library across all nine series — forever',
  'Read everything in your browser — no install needed',
  'Kenya-first, written to a book-quality standard',
  'Every future lesson and update, for as long as Orchestra-Core operates',
  'No subscriptions, no tracking, no upsells',
];

const faqs = [
  { q: 'Is this financial advice?', a: 'No. Orchestra-Core is financial education. It teaches you how money, markets, and institutions work so you can make better decisions — but it never tells you what to buy or sell, and we never touch your money.' },
  { q: 'Do I need to install anything?', a: 'No. Orchestra-Core runs directly on the website — sign in and read every lesson in your browser, no download required.' },
  { q: 'Do I need internet?', a: 'Yes — Orchestra-Core runs on the website, so you need a connection to read your lessons.' },
  { q: 'What exactly do I get for one payment?', a: 'Lifetime access to the full written curriculum — every lesson across all nine series, current and future. One payment, owned forever, no subscription.' },
  { q: 'Why do I need to give my email?', a: 'We link your payment to your email so you can sign back in and keep your access if you switch devices, without paying again. We store nothing else and never sell your data.' },
  { q: 'Is there an AI tutor?', a: 'Not yet. An AI tutor is planned for later — once Orchestra-Core runs it on its own infrastructure — and it will be a separate, optional add-on. The written lessons are the product today, and they stay a one-time purchase, forever.' },
];

export default function Pricing() {
  const countdown = useCountdown();

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-24 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Pricing</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">One payment. Lifetime access.</h1>
          <p className="text-warm-muted max-w-lg mx-auto">Most money apps charge you every month. Orchestra-Core charges you once.</p>
        </div>
      </section>

      <section className="container-prose py-20">
        <div className="max-w-md mx-auto p-8 md:p-10 rounded-2xl border border-border bg-background shadow-sm">
          <div className="text-center mb-8">
            {TESTING_PHASE ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                  <Clock className="w-3 h-3" />
                  Testing phase
                </div>
                <div className="font-serif text-6xl text-primary mb-2">0 KES</div>
                <p className="text-sm text-warm-muted mb-1">Free during testing</p>
                {countdown && (
                  <p className="text-xs text-faint">
                    Paid access (KES 2,000) returns in {formatCountdown(countdown)}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">No subscriptions</div>
                <div className="font-serif text-6xl text-primary mb-2">{PRICE_LABEL}</div>
                <p className="text-sm text-warm-muted">paid once · no subscription</p>
              </>
            )}
          </div>
          <ul className="space-y-3 mb-8">
            {benefits.map(b => (
              <li key={b} className="flex gap-3 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Link to="/checkout"
            className="block text-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            {TESTING_PHASE ? 'Get free access' : 'Get Orchestra-Core'}
          </Link>
          <p className="text-xs text-faint text-center mt-4">
            {TESTING_PHASE
              ? 'Testing phase — no payment required. Access resets when paid mode returns.'
              : 'Pay with M-Pesa or card via IntaSend.'}
          </p>
        </div>
      </section>

      <section className="container-narrow pb-24">
        <h2 className="font-serif text-3xl text-foreground mb-6 text-center">Common questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-warm-muted leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
