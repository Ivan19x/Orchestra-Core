import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';

const samples: Record<string, { you: string; coach: string }> = {
  'Why do markets drop?': {
    you: 'Why do markets drop?',
    coach: "Markets typically fall for a handful of reasons: central banks signal higher rates for longer (which makes future earnings worth less today), a major company misses earnings expectations and drags sentiment down, geopolitical news spooks investors, or a broader shift in risk appetite causes a sell-off. These things often stack — one trigger is mild, three at once can move markets significantly. I don't have live data, so I can't tell you what's happening right now, but I can explain any of these mechanisms in detail.",
  },
  "What's a 13F filing?": {
    you: "What's a 13F filing?",
    coach: 'A 13F is a quarterly disclosure that any U.S. investment manager with $100M+ must file with the SEC. It lists their long stock positions as of quarter-end. People watch them to see what Buffett, Burry, and other big names are buying — but remember, they\'re backwards-looking by up to 45 days.',
  },
  'How much should I save each month?': {
    you: 'How much should I save each month?',
    coach: 'A common starting frame is 50/30/20 — half of after-tax income to needs, 30% to wants, 20% to saving and debt payoff. But the more useful question is: how many months of expenses do you have in cash right now? Below three, prioritize building that buffer. Above six, start moving the surplus into investments.',
  },
  'What is compound interest?': {
    you: 'What is compound interest?',
    coach: 'Compound interest is interest earning interest. KES 10,000 at 10% per year is 11,000 after year one — but in year two you earn 10% on 11,000, not on 10,000. Over 30 years, that small loop turns 10,000 into about 174,000. Want me to show you the math?',
  },
};

const questions = Object.keys(samples);

export default function Try() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Try Orchestra-Core</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Talk to your coach.</h1>
          <p className="text-warm-muted">No sign-up. These are sample conversations — try a question.</p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="rounded-2xl border border-border bg-background p-6 md:p-8 min-h-[400px] flex flex-col">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-warm-muted">
              <Sparkles className="w-8 h-8 text-primary mb-3" strokeWidth={1.5} />
              <p>Pick a question below to see Orchestra-Core at work.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm">{samples[active].you}</div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-blush border border-border text-foreground text-sm leading-relaxed">{samples[active].coach}</div>
              </div>
              <p className="text-xs text-faint pt-4 border-t border-border">Orchestra-Core is financial education, not financial advice.</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-border">
            <input disabled placeholder="Ask anything about money…" className="flex-1 px-4 py-2.5 rounded-full bg-blush border border-border text-sm focus:outline-none" />
            <button disabled className="p-2.5 rounded-full bg-primary/40 text-primary-foreground cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-3">Try a sample question</div>
          <div className="flex flex-wrap gap-2">
            {questions.map(q => (
              <button key={q} onClick={() => setActive(q)}
                className={`text-sm px-4 py-2 rounded-full border transition ${active === q ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:border-primary hover:text-primary'}`}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/pricing" className="inline-flex items-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            Get the full version
          </Link>
        </div>
      </section>
    </>
  );
}
