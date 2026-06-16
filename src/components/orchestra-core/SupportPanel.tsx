import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

export function SupportPanel() {
  return (
    <div className="p-6 md:p-8 rounded-2xl border border-border bg-background">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-foreground">
          <Heart className="w-4 h-4 text-primary" strokeWidth={1.75} />
          <h3 className="text-base">Support Orchestra-Core</h3>
        </div>
        <Link to="/support" className="text-xs text-primary hover:underline">Learn more</Link>
      </div>

      <p className="text-sm text-warm-muted leading-relaxed mb-5">
        Want to help fund more lessons and eventually a free tier for learners who cannot pay? Send any amount via M-Pesa.
      </p>

      <div className="bg-blush rounded-xl border border-border p-4 text-center mb-5">
        <div className="text-xs uppercase tracking-wider text-faint mb-1">M-Pesa Till · Buy Goods</div>
        <div className="font-serif text-3xl text-primary">5283910</div>
      </div>

      <Link to="/support" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        How contributions are used <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
