import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { resetPassword } from '@/lib/api';
import { saveSession, dispatchSessionChange } from '@/lib/session';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    try {
      const { token: jwt, user } = await resetPassword(token, password);
      saveSession(jwt, user);
      dispatchSessionChange();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password. Request a new link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">
          {!token ? (
            <div className="text-center">
              <h1 className="font-serif text-2xl text-foreground mb-2">Invalid reset link</h1>
              <p className="text-sm text-warm-muted mb-6">This link is missing its token. Request a fresh one.</p>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Request a new link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Reset password</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">Set a new password.</h1>
              <p className="text-sm text-warm-muted mb-8">Choose a new password — you'll be signed in right after.</p>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-3"
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-5"
              />

              {error && (
                <p className="text-sm text-red-600 mb-4">
                  {error} <Link to="/forgot-password" className="underline">Request a new link</Link>
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
