import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, Loader2, Smartphone, CreditCard, ArrowRight, ChevronLeft, Copy } from 'lucide-react';
import { OTPInput } from '@/components/orchestra-core/OTPInput';
import { sendOtp, verifyOtp, initiatePayment, getPaymentStatus, verifyCardPayment, ApiError } from '@/lib/api';
import { saveSession, dispatchSessionChange } from '@/lib/session';

type Step = 'identity' | 'payment' | 'processing' | 'otp' | 'done';
type Method = 'mpesa' | 'card';

const PRICE = 'KES 1,500';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('identity');
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('phone');
  const [method, setMethod] = useState<Method>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [txRef, setTxRef] = useState('');
  const [otp, setOtp] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle card payment return from IntaSend
  useEffect(() => {
    const cardStep = searchParams.get('step');
    const txRefParam = searchParams.get('tx_ref');

    if (cardStep === 'card-return' && txRefParam) {
      setTxRef(txRefParam);
      const invoiceId = searchParams.get('invoice_id') || searchParams.get('checkout_id') || undefined;
      setStep('processing');
      verifyCardPayment(txRefParam, invoiceId)
        .then(() => { setStep('otp'); sendOtpToUser(); })
        .catch(e => { setError(e.message); setStep('payment'); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function sendOtpToUser() {
    try {
      await sendOtp(identifier);
    } catch {
      // non-fatal — user can request resend
    }
  }

  async function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const val = identifier.trim();
    if (!val) return setError('Enter your email or phone number.');
    if (identifierType === 'email' && !val.includes('@')) return setError('Enter a valid email address.');
    if (identifierType === 'phone') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 9) return setError('Enter a valid phone number.');
      setMpesaPhone(val); // pre-fill M-Pesa field
    }
    setStep('payment');
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
            setStep('otp');
            await sendOtpToUser();
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

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter the full 6-digit code.');
    setError('');
    setLoading(true);
    try {
      const { token, user } = await verifyOtp(identifier, otp);
      saveSession(token, user);
      dispatchSessionChange();
      setLicenseKey(user.licenseKey || '');
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    try {
      await sendOtp(identifier);
      setError(''); // clear any prior error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code.');
    }
  }

  function copyLicenseKey() {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPhone = identifierType === 'phone';

  return (
    <div className="min-h-screen bg-blush flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        {step !== 'done' && (
          <div className="flex gap-1.5 mb-8">
            {(['identity', 'payment', 'processing', 'otp'] as Step[]).map((s, i) => {
              const steps: Step[] = ['identity', 'payment', 'processing', 'otp'];
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

          {/* ── Step 1: Identity ─────────────────────────────── */}
          {step === 'identity' && (
            <form onSubmit={handleIdentitySubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Get Orchestra-Core</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">One payment. Lifetime access.</h1>
              <p className="text-sm text-warm-muted mb-8">{PRICE} — enter your email or phone to continue.</p>

              <div className="flex rounded-full border border-border overflow-hidden mb-5 text-sm">
                {(['phone', 'email'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setIdentifierType(t)}
                    className={`flex-1 py-2 transition capitalize ${identifierType === t ? 'bg-primary text-primary-foreground' : 'text-warm-muted hover:text-foreground'}`}>
                    {t === 'phone' ? 'Phone number' : 'Email address'}
                  </button>
                ))}
              </div>

              <input
                type={isPhone ? 'tel' : 'email'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={isPhone ? '+254 7XX XXX XXX' : 'you@example.com'}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition mb-2"
                autoFocus
              />
              {isPhone && <p className="text-xs text-faint mb-5">We'll send your code via SMS. Standard rates may apply.</p>}
              {!isPhone && <p className="text-xs text-faint mb-5">We'll send your code via email. No marketing, ever.</p>}

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit"
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition">
                Continue <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Already bought? <Link to="/login" className="text-primary hover:underline">Sign in instead</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Payment ──────────────────────────────── */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit}>
              <button type="button" onClick={() => setStep('identity')}
                className="flex items-center gap-1 text-sm text-warm-muted hover:text-foreground mb-6 -ml-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Payment</div>
              <h2 className="font-serif text-3xl text-foreground mb-2">How would you like to pay?</h2>
              <p className="text-sm text-warm-muted mb-7">{PRICE} · one payment · no renewal</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {([
                  { id: 'mpesa', icon: Smartphone, label: 'M-Pesa', sub: 'Lipa na M-Pesa' },
                  { id: 'card', icon: CreditCard, label: 'Card', sub: 'Visa · Mastercard' },
                ] as const).map(opt => (
                  <button key={opt.id} type="button" onClick={() => setMethod(opt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${method === opt.id ? 'border-primary bg-blush' : 'border-border hover:border-primary/30'}`}>
                    <opt.icon className={`w-6 h-6 ${method === opt.id ? 'text-primary' : 'text-warm-muted'}`} />
                    <span className={`text-sm font-medium ${method === opt.id ? 'text-foreground' : 'text-warm-muted'}`}>{opt.label}</span>
                    <span className="text-xs text-faint">{opt.sub}</span>
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
                  You'll be taken to a secure IntaSend checkout page to pay {PRICE} by card.
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

          {/* ── Step 4: OTP ──────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-1">Payment confirmed!</h2>
                <p className="text-sm text-warm-muted">
                  We've sent a verification code to <span className="text-foreground">{identifier}</span>
                </p>
              </div>

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full mt-6 py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Verify'}
              </button>

              <p className="text-xs text-faint text-center mt-4">
                Didn't get it?{' '}
                <button type="button" onClick={handleResendOtp} className="text-primary hover:underline">Resend code</button>
              </p>
            </form>
          )}

          {/* ── Step 5: Done ─────────────────────────────────── */}
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
