import { useState } from 'react';
import { Search } from 'lucide-react';
import { getAllSeries, seriesIcon, lessonHref } from '@/lib/lessons';
import { LessonCard } from '@/components/orchestra-core/LessonCard';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { useSession } from '@/lib/session';

export default function Lessons() {
  const [q, setQ] = useState('');
  const session = useSession();
  const paid = !!session?.paid;
  const series = getAllSeries();

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Lesson library</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Learn how money actually works.</h1>
          <p className="text-sm text-warm-muted max-w-md mx-auto mb-6">
            Clear, practical, Kenya-first lessons you read at your own pace. The starter lesson in each series is free
            with a free account; one payment unlocks the full library.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-muted" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search lessons…"
              className="w-full pl-11 pr-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>
      </section>

      <section className="container-prose py-16 space-y-16">
        {series.length === 0 && (
          <p className="text-center text-warm-muted">Lessons are being written — check back soon.</p>
        )}

        {series.map(s => {
          const Icon = seriesIcon(s.series);
          const filtered = s.lessons.filter(l => l.title.toLowerCase().includes(q.toLowerCase()));
          if (q && filtered.length === 0) return null;
          return (
            <div key={s.series}>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-blush border border-border mb-6">
                <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-faint mb-0.5">Series {s.series}</div>
                  <h2 className="font-serif text-2xl text-foreground">{s.title}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filtered.map(l => (
                  <LessonCard
                    key={l.code}
                    icon={Icon}
                    title={l.title}
                    module={`Module ${l.module}`}
                    readTime={`${l.estMinutes} min read`}
                    premium={!l.free}
                    to={lessonHref(l)}
                    locked={!l.free && !paid}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <CTABand />
    </>
  );
}
