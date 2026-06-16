import { StreakBadge } from '@/components/orchestra-core/StreakBadge';
import { TodaysInsightCard } from '@/components/orchestra-core/TodaysInsightCard';
import { BudgetBuilderCard } from '@/components/orchestra-core/BudgetBuilderCard';
import { WhatWouldTheyDoCard } from '@/components/orchestra-core/WhatWouldTheyDoCard';
import { MarketMoodCard } from '@/components/orchestra-core/MarketMoodCard';
import { AskPanel } from '@/components/orchestra-core/AskPanel';
import { SupportPanel } from '@/components/orchestra-core/SupportPanel';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
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
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Quick tools</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BudgetBuilderCard />
            <WhatWouldTheyDoCard />
            <MarketMoodCard />
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Ask Orchestra-Core</div>
          <AskPanel compact />
        </div>

        <SupportPanel />
      </section>
    </>
  );
}
