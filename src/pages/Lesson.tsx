import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Lock, UserPlus } from 'lucide-react';
import { getLessonByCode, loadLessonBody, lessonHref, getAllSeries, type LessonMeta } from '@/lib/lessons';
import { LessonArticle } from '@/components/orchestra-core/LessonArticle';
import { useSession } from '@/lib/session';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Lesson() {
  const { code = '' } = useParams();
  const session = useSession();
  const lesson = getLessonByCode(code);

  // Reading any lesson needs a (free) account; premium lessons additionally
  // need a paid one. Anonymous → create-account gate; signed in but unpaid on a
  // premium lesson → upgrade gate; otherwise read.
  const gate: 'signup' | 'pay' | null = !session
    ? 'signup'
    : (!lesson?.free && !session.paid ? 'pay' : null);

  const [body, setBody] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Bodies are separate chunks — only fetch one once we know the reader is
  // actually allowed to see it.
  useEffect(() => {
    if (!lesson || gate) return;
    let cancelled = false;
    setBody(null);
    setLoadFailed(false);
    loadLessonBody(lesson.code)
      .then(text => { if (!cancelled) setBody(text); })
      .catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; };
  }, [lesson, gate]);

  if (!lesson) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">Lesson not found</h1>
        <p className="text-sm text-warm-muted mb-8">We couldn't find that lesson — it may have moved.</p>
        <Link to="/lessons" className="text-sm text-primary hover:underline">Back to all lessons</Link>
      </section>
    );
  }

  return (
    <section className="container-narrow py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/lessons"
          className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-foreground transition mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back to lessons
        </Link>

        {gate === 'signup' ? (
          <SignupGate lesson={lesson} />
        ) : gate === 'pay' ? (
          <Paywall lesson={lesson} />
        ) : (
          <>
            <LessonArticle
              seriesName={lesson.seriesTitle}
              module={`Module ${lesson.module}`}
              title={lesson.title}
              readTime={`${lesson.estMinutes} min read`}
              body={body ?? undefined}
              loading={body === null && !loadFailed}
            />
            {loadFailed && (
              <p className="text-sm text-warm-muted">
                This lesson couldn't be loaded. Check your connection and{' '}
                <button onClick={() => window.location.reload()} className="text-primary hover:underline">try again</button>.
              </p>
            )}
            {body !== null && <NextLesson lesson={lesson} />}
          </>
        )}
      </div>
    </section>
  );
}

// The next module in the same series, if one is published. Keeps a reader
// moving through the curriculum instead of dead-ending at the bottom.
function NextLesson({ lesson }: { lesson: LessonMeta }) {
  const series = getAllSeries().find(s => s.series === lesson.series);
  const idx = series?.lessons.findIndex(l => l.code === lesson.code) ?? -1;
  const next = idx >= 0 ? series?.lessons[idx + 1] : undefined;
  if (!next) return null;

  return (
    <Link
      to={lessonHref(next)}
      className="mt-12 flex items-center justify-between gap-4 p-5 rounded-xl border border-border bg-blush hover:border-primary/40 transition-colors"
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">Next · Module {next.module}</div>
        <p className="text-foreground truncate">{next.title}</p>
      </div>
      <span className="shrink-0 text-sm text-primary">Read →</span>
    </Link>
  );
}

// Anonymous visitor: reading needs a free account.
function SignupGate({ lesson }: { lesson: LessonMeta }) {
  return (
    <>
      <LessonHeading lesson={lesson} />
      <div className="rounded-2xl border border-border bg-blush p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
          <UserPlus className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Create a free account to read this</h2>
        <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
          A free account opens the starter lesson in each series — just an email and a password, no payment details.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/signup" className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
            Create free account
          </Link>
          <Link to="/login" className="text-sm text-warm-muted hover:text-foreground transition">
            Already have one? Sign in
          </Link>
        </div>
      </div>
    </>
  );
}

// Signed in but unpaid, on a premium lesson.
function Paywall({ lesson }: { lesson: LessonMeta }) {
  return (
    <>
      <LessonHeading lesson={lesson} />
      <div className="rounded-2xl border border-border bg-blush p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
          <Lock className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Unlock the full curriculum</h2>
        <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
          One payment opens every lesson across every series — yours to keep, no subscription.
        </p>
        <Link
          to="/checkout"
          className="inline-flex items-center px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          Get full access — {PRICE_LABEL}
        </Link>
      </div>
    </>
  );
}

// The title/summary shown above a gate, so a visitor knows what's behind it.
function LessonHeading({ lesson }: { lesson: LessonMeta }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">
        {lesson.seriesTitle} · Module {lesson.module}
      </div>
      <h1 className="font-serif text-3xl text-foreground mb-2 leading-tight">{lesson.title}</h1>
      {lesson.summary && <p className="text-sm text-warm-muted mb-8 leading-relaxed">{lesson.summary}</p>}
    </>
  );
}
