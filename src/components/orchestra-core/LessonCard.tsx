import { Clock, type LucideIcon } from 'lucide-react';

export interface LessonCardProps {
  icon: LucideIcon;
  title: string;
  module: string;
  readTime: string;
  premium?: boolean;
}

export function LessonCard({ icon: Icon, title, module, readTime }: LessonCardProps) {
  return (
    <div className="relative p-5 rounded-xl border border-border bg-background">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-1">
          Preview
        </span>
      </div>
      <div className="text-xs text-faint mb-1.5">{module}</div>
      <h3 className="text-lg leading-snug text-foreground mb-3">{title}</h3>
      <div className="flex items-center gap-1.5 text-xs text-warm-muted">
        <Clock className="w-3 h-3" /> {readTime}
      </div>
    </div>
  );
}
