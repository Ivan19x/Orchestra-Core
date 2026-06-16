import { Heart, Coffee, Globe } from 'lucide-react';

const supporters = ['Amani', 'James', 'Wanjiku', 'Mike', 'Achieng', 'David', 'Faith', 'Brian', 'Sasha', 'Kimani', 'Naomi', 'Tobi'];

export default function Support() {
  const goal = 150000;
  const raised = 92400;
  const pct = Math.round((raised / goal) * 100);

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
            <Heart className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Support Orchestra-Core</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6">Keep Orchestra-Core free for those who can't pay.</h1>
          <p className="text-warm-muted max-w-xl mx-auto leading-relaxed">
            Every contribution funds the servers and lesson development that let students, hustlers, and low-income learners use Orchestra-Core at no cost. No company, no investors — just one student trying to make this useful.
          </p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="p-8 rounded-2xl border border-border bg-background">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="font-serif text-3xl text-foreground">KES {raised.toLocaleString()}</div>
              <div className="text-xs text-warm-muted mt-1">raised of KES {goal.toLocaleString()} goal</div>
            </div>
            <div className="text-primary font-medium">{pct}%</div>
          </div>
          <div className="w-full h-2 rounded-full bg-blush overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-8 p-8 rounded-2xl border border-border bg-background text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">M-Pesa Till</div>
          <div className="font-serif text-5xl text-primary mb-2">5283910</div>
          <p className="text-sm text-warm-muted">Lipa na M-Pesa · Buy Goods and Services</p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition">
            <Coffee className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground text-sm">Buy Me a Coffee</div>
              <div className="text-xs text-warm-muted">For one-off contributions</div>
            </div>
          </a>
          <a href="#" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground text-sm">International (Stripe)</div>
              <div className="text-xs text-warm-muted">Card payments worldwide</div>
            </div>
          </a>
        </div>

        <div className="mt-12">
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Recent supporters</div>
          <div className="flex flex-wrap gap-2">
            {supporters.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-blush text-sm text-foreground border border-border">{s}</span>
            ))}
          </div>
          <p className="text-xs text-faint mt-4">Names shown with permission. Opt in or out anytime.</p>
        </div>
      </section>
    </>
  );
}
