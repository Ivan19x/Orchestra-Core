import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Check, Download, LogOut } from 'lucide-react';
import { useSession, clearSession, dispatchSessionChange, getToken } from '@/lib/session';
import { getMe } from '@/lib/api';

export default function Account() {
  const navigate = useNavigate();
  const session = useSession();
  const [licenseKey, setLicenseKey] = useState(session?.licenseKey ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    getMe()
      .then(user => {
        if (user.licenseKey) setLicenseKey(user.licenseKey);
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
            {session.identifier.includes('@') ? session.identifier.split('@')[0] : session.identifier}
          </h1>
          <p className="text-warm-muted mt-2">{session.identifier}</p>
        </div>
      </section>

      <section className="container-narrow py-16 space-y-6">
        {/* Licence */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          <h2 className="font-serif text-xl text-foreground mb-1">License</h2>
          <p className="text-sm text-warm-muted mb-5">
            {session.paid ? 'Lifetime access · one-time payment' : 'No active licence found.'}
          </p>

          {session.paid && licenseKey ? (
            <div className="bg-blush rounded-xl border border-border p-4 flex items-center justify-between gap-4">
              <code className="text-sm font-mono text-foreground break-all">{licenseKey}</code>
              <button onClick={copy} className="shrink-0 text-primary hover:opacity-70 transition" aria-label="Copy">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ) : !session.paid ? (
            <Link to="/checkout"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Buy Orchestra-Core — KES 1,500
            </Link>
          ) : null}
        </div>

        {/* Download */}
        {session.paid && (
          <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
            <h2 className="font-serif text-xl text-foreground mb-1">Download</h2>
            <p className="text-sm text-warm-muted mb-5">Get the latest version of Orchestra-Core for your device.</p>
            <Link to="/download"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              <Download className="w-4 h-4" /> Go to Download page
            </Link>
          </div>
        )}

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
