import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock } from 'lucide-react';

// The lesson header + rendered markdown body, shared by the website reader
// (src/pages/Lesson.tsx) and the in-app Electron reader (AppShell) so both
// stay visually identical. remark-gfm is what makes markdown tables (e.g. the
// 50/30/20 lesson) render as real tables instead of raw "|" pipes.
export function LessonArticle({
  seriesName,
  module,
  title,
  readTime,
  body,
}: {
  seriesName: string;
  module: string;
  title: string;
  readTime: string;
  body?: string;
}) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">{seriesName} · {module}</div>
      <h1 className="font-serif text-3xl text-foreground mb-2 leading-tight">{title}</h1>
      <span className="inline-flex items-center gap-1 text-xs text-faint mb-8">
        <Clock className="w-3 h-3" /> {readTime}
      </span>

      {body ? (
        <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-table:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-warm-muted">This lesson's full content isn't available yet — check back soon.</p>
      )}
    </>
  );
}
