import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, Loader2, Smartphone, CreditCard, ArrowRight, Copy } from 'lucide-react';
import { signup, getMe, initiatePayment, getPaymentStatus, verifyCardPayment, ApiError } from '@/lib/api';
import { saveSession, getStoredUser, getToken, dispatchSessionChange } from '@/lib/session';
import { TESTING_PHASE } from '@/lib/testingPhase';

// Identity is verified by creating a real password account up front, not by
// a one-time code. This sidesteps email deliverability entirely (no code to
// fail to deliver) and means the account is fully created and ready before
// any payment is collected — a customer never pays without already having a
// working way back into their account.
type Step = 'identity' | 'payment' | 'processing' | 'done';
type Method = 'mpesa' | 'card';

const PRICE = 'KES 1,500';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('identity');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<Method>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [txRef, setTxRef] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle the browser returning from IntaSend's hosted checkout page.
  // The component remounts fresh here — `identifier` (component state) is
  // gone, so recover it from the session saved during signup, which
  // happened before the redirect and survives in localStorage.
  useEffect(() => {
    const cardStep = searchParams.get('step');
    const txRefParam = searchParams.get('tx_ref');

    if (cardStep === 'card-return' && txRefParam) {
      const stored = getStoredUser();
      if (stored) setIdentifier(stored.identifier);
      setTxRef(txRefParam);
      const invoiceId = searchParams.get('invoice_id') || searchParams.get('checkout_id') || undefined;
      setStep('processing');
      verifyCardPayment(txRefParam, invoiceId)
        .then(() => finishUpAfterPayment())
        .catch(e => { setError(e.message); setStep('payment'); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Payment succeeded — fetch the freshly-generated license key and finish.
  async function finishUpAfterPayment() {
    try {
      const me = await getMe();
      setLicenseKey(me.licenseKey || '');
    } catch { /* license key will still show on /account */ }
    setStep('done');
  }

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const val = identifier.trim();
    if (!val) return setError('Enter your email address.');
    if (!val.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      const { token, user } = await signup(val, password);
      saveSession(token, user);
      dispatchSessionChange();

      if (user.paid) {
        // Already bought previously — nothing to charge, send them to their account.
        navigate('/account');
        return;
      }

      if (TESTING_PHASE) {
        // Free testing window — skip straight to granting access, no charge.
        const result = await initiatePayment(val, 'free');
        setTxRef(result.txRef);
        await finishUpAfterPayment();
        return;
      }

      setStep('payment');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not create account. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const phone = method === 'mpesa' ? (mpesaPhone || identifier) : undefined;
      const result = await initiatePayment(identifier, method, phone);

      if (method === 'card' && result.paymentLink) {
        window.location.href = result.paymentLink;
        return;
      }

      // M-Pesa: poll for completion
      setTxRef(result.txRef);
      setStep('processing');
      pollRef.current = setInterval(async () => {
        try {
          const { status } = await getPaymentStatus(result.txRef);
          if (status === 'completed') {
            clearInterval(pollRef.current!);
            await finishUpAfterPayment();
          } else if (status === 'failed') {
            clearInterval(pollRef.current!);
            setError('Payment was declined or timed out. Try again.');
            setStep('payment');
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        navigate('/login?reason=already_paid');
      } else {
        setError(err instanceof Error ? err.message : 'Payment failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function copyLicenseKey() {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        {step !== 'done' && (
          <div className="flex gap-1.5 mb-8">
            {(['identity', 'payment', 'processing'] as Step[]).map((s, i) => {
              const steps: Step[] = ['identity', 'payment', 'processing'];
              const current = steps.indexOf(step);
              const isDone = i < current;
              const isActive = i === current;
              return (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${isActive ? 'bg-primary' : isDone ? 'bg-primary/40' : 'bg-border'}`} />
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">

          {/* ── Step 1: Identity (create account) ─────────────── */}
          {step === 'identity' && (
            <form onSubmit={handleIdentitySubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Get Orchestra-Core</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">One payment. Lifetime access.</h1>
              <p className="text-sm text-warm-muted mb-8">{PRICE} — create your account to continue.</p>

              <input
                type="email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-3"
                autoFocus
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Choose a password (min. 8 characters)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-2"
              />
              <p className="text-xs text-faint mb-5">Your account is created now — nothing's charged until you choose how to pay.</p>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Creating account…' : 'Continue'}
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Already bought? <Link to="/login" className="text-primary hover:underline">Sign in instead</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Payment ──────────────────────────────── */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Payment</div>
              <h2 className="font-serif text-3xl text-foreground mb-2">How would you like to pay?</h2>
              <p className="text-sm text-warm-muted mb-7">{PRICE} · one payment · no renewal</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {([
                  { id: 'mpesa', icon: Smartphone, label: 'M-Pesa', sub: 'Lipa na M-Pesa' },
                  { id: 'card', icon: CreditCard, label: 'Other', sub: 'Card · GPay · Apple Pay · more' },
                ] as const).map(opt => (
                  <button key={opt.id} type="button" onClick={() => setMethod(opt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${method === opt.id ? 'border-primary bg-blush' : 'border-border hover:border-primary/30'}`}>
                    <opt.icon className={`w-6 h-6 ${method === opt.id ? 'text-primary' : 'text-warm-muted'}`} />
                    <span className={`text-sm font-medium ${method === opt.id ? 'text-foreground' : 'text-warm-muted'}`}>{opt.label}</span>
                    <span className="text-xs text-faint text-center">{opt.sub}</span>
                  </button>
                ))}
              </div>

              {method === 'mpesa' && (
                <div className="mb-5">
                  <label className="block text-sm text-foreground mb-1.5">M-Pesa number</label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition"
                  />
                  <p className="text-xs text-faint mt-1.5">You'll get a prompt on your phone to confirm {PRICE}.</p>
                </div>
              )}

              {method === 'card' && (
                <div className="mb-5 p-4 rounded-xl bg-blush border border-border text-sm text-warm-muted">
                  You'll be taken to a secure IntaSend checkout page — pay {PRICE} by card, Google Pay, Apple Pay, Pesalink, bank transfer, Cash App, or PYUSD, whichever you prefer.
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Starting payment…' : `Pay ${PRICE}`}
              </button>
            </form>
          )}

          {/* ── Step 3: Processing ───────────────────────────── */}
          {step === 'processing' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Waiting for payment…</h2>
              {method === 'mpesa' ? (
                <p className="text-sm text-warm-muted">Check your phone for the M-Pesa prompt. Accept it to complete your purchase.</p>
              ) : (
                <p className="text-sm text-warm-muted">Verifying your payment. This takes just a moment.</p>
              )}
              {error && (
                <div className="mt-6">
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <button onClick={() => { setError(''); setStep('payment'); }}
                    className="text-sm text-primary hover:underline">Try again</button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-serif text-3xl text-foreground mb-2">You're in.</h2>
              <p className="text-sm text-warm-muted mb-8">Welcome to Orchestra-Core. Save your license key — you'll need it if you ever reinstall.</p>

              {licenseKey && (
                <div className="bg-blush border border-border rounded-xl p-5 mb-8 text-left">
                  <p className="text-xs uppercase tracking-[0.12em] text-faint mb-2">License key</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono text-foreground break-all">{licenseKey}</code>
                    <button onClick={copyLicenseKey} className="shrink-0 text-primary hover:opacity-70 transition">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Link to="/download"
                className="block w-full py-3 rounded-full bg-primary text-primary-foreground text-center hover:opacity-90 transition mb-3">
                Download Orchestra-Core
              </Link>
              {getToken() && (
                <a
                  href={`orchestracore://auth?token=${encodeURIComponent(getToken() || '')}`}
                  className="block w-full py-3 rounded-full border border-primary text-primary text-center hover:bg-blush transition mb-3 text-sm"
                >
                  Open in Orchestra-Core app (if installed)
                </a>
              )}
              <Link to="/account" className="block text-sm text-primary hover:underline">
                View your account
              </Link>
            </div>
          )}
        </div>

        {step === 'identity' && (
          <p className="text-xs text-faint text-center mt-6 max-w-xs mx-auto">
            We only store your email or phone to link your payment. Your learning data never leaves your device.
          </p>
        )}
      </div>
    </div>
  );
}
