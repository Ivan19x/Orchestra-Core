import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Lock } from 'lucide-react';
import { getAllLessons } from '@/lib/lessons';
import { dayOfYear } from '@/lib/quickTools';

/** Picks "today's" lesson by rotating through the full corpus, no backend needed. */
export function TodaysInsightCard() {
  const lessons = getAllLessons();
  const lesson = lessons[dayOfYear() % lessons.length];
  const moduleNumber = parseInt(lesson.module.replace(/\D/g, ''), 10) || 1;
  const seriesLessonCount = lessons.filter((l) => l.seriesId === lesson.seriesId).length;
  const progressPct = Math.round((moduleNumber / seriesLessonCount) * 100);
  const Icon = lesson.icon;

  return (
    <div className="p-6 md:p-8 rounded-2xl border border-border bg-background">
      <div className="flex items-start justify-between mb-5">
        <div className="text-xs uppercase tracking-[0.18em] text-primary">Today's insight</div>
        {lesson.premium && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-blush px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Premium
          </span>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blush flex items-center justify-center text-primary shrink-0">
          <Icon className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-faint mb-1">{lesson.seriesName} · {lesson.module}</div>
          <h3 className="text-xl text-foreground mb-2 leading-snug">{lesson.title}</h3>
          <div className="flex items-center gap-1.5 text-xs text-warm-muted">
            <Clock className="w-3 h-3" /> {lesson.readTime}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-warm-muted mb-1.5">
          <span>{lesson.seriesName} progress</span>
          <span>{lesson.module} of {seriesLessonCount}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-blush overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <Link to="/lessons" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-5">
        Continue in Explore <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
