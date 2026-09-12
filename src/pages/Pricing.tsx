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

// The five questions someone asks with their thumb over the pay button.
// Everything else lives on /faq so the two pages don't repeat each other.
const faqs = [
  {
    q: 'What exactly do I get for one payment?',
    a: 'Every lesson across every series, unlocked for good — plus every lesson added later, at no extra cost. One payment, owned forever, no subscription and nothing auto-debited.',
  },
  {
    q: 'Can I read anything before paying?',
    a: 'Yes. The first lesson of every series is free to read with a free account, and you enter no payment details to get them. They are real lessons, not samples — read them first and decide afterwards.',
  },
  {
    q: 'How do I pay?',
    a: 'With M-Pesa. Enter your Safaricom number at checkout and the usual prompt comes to your phone — enter your PIN and your account unlocks straight away. Your PIN is entered on your own handset and never reaches us.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Because you can read the free lessons before paying, there is no change-of-mind refund once your access is open. But if you pay and the service is not working, tell us within 14 days and you can take a full refund or have your access switched on by hand. Duplicate charges are always refunded in full.',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. It teaches you how money, markets and institutions work so you can make your own decisions — it never tells you what to buy or sell, and we never touch your money.',
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

        <p className="text-center mt-8">
          <Link to="/faq" className="text-sm text-primary hover:underline">
            More questions people ask →
          </Link>
        </p>
      </section>
    </>
  );
}
