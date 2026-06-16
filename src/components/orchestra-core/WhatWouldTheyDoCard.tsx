import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Shuffle } from 'lucide-react';
import { whatWouldTheyDoScenarios, dayOfYear } from '@/lib/quickTools';

export function WhatWouldTheyDoCard() {
  const [index, setIndex] = useState(() => dayOfYear() % whatWouldTheyDoScenarios.length);
  const scenario = whatWouldTheyDoScenarios[index];

  return (
    <div className="p-6 rounded-xl border border-border bg-background flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
          <Briefcase className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % whatWouldTheyDoScenarios.length)}
          className="p-1.5 rounded-full text-faint hover:text-primary hover:bg-blush transition"
          title="Show a different scenario"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-lg text-foreground mb-1.5">What would they do?</h3>
      <div className="text-sm text-foreground font-medium mb-1.5">{scenario.title}</div>
      <p className="text-sm text-warm-muted leading-relaxed mb-5">{scenario.blurb}</p>

      <Link
        to={`/ask?q=${encodeURIComponent(scenario.question)}`}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-auto"
      >
        Discuss this with Orchestra-Core <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
