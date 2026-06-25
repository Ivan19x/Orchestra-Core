import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, Brain } from 'lucide-react';
import { AiSetupPanel } from '@/components/orchestra-core/AiSetupPanel';
import { StreakBadge } from '@/components/orchestra-core/StreakBadge';
import { TodaysInsightCard } from '@/components/orchestra-core/TodaysInsightCard';
import { BudgetBuilderCard } from '@/components/orchestra-core/BudgetBuilderCard';
import { WhatWouldTheyDoCard } from '@/components/orchestra-core/WhatWouldTheyDoCard';
import { MarketMoodCard } from '@/components/orchestra-core/MarketMoodCard';
import { AskPanel } from '@/components/orchestra-core/AskPanel';
import { SupportPanel } from '@/components/orchestra-core/SupportPanel';
import { getAllLessons, lessonUrlSlug } from '@/lib/lessons';
import { useSession } from '@/lib/session';
import { PRICE_LABEL } from '@/lib/pricing';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const session = useSession();
  const navigate = useNavigate();
  const paid = !!session?.paid;
  const lessons = getAllLessons().slice(0, 6);
  const [aiReady, setAiReady] = useState(false);

  // The dashboard is the signed-in product surface — send anonymous visitors
  // to create a free account first.
  useEffect(() => {
    if (!session) navigate('/signup', { replace: true });
  }, [session, navigate]);
  if (!session) return null;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-prose py-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Dashboard (local preview)</div>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">{greeting()}.</h1>
          </div>
          <StreakBadge />
        </div>
      </section>

      <section className="container-prose py-16 space-y-12">
        <TodaysInsightCard />

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-faint">Your lessons</div>
            <Link to="/lessons" className="text-xs text-primary hover:underline">Browse all →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {lessons.map(l => {
              const locked = !!l.premium && !paid;
              return (
                <Link
                  key={l.slug ?? l.title}
                  to={`/lessons/${lessonUrlSlug(l)}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-blush transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blush flex items-center justify-center text-primary shrink-0">
                    <l.icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-faint">{l.seriesName} · {l.module}</div>
                    <p className="text-sm text-foreground truncate">{l.title}</p>
                  </div>
                  {locked
                    ? <Lock className="w-3.5 h-3.5 text-faint shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-faint shrink-0" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Quick tools</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BudgetBuilderCard />
            <WhatWouldTheyDoCard />
            <MarketMoodCard />
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Ask Orchestra-Core</div>
          {paid ? (
            <div className="space-y-4">
              <AiSetupPanel onReady={setAiReady} />
              {aiReady && <AskPanel compact ready />}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-blush p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
                <Brain className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-2">Your AI coach is part of full access</h3>
              <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
                Unlock the private AI coach — plus every lesson — with a single one-time purchase. No subscription.
              </p>
              <Link to="/checkout" className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
                Get full access — {PRICE_LABEL}
              </Link>
            </div>
          )}
        </div>

        <SupportPanel />
      </section>
    </>
  );
}
