import { Heart } from 'lucide-react';

export default function Support() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
            <Heart className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Support Orchestra-Core</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6">Help Orchestra-Core grow.</h1>
          <p className="text-warm-muted max-w-xl mx-auto leading-relaxed">
            Contributions fund more lessons, more series, and eventually a free hosted tier for learners who cannot afford to pay. No company behind this — just one student in Nairobi building something useful.
          </p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="p-8 rounded-2xl border border-border bg-background text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">M-Pesa · Send Money</div>
          <div className="font-serif text-5xl text-primary mb-2">0790 694 452</div>
          <p className="text-sm text-warm-muted mb-1">Send any amount — every shilling goes directly to lesson development and hosting.</p>
          <p className="text-xs text-faint">M-Pesa → Send Money → enter 0790694452</p>
        </div>

        <div className="mt-8 p-8 rounded-2xl border border-border bg-background">
          <h2 className="font-serif text-2xl text-foreground mb-3">Where contributions go</h2>
          <ul className="space-y-3 text-sm text-warm-muted">
            <li className="flex gap-3"><span className="text-primary shrink-0">→</span> Writing and researching new lessons across the 9-series curriculum</li>
            <li className="flex gap-3"><span className="text-primary shrink-0">→</span> Hosting costs for the backend API and database</li>
            <li className="flex gap-3"><span className="text-primary shrink-0">→</span> Eventually: a free hosted tier so learners who cannot pay KES 1,500 can still access the basics</li>
          </ul>
          <p className="text-xs text-faint mt-6">Contributions are voluntary and non-refundable. They do not constitute an investment or equity stake. Orchestra-Core is a sole-proprietorship business name registered in Kenya.</p>
        </div>
      </section>
    </>
  );
}
