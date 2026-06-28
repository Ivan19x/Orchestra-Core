import { Clock, Lock, ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface LessonCardProps {
  icon: LucideIcon;
  title: string;
  module: string;
  readTime: string;
  premium?: boolean;
  /** Lesson reader URL. When set, the whole card becomes a link. */
  to?: string;
  /** Premium lesson the current visitor hasn't unlocked yet. */
  locked?: boolean;
  /** Planned module with no content file yet — shown but not openable. */
  comingSoon?: boolean;
}

export function LessonCard({ icon: Icon, title, module, readTime, premium, to, locked, comingSoon }: LessonCardProps) {
  const card = (
    <div className={`relative h-full p-5 rounded-xl border border-border bg-background transition-colors ${comingSoon ? 'opacity-55' : 'group-hover:bg-blush group-hover:border-primary/30'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        {comingSoon ? (
          <span className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">Soon</span>
        ) : locked ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">
            <Lock className="w-2.5 h-2.5" /> Premium
          </span>
        ) : !premium ? (
          <span className="text-[10px] uppercase tracking-wider text-primary border border-primary/30 rounded-full px-2 py-1">
            Free
          </span>
        ) : null}
      </div>
      <div className="text-xs text-faint mb-1.5">{module}</div>
      <h3 className="text-lg leading-snug text-foreground mb-3">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-warm-muted">
          <Clock className="w-3 h-3" /> {readTime}
        </div>
        {!comingSoon && (
          <span className="inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
            {locked ? 'Unlock' : 'Read'} <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );

  return to ? <Link to={to} className="group block h-full">{card}</Link> : card;
}
