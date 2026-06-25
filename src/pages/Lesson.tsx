import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Lock, Brain, UserPlus } from 'lucide-react';
import { getLessonByUrlSlug, type FlatLesson } from '@/lib/lessons';
import { getLessonContent } from '@/lib/lessonContent';
import { LessonArticle } from '@/components/orchestra-core/LessonArticle';
import { useSession } from '@/lib/session';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Lesson() {
  const { slug = '' } = useParams();
  const session = useSession();
  const lesson = getLessonByUrlSlug(slug);

  if (!lesson) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-3">Lesson not found</h1>
        <p className="text-sm text-warm-muted mb-8">We couldn't find that lesson — it may have moved.</p>
        <Link to="/lessons" className="text-sm text-primary hover:underline">Back to all lessons</Link>
      </section>
    );
  }

  // Reading any lesson needs a (free) account; premium lessons additionally
  // need a paid account. Anonymous → create-account gate; signed-in but unpaid
  // on a premium lesson → upgrade gate; otherwise read.
  const gate: 'signup' | 'pay' | null = !session
    ? 'signup'
    : (lesson.premium && !session.paid ? 'pay' : null);
  const content = lesson.slug ? getLessonContent(lesson.slug) : undefined;

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
          <LockedLesson lesson={lesson} />
        ) : (
          <>
            <LessonArticle
              seriesName={lesson.seriesName}
              module={lesson.module}
              title={lesson.title}
              readTime={lesson.readTime}
              body={content?.body}
            />
            {session?.paid && (
              <div className="mt-10 pt-6 border-t border-border">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
                >
                  <Brain className="w-4 h-4" /> Discuss this with your AI coach
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// Anonymous visitor: reading needs a free account.
function SignupGate({ lesson }: { lesson: FlatLesson }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">{lesson.seriesName} · {lesson.module}</div>
      <h1 className="font-serif text-3xl text-foreground mb-2 leading-tight">{lesson.title}</h1>
      {lesson.summary && <p className="text-sm text-warm-muted mb-8 leading-relaxed">{lesson.summary}</p>}

      <div className="rounded-2xl border border-border bg-blush p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
          <UserPlus className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Create a free account to read this</h2>
        <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
          A free account opens the starter lesson in each series — just an email and a password. Unlock every lesson and the AI coach anytime.
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

// Signed-in but unpaid, on a premium lesson: prompt to upgrade.
function LockedLesson({ lesson }: { lesson: FlatLesson }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-1">{lesson.seriesName} · {lesson.module}</div>
      <h1 className="font-serif text-3xl text-foreground mb-2 leading-tight">{lesson.title}</h1>
      {lesson.summary && <p className="text-sm text-warm-muted mb-8 leading-relaxed">{lesson.summary}</p>}

      <div className="rounded-2xl border border-border bg-blush p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary mx-auto mb-5">
          <Lock className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Unlock with full access</h2>
        <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto leading-relaxed">
          One-time purchase opens every premium lesson plus your AI coach. No subscription.
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
