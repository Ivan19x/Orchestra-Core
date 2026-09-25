import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Check, LogOut, BookOpen, CalendarDays, GraduationCap } from 'lucide-react';
import { useSession, clearSession, dispatchSessionChange, getToken, saveSession } from '@/lib/session';
import { getMe } from '@/lib/api';
import { PRICE_LABEL } from '@/lib/pricing';

export default function Account() {
  const navigate = useNavigate();
  const session = useSession();
  const [licenseKey, setLicenseKey] = useState(session?.licenseKey ?? '');
  const [copied, setCopied] = useState(false);

  // Re-sync from the server on every visit: a payment confirmed on another
  // device (or by Safaricom's callback after this browser stopped polling)
  // needs to show up here without the user having to sign out and back in.
  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    getMe()
      .then(user => {
        if (user.licenseKey) setLicenseKey(user.licenseKey);
        saveSession(token, user);
        dispatchSessionChange();
      })
      .catch(() => {
        clearSession();
        dispatchSessionChange();
        navigate('/login');
      });
  }, [navigate]);

  function signOut() {
    clearSession();
    dispatchSessionChange();
    navigate('/');
  }

  function copy() {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!session) return null;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">My account</div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            {session.identifier.split('@')[0]}
          </h1>
          <p className="text-warm-muted mt-2">{session.identifier}</p>
        </div>
      </section>

      <section className="container-narrow py-16 space-y-6">
        {/* Access */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground mb-1">Access</h2>
          <p className="text-sm text-warm-muted mb-5">
            {session.paid
              ? 'Full access · every lesson unlocked · one-time payment'
              : 'Free account — the starter lesson in each series is open to you.'}
          </p>

          {session.paid ? (
            licenseKey && (
              <>
                <div className="bg-blush rounded-xl border border-border p-4 flex items-center justify-between gap-4">
                  <code className="text-sm font-mono text-foreground break-all">{licenseKey}</code>
                  <button onClick={copy} className="shrink-0 text-primary hover:opacity-70 transition" aria-label="Copy access key">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-faint mt-2">
                  Your access key — proof of purchase. You don't need it to sign in.
                </p>
              </>
            )
          ) : (
            <Link to="/checkout"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Unlock everything — {PRICE_LABEL}
            </Link>
          )}
        </div>

        {/* Dashboard */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground mb-1">Your dashboard</h2>
          <p className="text-sm text-warm-muted mb-5">
            {session.paid
              ? 'Every lesson across every series, plus your budgeting tools.'
              : 'Pick up where you left off, and read the free starter lessons.'}
          </p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
            <BookOpen className="w-4 h-4" /> Open dashboard
          </Link>
        </div>

        {/* Sessions */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground mb-1">One-to-one sessions</h2>
          <p className="text-sm text-warm-muted mb-5">
            Sessions you've booked with a consultant, and where to cancel or report a problem.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/sessions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              <CalendarDays className="w-4 h-4" /> Your sessions
            </Link>
            <Link to="/consultants"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-primary text-primary text-sm hover:bg-blush transition">
              Book a consultant
            </Link>
          </div>
        </div>

        {/* Teaching — only relevant to people who applied, so it links rather
            than assuming; /teach shows their actual status. */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground mb-1">Teaching with Orchestra-Core</h2>
          <p className="text-sm text-warm-muted mb-5">
            If you teach with us, manage your availability and sessions here. If you don't yet, you can
            apply — it's paid work on your own schedule.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/teach/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary text-primary text-sm hover:bg-blush transition">
              <GraduationCap className="w-4 h-4" /> Consultant dashboard
            </Link>
            <Link to="/teach" className="inline-flex items-center px-5 py-2.5 text-sm text-warm-muted hover:text-foreground transition">
              Apply to teach
            </Link>
          </div>
        </div>

        {/* Sign out */}
        <div className="pt-2">
          <button onClick={signOut}
            className="flex items-center gap-2 text-sm text-warm-muted hover:text-foreground transition">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </section>
    </>
  );
}
