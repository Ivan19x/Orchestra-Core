import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Loader2, Smartphone, Copy } from 'lucide-react';
import { getMe, initiatePayment, getPaymentStatus, ApiError } from '@/lib/api';
import { getStoredUser, saveSession, dispatchSessionChange, type SessionUser } from '@/lib/session';
import { SignupForm } from '@/components/orchestra-core/SignupForm';
import { PRICE_LABEL } from '@/lib/pricing';

// Two steps: create the account, then pay for it with M-Pesa.
//
// The account is created BEFORE any money moves, which means a customer can
// never end up having paid with no way back into their account — and it also
// means we never have to hold payment state in a URL across a redirect, the way
// a hosted-checkout page would.
type Step = 'identity' | 'payment' | 'processing' | 'done';

// How long to keep polling before telling the customer to check their phone.
// A real STK prompt times out at Safaricom's end after about 60 seconds.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export default function Checkout() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('identity');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Already signed in → skip straight to payment (or to the account page if
  // they've already bought). No re-entering an email and password.
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      if (stored.paid) { navigate('/account', { replace: true }); return; }
      setIdentifier(stored.identifier);
      setStep('payment');
    }
  }, [navigate]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };
  useEffect(() => stopPolling, []);

  // Payment confirmed — refresh the session so `paid` is true everywhere
  // (Nav, lesson gates, dashboard) without needing a reload, and show the key.
  async function finishUpAfterPayment() {
    try {
      const me = await getMe();
      setLicenseKey(me.licenseKey || '');
      const token = localStorage.getItem('oc_token');
      if (token) {
        saveSession(token, me as SessionUser);
        dispatchSessionChange();
      }
    } catch {
      /* the access key still shows on /account */
    }
    setStep('done');
  }

  // SignupForm already created the account and saved the session — we just
  // decide where to go next.
  function handleSignupSuccess(user: SessionUser) {
    setIdentifier(user.identifier);
    if (user.paid) { navigate('/account'); return; }
    setStep('payment');
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { txRef } = await initiatePayment(identifier, phone);
      setStep('processing');

      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling();
          setError("We didn't get a confirmation. If you completed the payment, sign in again in a minute — access unlocks automatically.");
          setStep('payment');
          return;
        }
        try {
          const { status, message } = await getPaymentStatus(txRef);
          if (status === 'completed') {
            stopPolling();
            await finishUpAfterPayment();
          } else if (status === 'failed') {
            stopPolling();
            setError(message || 'The payment was cancelled or timed out. You can try again.');
            setStep('payment');
          }
        } catch {
          /* transient network blip — keep polling */
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        navigate('/login?reason=already_paid');
      } else {
        setError(err instanceof Error ? err.message : 'Could not start the payment. Try again.');
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
              return (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i === current ? 'bg-primary' : i < current ? 'bg-primary/40' : 'bg-border'}`} />
              );
            })}
          </div>
        )}

        <div className="bg-background rounded-2xl border border-border shadow-sm p-8">

          {/* ── Step 1: Create the account ─────────────────────── */}
          {step === 'identity' && (
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Get Orchestra-Core</div>
              <h1 className="font-serif text-3xl text-foreground mb-2">One payment. Lifetime access.</h1>
              <p className="text-sm text-warm-muted mb-8">
                {PRICE_LABEL} — create your account to continue. Nothing is charged until the next step.
              </p>

              <SignupForm onSuccess={handleSignupSuccess} submitLabel="Continue" />

              <p className="text-xs text-faint text-center mt-4">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Pay with M-Pesa ────────────────────────── */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit}>
              <div className="text-xs uppercase tracking-[0.15em] text-primary mb-1">Payment</div>
              <h2 className="font-serif text-3xl text-foreground mb-2">Pay with M-Pesa</h2>
              <p className="text-sm text-warm-muted mb-7">{PRICE_LABEL} · one payment · no renewal</p>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-blush border border-border mb-6">
                <Smartphone className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-warm-muted">
                  Enter your Safaricom number. You'll get a prompt on your phone — enter your M-Pesa PIN to confirm.
                </p>
              </div>

              <label htmlFor="mpesa-phone" className="block text-sm text-foreground mb-1.5">M-Pesa number</label>
              <input
                id="mpesa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
              <p className="text-xs text-faint mt-1.5 mb-5">
                Safaricom numbers only. Works as 0712…, 254712…, or +254 712….
              </p>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Sending prompt…' : `Pay ${PRICE_LABEL}`}
              </button>
            </form>
          )}

          {/* ── Step 3: Waiting on the customer's PIN ──────────── */}
          {step === 'processing' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Check your phone</h2>
              <p className="text-sm text-warm-muted">
                An M-Pesa prompt has been sent to <span className="text-foreground">{phone}</span>. Enter your PIN to
                complete the payment — this page unlocks by itself the moment it goes through.
              </p>
              <p className="text-xs text-faint mt-4">Don't close this page.</p>
            </div>
          )}

          {/* ── Step 4: Done ───────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-5">
                <Check className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="font-serif text-3xl text-foreground mb-2">You're in.</h2>
              <p className="text-sm text-warm-muted mb-8">
                Every lesson is unlocked on your account. Sign in with your email and password from any device.
              </p>

              {licenseKey && (
                <div className="bg-blush border border-border rounded-xl p-5 mb-8 text-left">
                  <p className="text-xs uppercase tracking-[0.12em] text-faint mb-2">Your access key</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono text-foreground break-all">{licenseKey}</code>
                    <button onClick={copyLicenseKey} aria-label="Copy access key" className="shrink-0 text-primary hover:opacity-70 transition">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-faint mt-2">Proof of purchase. You don't need it to sign in.</p>
                </div>
              )}

              <Link to="/dashboard"
                className="block w-full py-3 rounded-full bg-primary text-primary-foreground text-center hover:opacity-90 transition mb-3">
                Start reading
              </Link>
              <Link to="/account" className="block text-sm text-primary hover:underline">
                View your account
              </Link>
            </div>
          )}
        </div>

        {step === 'identity' && (
          <p className="text-xs text-faint text-center mt-6 max-w-xs mx-auto">
            We store your email to link your purchase — nothing else. We never see your M-Pesa PIN.
          </p>
        )}
      </div>
    </div>
  );
}
