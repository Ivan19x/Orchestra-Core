import { Check, Smartphone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { PRICE_LABEL } from '@/lib/pricing';
import { getAllLessons } from '@/lib/lessons';

const benefits = [
  'Every lesson in every series — unlocked forever',
  'Every future lesson and update, at no extra cost',
  'Read it all in your browser — nothing to install',
  'Kenya-first, written to a book-quality standard',
  'No subscriptions, no tracking, no upsells',
];

const faqs = [
  {
    q: 'Is this financial advice?',
    a: 'No. Orchestra-Core is financial education. It teaches you how money, markets, and institutions work so you can make better decisions — but it never tells you what to buy or sell, and we never touch your money.',
  },
  {
    q: 'How do I pay?',
    a: 'With M-Pesa. Enter your Safaricom number at checkout and you\'ll get the usual prompt on your phone — enter your PIN and your account unlocks straight away. We never see your PIN.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Orchestra-Core runs entirely on the website. Create an account, sign in, and read.',
  },
  {
    q: 'What exactly do I get for one payment?',
    a: 'Lifetime access to the full written curriculum — every lesson across every series, current and future. One payment, owned forever, no subscription.',
  },
  {
    q: 'Can I read anything before paying?',
    a: 'Yes. The starter lesson in each series is free to read with a free account — no payment details needed. Read those first and decide afterwards.',
  },
  {
    q: 'Why do you need my email?',
    a: 'To link your purchase to you, so you can sign back in from any device without paying again. We store nothing else and never sell your data.',
  },
  {
    q: 'What if my payment fails?',
    a: 'Nothing is charged unless the M-Pesa prompt is completed. If money left your account but access didn\'t unlock, email us with your M-Pesa confirmation code and we\'ll sort it out.',
  },
];

export default function Pricing() {
  const lessons = getAllLessons();

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-24 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Pricing</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">One payment. Lifetime access.</h1>
          <p className="text-warm-muted max-w-lg mx-auto">
            Most money apps charge you every month. Orchestra-Core charges you once.
          </p>
        </div>
      </section>

      <section className="container-prose py-20">
        <div className="max-w-md mx-auto p-8 md:p-10 rounded-2xl border border-border bg-background shadow-sm">
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">No subscriptions</div>
            <div className="font-serif text-6xl text-primary mb-2">{PRICE_LABEL}</div>
            <p className="text-sm text-warm-muted">paid once · unlocks all {lessons.length} lessons and everything to come</p>
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
            Get Orchestra-Core
          </Link>

          <p className="flex items-center justify-center gap-1.5 text-xs text-faint mt-4">
            <Smartphone className="w-3 h-3" /> Pay with M-Pesa · secure prompt straight to your phone
          </p>
        </div>

        <p className="text-center text-sm text-warm-muted mt-8">
          Not ready? <Link to="/signup" className="text-primary hover:underline">Create a free account</Link> and read
          the starter lesson in each series first.
        </p>
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
