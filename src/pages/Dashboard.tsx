import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { StreakBadge } from '@/components/orchestra-core/StreakBadge';
import { BudgetBuilderCard } from '@/components/orchestra-core/BudgetBuilderCard';
import { SupportPanel } from '@/components/orchestra-core/SupportPanel';
import { getAllLessons, lessonHref, seriesIcon } from '@/lib/lessons';
import { useSession } from '@/lib/session';

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

  // Signed-in learning space — send anonymous visitors to create an account.
  useEffect(() => {
    if (!session) navigate('/signup', { replace: true });
  }, [session, navigate]);
  if (!session) return null;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-prose py-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">Your learning</div>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">{greeting()}.</h1>
          </div>
          <StreakBadge />
        </div>
      </section>

      <section className="container-prose py-16 space-y-12">
        {/* Continue learning */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-faint">Continue learning</div>
            <Link to="/lessons" className="text-xs text-primary hover:underline">Browse all →</Link>
          </div>
          {lessons.length === 0 ? (
            <p className="text-sm text-warm-muted">Lessons are being added — check back soon.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {lessons.map(l => {
                const Icon = seriesIcon(l.series);
                const locked = !l.free && !paid;
                return (
                  <Link key={l.code} to={lessonHref(l)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-blush transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-blush flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.12em] text-faint">{l.seriesTitle} · Module {l.module}</div>
                      <p className="text-sm text-foreground truncate">{l.title}</p>
                    </div>
                    {locked
                      ? <Lock className="w-3.5 h-3.5 text-faint shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-faint shrink-0" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Budgeting tool */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Tools</div>
          <div className="max-w-md">
            <BudgetBuilderCard />
          </div>
        </div>

        <SupportPanel />
      </section>
    </>
  );
}
