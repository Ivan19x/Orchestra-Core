import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { getAllLessons } from '@/lib/lessons';
import { PRICE_LABEL } from '@/lib/pricing';

// The everyday questions someone actually has before and after paying.
// Figures come from the live catalogue rather than being typed in, so nothing
// here goes stale when lessons are added.
export default function Faq() {
  const lessons = getAllLessons();
  const freeCount = lessons.filter(l => l.free).length;
  const seriesCount = new Set(lessons.map(l => l.series)).size;

  const minutes = lessons.map(l => l.estMinutes).filter(m => m > 0).sort((a, b) => a - b);
  const typical = minutes.length ? minutes[Math.floor(minutes.length / 2)] : 0;
  const longest = minutes.length ? minutes[minutes.length - 1] : 0;

  const groups: { title: string; items: { q: string; a: ReactNode }[] }[] = [
    {
      title: 'Before you pay',
      items: [
        {
          q: 'What is Orchestra-Core?',
          a: `A written course in how money actually works, built for Kenya. ${seriesCount} series covering the basics of money, budgeting, saving, debt, taxes and investing — taught through the things you already deal with, like M-Pesa, SACCOs, mobile loans and the NSE. You read it in your browser at your own pace.`,
        },
        {
          q: 'Can I read anything before I pay?',
          a: (
            <>
              Yes. The first lesson of every series — {freeCount} lessons in total — is free to read with a
              free account, and you don't enter any payment details to get them.{' '}
              <Link to="/signup" className="text-primary hover:underline">Create a free account</Link> and
              read those first. They're real lessons, not samples.
            </>
          ),
        },
        {
          q: 'What do I get for one payment?',
          a: `Every lesson in every series, unlocked for good — plus every lesson added later, at no extra cost. ${PRICE_LABEL}, once. There is no subscription and no second payment.`,
        },
        {
          q: 'Is this financial advice?',
          a: 'No. It explains how money, institutions and markets work so you can make your own decisions. It never tells you what to buy or sell, and it never touches your money. For advice about your own situation, see a licensed professional.',
        },
      ],
    },
    {
      title: 'Reading the lessons',
      items: [
        {
          q: 'Do I need to install anything?',
          a: 'No. Orchestra-Core runs entirely on the website. Sign in and read.',
        },
        {
          q: 'Can I read on my phone?',
          a: 'Yes. It works on a phone, a tablet or a computer, and your account carries across all of them.',
        },
        {
          q: 'Do I need internet to read?',
          a: 'Yes — the lessons load from the website, so you need a connection. Each lesson is text, so it is light on data.',
        },
        {
          q: 'How long is a lesson?',
          a: `Most take about ${typical} minutes. The shortest are around ${minutes[0] ?? 0} minutes and the longest, the foundational ones, run to about ${longest}. They are written to be picked up and put down without losing the thread.`,
        },
        {
          q: 'Are the numbers current?',
          a: 'Figures — tax bands, tariffs, contribution rates — come from the institutions that publish them, and they are dated in the lesson so you can see when they were accurate. Rates change, so check the latest figure with the source before acting on it. Lessons are reviewed and corrected as rules change.',
        },
        {
          q: 'Will more lessons be added?',
          a: 'Yes, and they are included in what you already paid. New lessons appear in your account automatically.',
        },
        {
          q: 'What if I buy it and never finish?',
          a: 'You own it with no expiry, so there is no pressure to finish by any date. The lessons are short and self-contained precisely so you can come back after a gap and still follow along.',
        },
      ],
    },
    {
      title: 'Paying',
      items: [
        {
          q: 'How do I pay?',
          a: `With M-Pesa. Enter your Safaricom number at checkout and a prompt comes to your phone — enter your M-Pesa PIN to confirm ${PRICE_LABEL}. Your PIN is entered on your own handset and never reaches us.`,
        },
        {
          q: 'Is it a subscription?',
          a: 'No. One payment, and that is the end of it. Nothing renews and nothing is auto-debited from your M-Pesa.',
        },
        {
          q: 'The prompt never arrived, or my payment failed.',
          a: 'Nothing is charged unless you complete the prompt, so you can simply try again. The usual causes are a number that is not Safaricom, a phone that was off, or the prompt timing out before it was accepted.',
        },
        {
          q: 'I paid but my lessons did not unlock.',
          a: (
            <>
              Access normally opens within seconds, by itself. If it hasn't, email{' '}
              <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>{' '}
              with the M-Pesa confirmation code from your SMS and we will either unlock it by hand or refund
              you — your choice. See the refund question below.
            </>
          ),
        },
        {
          q: 'Can I get a refund?',
          a: (
            <>
              <p className="mb-3">
                Because the first lesson of every series is free to read before you pay, you are deciding
                with the actual writing in front of you — so there is no change-of-mind refund once your
                access is open. There are two situations where you do get your money back:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-2 mb-3">
                <li>
                  <strong className="text-foreground">The service wasn't working when you paid.</strong> If
                  you pay and cannot get to your lessons, tell us <strong className="text-foreground">within
                  14 days</strong> of the payment and you can take a full refund or have your access
                  switched on by hand. If we don't hear from you in those 14 days, no refund is due — but
                  nothing is lost either: your access is permanent and resumes the moment the service is
                  back, and you carry on reading where you stopped.
                </li>
                <li>
                  <strong className="text-foreground">You were charged twice</strong> for the same purchase.
                  The duplicate is refunded in full, whenever you notice it.
                </li>
              </ul>
              <p>
                Email{' '}
                <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>{' '}
                with your M-Pesa code and we reply within 5 business days. The full wording is in the{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
              </p>
            </>
          ),
        },
      ],
    },
    {
      title: 'Your account',
      items: [
        {
          q: 'Can I sign in on another device?',
          a: 'Yes. Your access belongs to your account, not to a device — sign in with the same email and password anywhere. It is for your own use, though, not for sharing.',
        },
        {
          q: 'I forgot my password.',
          a: (
            <>
              Use{' '}
              <Link to="/forgot-password" className="text-primary hover:underline">forgot password</Link> and
              a reset link is emailed to you. It lasts 10 minutes and works once.
            </>
          ),
        },
        {
          q: 'What do you do with my details?',
          a: (
            <>
              We store your email so you can sign back in, and the record of your payment. That's all.
              There is no advertising, no tracking and no analytics on this site, and nothing is sold to
              anyone. What you read and how far you get stays in your own browser. The detail is in the{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </>
          ),
        },
        {
          q: 'Is there an app?',
          a: 'Not yet — the website is the whole product for now, and finishing it properly comes before adding anything else. If an app arrives later it will be included for anyone who already bought.',
        },
      ],
    },
  ];

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Questions</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Questions people ask.</h1>
          <p className="text-warm-muted max-w-lg mx-auto">
            The practical ones — what you get, how paying works, and what happens if something goes wrong.
          </p>
        </div>
      </section>

      <section className="container-narrow py-16 space-y-12">
        {groups.map((group, gi) => (
          <div key={group.title}>
            <h2 className="font-serif text-2xl text-foreground mb-2">{group.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {group.items.map((item, i) => (
                <AccordionItem key={item.q} value={`g${gi}-q${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-warm-muted leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        <p className="text-sm text-warm-muted">
          Something not answered here? Email{' '}
          <a href="mailto:chweyaivan@gmail.com" className="text-primary hover:underline">chweyaivan@gmail.com</a>.
        </p>
      </section>

      <CTABand />
    </>
  );
}
