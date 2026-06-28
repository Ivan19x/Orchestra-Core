import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { getLessonByCode, type Lesson as LessonType } from '@/lib/lessons';
import { LessonArticle } from '@/components/orchestra-core/LessonArticle';
import { useSession } from '@/lib/session';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Lesson() {
  const { code = '' } = useParams();
  const session = useSession();
  const lesson = getLessonByCode(code);

  if (!lesson) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">Lesson not found</h1>
        <p className="text-sm text-warm-muted mb-8">We couldn't find that lesson — it may have moved.</p>
        <Link to="/lessons" className="text-sm text-primary hover:underline">Back to all lessons</Link>
      </section>
    );
  }

  // Free lessons are open to everyone; paid lessons need an unlocked account.
  // This reads the EXISTING session/license system (session.paid) — see
  // src/lib/session.ts; no separate auth is introduced here.
  const unlocked = lesson.free || !!session?.paid;

  return (
    <section className="container-narrow py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/lessons"
          className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-foreground transition mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back to lessons
        </Link>

        {unlocked ? (
          <LessonArticle
            seriesName={lesson.seriesTitle}
            module={`Module ${lesson.module}`}
            title={lesson.title}
            readTime={`${lesson.estMinutes} min read`}
            body={lesson.body}
          />
        ) : (
          <Paywall lesson={lesson} signedIn={!!session} />
        )}
      </div>
    </section>
  );
}

// Paid lesson, account not unlocked: show what it covers, then the unlock prompt.
function Paywall({ lesson, signedIn }: { lesson: LessonType; signedIn: boolean }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">{lesson.seriesTitle} · Module {lesson.module}</div>
      <h1 className="font-serif text-3xl text-foreground mb-2 leading-tight">{lesson.title}</h1>
      {lesson.summary && <p className="text-sm text-warm-muted mb-8 leading-relaxed">{lesson.summary}</p>}

      <div className="rounded-2xl border border-border bg-blush p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
          <Lock className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Unlock the full curriculum</h2>
        <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
          One payment opens every lesson across all series — yours to keep, no subscription.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/checkout"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
          >
            Get full access — {PRICE_LABEL}
          </Link>
          {!signedIn && (
            <Link to="/login" className="text-sm text-warm-muted hover:text-foreground transition">
              Already bought? Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
