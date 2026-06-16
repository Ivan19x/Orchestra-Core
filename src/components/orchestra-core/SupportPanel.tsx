import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

export function SupportPanel() {
  const goal = 150000;
  const raised = 92400;
  const pct = Math.round((raised / goal) * 100);

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-border bg-background">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-foreground">
          <Heart className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <h3 className="text-base">Support Orchestra-Core</h3>
        </div>
        <Link to="/support" className="text-xs text-primary hover:underline">M-Pesa &amp; more</Link>
      </div>

      <p className="text-sm text-warm-muted leading-relaxed mb-4">
        Your purchase already helps fund this. Want to help more learners get full access?
      </p>

      <div className="flex items-baseline justify-between mb-2">
        <div className="font-serif text-2xl text-foreground">KES {raised.toLocaleString()}</div>
        <div className="text-primary text-sm font-medium">{pct}% of KES {goal.toLocaleString()}</div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-blush overflow-hidden mb-5">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <Link to="/support" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        Inter se pecuniarie adiuvantes — help one another financially <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
