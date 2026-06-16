import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Shuffle } from 'lucide-react';
import { marketMoodConcepts, dayOfYear } from '@/lib/quickTools';

export function MarketMoodCard() {
  const [index, setIndex] = useState(() => dayOfYear() % marketMoodConcepts.length);
  const concept = marketMoodConcepts[index];

  return (
    <div className="p-6 rounded-xl border border-border bg-background flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
          <Brain className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % marketMoodConcepts.length)}
          className="p-1.5 rounded-full text-faint hover:text-primary hover:bg-blush transition"
          title="Show a different concept"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-lg text-foreground mb-1.5">Money psychology</h3>
      <div className="text-sm text-foreground font-medium mb-1.5">{concept.title}</div>
      <p className="text-sm text-warm-muted leading-relaxed mb-5">{concept.blurb}</p>

      <Link
        to={`/ask?q=${encodeURIComponent(concept.question)}`}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-auto"
      >
        Discuss this with Orchestra-Core <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
