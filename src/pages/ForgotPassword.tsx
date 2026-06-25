import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { requestReset } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = email.trim();
    if (!val.includes('@')) return setError('Enter a valid email address.');
    setError('');
    setLoading(true);
    try {
      await requestReset(val);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center text-primary mx-auto mb-5">
                <MailCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h1 className="font-serif text-2xl text-foreground mb-2">Check your email</h1>
              <p className="text-sm text-warm-muted mb-6">
                If an account exists for <span className="text-foreground">{email.trim()}</span>, we've sent a link to
                reset your password. It expires in 10 minutes.
              </p>
              <Link to="/login" className="text-sm text-primary hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Reset password</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">Forgot your password?</h1>
              <p className="text-sm text-warm-muted mb-8">Enter your email and we'll send you a link to set a new one.</p>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-5"
              />

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Remembered it? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
