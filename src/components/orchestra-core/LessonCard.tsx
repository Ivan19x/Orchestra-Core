import { Lock, Clock, type LucideIcon } from 'lucide-react';

export interface LessonCardProps {
  icon: LucideIcon;
  title: string;
  module: string;
  readTime: string;
  premium?: boolean;
}

export function LessonCard({ icon: Icon, title, module, readTime, premium }: LessonCardProps) {
  return (
    <div className="group relative p-5 rounded-xl border border-border bg-background hover:border-primary/40 hover:shadow-sm transition cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        {premium && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary bg-blush px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Premium
          </span>
        )}
      </div>
      <div className="text-xs text-faint mb-1.5">{module}</div>
      <h3 className="text-lg leading-snug text-foreground mb-3 group-hover:text-primary transition">{title}</h3>
      <div className="flex items-center gap-1.5 text-xs text-warm-muted">
        <Clock className="w-3 h-3" /> {readTime}
      </div>
    </div>
  );
}
