import { Link } from 'react-router-dom';
import { Brain, Clock } from 'lucide-react';
import { useSession } from '@/lib/session';

export default function Download() {
  const session = useSession();

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Download</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">The desktop app is paused for now.</h1>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-background p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center text-primary mx-auto mb-5">
            <Clock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <p className="text-warm-muted mb-6 leading-relaxed">
            We've paused desktop downloads while we focus on the website experience.
            Everything you bought — every lesson and your AI coach — is available right now in your dashboard, no install needed.
            The downloadable app will return later at no extra cost to anyone who's already purchased.
          </p>
          <Link to={session?.paid ? '/dashboard' : '/checkout'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
            <Brain className="w-4 h-4" />
            {session?.paid ? 'Go to your dashboard' : 'Get Orchestra-Core'}
          </Link>
        </div>
      </section>
    </>
  );
}
