import { Check } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

const benefits = [
  'Full lesson library, forever',
  'Ask Orchestra-Core, your private AI coach',
  'Works offline — your learning data stays on your device',
  'Every future lesson and update included',
  'No subscriptions, no tracking, no upsells',
];

const faqs = [
  { q: 'Is this financial advice?', a: 'No. Orchestra-Core is financial education. It teaches you how money, markets, and institutions work so you can make better decisions — but it never tells you what to buy or sell.' },
  { q: 'What if my phone is older?', a: 'Orchestra-Core is built to run on modest hardware. On the Download page we detect your device and recommend the version that will run best for you.' },
  { q: 'Do I need internet?', a: 'Only to download Orchestra-Core and pull lesson updates. Day-to-day reading and chatting with your coach works fully offline.' },
  { q: 'What exactly do I get for one payment?', a: 'Every lesson across Money basics, Smart money, and Kenya money — current and future. Unlimited use of your private AI coach. Forever.' },
  { q: 'Why do I need to give my phone or email?', a: 'We link your payment to a contact so you can re-download if you switch devices, without paying again. We store nothing else — your learning data never leaves your device.' },
  { q: 'Is the AI coach a real person?', a: 'No. The coach is a local AI language model (Qwen2.5) that runs entirely on your computer — not a human and not connected to any financial institution. It explains concepts; it does not give personalized financial advice.' },
];

export default function Pricing() {
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
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">No subscriptions</div>
            <div className="font-serif text-6xl text-primary mb-2">KES 1,500</div>
            <p className="text-sm text-warm-muted">paid once · roughly $11</p>
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
          <p className="text-xs text-faint text-center mt-4">Pay with M-Pesa or card via IntaSend.</p>
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
