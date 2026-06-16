import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { OTPInput } from '@/components/orchestra-core/OTPInput';
import { sendOtp, verifyOtp, ApiError } from '@/lib/api';
import { saveSession, dispatchSessionChange } from '@/lib/session';

type Step = 'identity' | 'otp';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const [step, setStep] = useState<Step>('identity');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const val = identifier.trim();
    if (!val || !val.includes('@')) return setError('Enter a valid email address.');
    setError('');
    setLoading(true);
    try {
      await sendOtp(val);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter the full 6-digit code.');
    setError('');
    setLoading(true);
    try {
      const { token, user } = await verifyOtp(identifier, otp);
      saveSession(token, user);
      dispatchSessionChange();
      navigate('/account');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid or expired code. Try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">

          {step === 'identity' && (
            <form onSubmit={handleSend}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Sign in</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">Welcome back.</h1>
              <p className="text-sm text-warm-muted mb-8">
                {reason === 'already_paid'
                  ? 'This account already has a licence. Sign in to access your download.'
                  : 'Enter the email address you used when you bought Orchestra-Core.'}
              </p>

              <input
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-5"
                autoFocus
              />

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Sending…' : 'Send code'}
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Don't have an account?{' '}
                <Link to="/checkout" className="text-primary hover:underline">Buy Orchestra-Core</Link>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify}>
              <h1 className="font-serif text-3xl text-foreground mb-2">Check your inbox.</h1>
              <p className="text-sm text-warm-muted mb-8">
                We sent a code to <span className="text-foreground">{identifier}</span>
              </p>

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full mt-6 py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Sign in'}
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Wrong address?{' '}
                <button type="button" onClick={() => { setStep('identity'); setOtp(''); setError(''); }}
                  className="text-primary hover:underline">Go back</button>
                {' · '}
                <button type="button" onClick={() => sendOtp(identifier).catch(() => {})}
                  className="text-primary hover:underline">Resend</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
