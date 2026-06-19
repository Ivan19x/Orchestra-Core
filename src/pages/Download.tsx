import { Link } from 'react-router-dom';
import { LogIn, ShoppingBag } from 'lucide-react';
import { DownloadPanel } from '@/components/orchestra-core/DownloadPanel';
import { useSession } from '@/lib/session';

const setupSteps = [
  'Download the file above and open it on your device.',
  'Follow the on-screen install prompts (under one minute).',
  'Open Orchestra-Core and sign in with the email or phone you used to purchase.',
];

export default function Download() {
  const session = useSession();

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Download</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Get Orchestra-Core on your device.</h1>
        </div>
      </section>

      <section className="container-narrow py-16">
        {session?.paid ? (
          <DownloadPanel />
        ) : (
          <div className="max-w-md mx-auto rounded-2xl border border-border bg-background p-8 text-center">
            <p className="text-warm-muted mb-6">
              {session
                ? 'Your account doesn\'t have an active licence yet.'
                : 'Sign in to access your download, or buy Orchestra-Core to get started.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!session && (
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border text-foreground text-sm hover:border-primary hover:text-primary transition">
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
              )}
              <Link to="/checkout"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
                <ShoppingBag className="w-4 h-4" />
                {session ? 'Buy Orchestra-Core — KES 1,500' : 'Buy Orchestra-Core'}
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-serif text-2xl text-foreground mb-6">Setup, in three steps</h2>
          <ol className="space-y-4">
            {setupSteps.map((step, i) => (
              <li key={i} className="flex gap-4 p-4 rounded-lg border border-border bg-background">
                <span className="w-8 h-8 rounded-full bg-blush text-primary flex items-center justify-center text-sm shrink-0">{i + 1}</span>
                <span className="text-foreground pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
