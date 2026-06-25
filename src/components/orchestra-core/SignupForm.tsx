import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { signup, ApiError } from '@/lib/api';
import { saveSession, dispatchSessionChange, type SessionUser } from '@/lib/session';

// Email + password + confirm + terms, shared by the /signup page and the
// checkout identity step. Creates the account, saves the session, then hands
// the new user to `onSuccess` (which decides where to go next).
export function SignupForm({
  onSuccess,
  submitLabel = 'Create account',
  note,
}: {
  onSuccess: (user: SessionUser) => void;
  submitLabel?: string;
  note?: React.ReactNode;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const val = email.trim();
    if (!val.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError("Passwords don't match.");
    if (!agreed) return setError('Please agree to the Terms and Privacy Policy to continue.');

    setLoading(true);
    try {
      const { token, user } = await signup(val, password);
      saveSession(token, user);
      dispatchSessionChange();
      onSuccess(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('An account with this email already exists. Sign in instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not create account. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoFocus
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-3"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Choose a password (min. 8 characters)"
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-3"
      />
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Confirm password"
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-4"
      />

      <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[hsl(var(--primary))] shrink-0"
        />
        <span className="text-xs text-warm-muted leading-relaxed">
          I agree to the{' '}
          <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
        </span>
      </label>

      {note}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {loading ? 'Creating account…' : submitLabel}
      </button>
    </form>
  );
}
