import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { StreakBadge } from '@/components/orchestra-core/StreakBadge';
import { BudgetBuilderCard } from '@/components/orchestra-core/BudgetBuilderCard';
import { getAllSeries, lessonHref, seriesIcon } from '@/lib/lessons';
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
  const series = getAllSeries();

  // Signed-in learning space — send anonymous visitors to create an account.
  useEffect(() => {
    if (!session) navigate('/signup', { replace: true });
  }, [session, navigate]);
  if (!session) return null;

  const lockedCount = series.flatMap(s => s.lessons).filter(l => !l.free).length;

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
        {/* Upgrade nudge — only for free accounts, and only once, at the top. */}
        {!paid && lockedCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-primary/30 bg-blush">
            <div>
              <h2 className="text-foreground mb-1">{lockedCount} more lessons are waiting.</h2>
              <p className="text-sm text-warm-muted">
                One payment unlocks every series — current and future — for good.
              </p>
            </div>
            <Link to="/checkout"
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Unlock everything — {PRICE_LABEL}
            </Link>
          </div>
        )}

        {/* The whole library, by series */}
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.18em] text-faint">Your lessons</div>
            <Link to="/lessons" className="text-xs text-primary hover:underline">See the full programme →</Link>
          </div>

          {series.length === 0 ? (
            <p className="text-sm text-warm-muted">Lessons are being added — check back soon.</p>
          ) : (
            series.map(s => {
              const Icon = seriesIcon(s.series);
              return (
                <div key={s.series}>
                  <h2 className="font-serif text-xl text-foreground mb-3">{s.title}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {s.lessons.map(l => {
                      const locked = !l.free && !paid;
                      return (
                        <Link key={l.code} to={lessonHref(l)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-blush transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-blush flex items-center justify-center text-primary shrink-0">
                            <Icon className="w-4 h-4" strokeWidth={1.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.12em] text-faint">
                              Module {l.module} · {l.estMinutes} min
                            </div>
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
              );
            })
          )}
        </div>

        {/* Budgeting tool */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-faint mb-4">Tools</div>
          <div className="max-w-md">
            <BudgetBuilderCard />
          </div>
        </div>
      </section>
    </>
  );
}
