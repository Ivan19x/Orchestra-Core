import { useState } from 'react';
import { Search } from 'lucide-react';
import { series, lessonUrlSlug } from '@/lib/lessons';
import { LessonCard } from '@/components/orchestra-core/LessonCard';
import { CTABand } from '@/components/orchestra-core/CTABand';
import { useSession } from '@/lib/session';

export default function Lessons() {
  const [q, setQ] = useState('');
  const session = useSession();
  const paid = !!session?.paid;
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Lesson library</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Every lesson, in one place.</h1>
          <p className="text-sm text-warm-muted max-w-md mx-auto mb-6">
            Read every lesson right here in your browser. Free lessons are open to everyone; the full library unlocks with Orchestra-Core.
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
        {series.map(s => {
          if (s.comingSoon) {
            if (q) return null;
            return (
              <div key={s.id} className="opacity-50">
                <div className="flex items-start gap-4 p-5 rounded-xl bg-blush border border-border mb-6">
                  <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center text-primary shrink-0">
                    <s.icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-2xl text-foreground">{s.name}</h2>
                      <span className="text-xs uppercase tracking-widest text-faint border border-border rounded-full px-2 py-0.5">Coming soon</span>
                    </div>
                    <p className="text-sm text-warm-muted mt-1">{s.tagline}</p>
                  </div>
                </div>
              </div>
            );
          }
          const filtered = s.lessons.filter(l => l.title.toLowerCase().includes(q.toLowerCase()));
          if (q && filtered.length === 0) return null;
          return (
            <div key={s.id}>
              <div className="flex items-start gap-4 p-5 rounded-xl bg-blush border border-border mb-6">
                <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center text-primary shrink-0">
                  <s.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-foreground">{s.name}</h2>
                  <p className="text-sm text-warm-muted mt-1">{s.tagline}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filtered.map(l => (
                  <LessonCard
                    key={l.title}
                    {...l}
                    to={`/lessons/${lessonUrlSlug(l)}`}
                    locked={!!l.premium && !paid}
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
