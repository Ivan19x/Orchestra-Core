import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';

const SPLIT = [
  { label: 'Needs', pct: 50 },
  { label: 'Wants', pct: 30 },
  { label: 'Savings & goals', pct: 20 },
];

export function BudgetBuilderCard() {
  const [income, setIncome] = useState('');
  const amount = Number(income.replace(/[^0-9.]/g, ''));
  const hasAmount = amount > 0;

  const question = hasAmount
    ? `I take home about KES ${Math.round(amount).toLocaleString()} per month — can you walk me through a 50/30/20 budget for that?`
    : "Can you walk me through how a 50/30/20 budget works?";

  return (
    <div className="p-6 rounded-xl border border-border bg-background flex flex-col">
      <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary mb-4">
        <Wallet className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg text-foreground mb-1.5">Budget builder</h3>
      <p className="text-sm text-warm-muted leading-relaxed mb-4">
        A 50/30/20 starting point — needs, wants, and savings — based on your take-home pay.
      </p>

      <label className="text-xs text-faint mb-1.5" htmlFor="budget-income">Monthly take-home pay (KES)</label>
      <input
        id="budget-income"
        inputMode="numeric"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
        placeholder="e.g. 45000"
        className="px-3 py-2 rounded-lg bg-blush border border-border text-sm focus:outline-none focus:border-primary mb-4"
      />

      <div className="space-y-2.5 mb-5">
        {SPLIT.map(({ label, pct }) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs text-warm-muted mb-1">
              <span>{label} · {pct}%</span>
              <span>{hasAmount ? `KES ${Math.round((amount * pct) / 100).toLocaleString()}` : '—'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blush overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: hasAmount ? `${pct}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      <Link
        to={`/ask?q=${encodeURIComponent(question)}`}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-auto"
      >
        Discuss this with Orchestra-Core <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
