import { useState, useCallback, useEffect } from 'react';
import {
  Brain, BookOpen, Heart, User, LogOut, Orbit,
  Clock, ChevronRight, Download,
} from 'lucide-react';
import { AskPanel } from '@/components/orchestra-core/AskPanel';
import { SetupStatus } from '@/components/orchestra-core/SetupStatus';
import { OTPInput } from '@/components/orchestra-core/OTPInput';
import { useSession, saveSession, clearSession, dispatchSessionChange } from '@/lib/session';
import { isElectron } from '@/lib/platform';
import { sendOtp, verifyOtp } from '@/lib/api';
import { series } from '@/lib/lessons';

type Tab = 'ai' | 'lessons' | 'support' | 'account';

interface UpdateState {
  available: boolean;
  downloaded: boolean;
  version: string;
  percent: number | null;
}

export default function AppShell() {
  const user = useSession();
  const [tab, setTab] = useState<Tab>('ai');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiKey, setAiKey] = useState(0);
  const [update, setUpdate] = useState<UpdateState>({
    available: false, downloaded: false, version: '', percent: null,
  });

  // Auto-update listeners
  useEffect(() => {
    if (!window.electronSetup) return;
    window.electronSetup.onUpdateAvailable?.((data: { version: string }) => {
      setUpdate(prev => ({ ...prev, available: true, version: data.version }));
    });
    window.electronSetup.onUpdateProgress?.((data: { percent: number }) => {
      setUpdate(prev => ({ ...prev, percent: data.percent }));
    });
    window.electronSetup.onUpdateDownloaded?.((data: { version: string }) => {
      setUpdate(prev => ({ ...prev, downloaded: true, version: data.version, percent: null }));
    });
  }, []);

  const handleTokenReceived = useCallback((token: string) => {
    // Called when a JWT arrives via deep link (orchestracore://auth?token=...)
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      saveSession(token, {
        id: payload.sub,
        identifier: payload.identifier,
        paid: payload.paid,
        licenseKey: payload.licenseKey,
      });
      dispatchSessionChange();
    } catch {}
  }, []);

  function openAI(question?: string) {
    if (question) {
      setAiQuestion(question);
      setAiKey(k => k + 1); // re-mount AskPanel with fresh context for this lesson
    }
    setTab('ai');
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* ── Update banner ─────────────────────────────────────── */}
      {update.available && !update.downloaded && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Download className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              Update v{update.version} downloading…
              {update.percent !== null && ` ${update.percent}%`}
            </span>
          </div>
        </div>
      )}
      {update.downloaded && (
        <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Orchestra-Core v{update.version} is ready to install.</span>
          </div>
          <button
            onClick={() => window.electronSetup?.installUpdate?.()}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
          >
            Restart &amp; update
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* ── Left sidebar ─────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-border bg-blush flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-border">
          <span className="inline-flex items-center gap-2">
            <Orbit className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
            <span className="font-serif text-xl leading-none text-foreground">
              Orchestra<span className="text-primary">-Core</span>
            </span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <NavItem icon={Brain} label="AI Coach"  active={tab === 'ai'}      onClick={() => setTab('ai')} />
          <NavItem icon={BookOpen} label="Lessons" active={tab === 'lessons'} onClick={() => setTab('lessons')} />
          <NavItem icon={Heart} label="Support"   active={tab === 'support'} onClick={() => setTab('support')} />
          <NavItem icon={User} label="Account"    active={tab === 'account'} onClick={() => setTab('account')} />
        </nav>

        {/* Setup status */}
        <div className="px-4 py-4 border-t border-border">
          <SetupStatus onTokenReceived={handleTokenReceived} />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      {/* AI panel stays mounted across tab switches (hidden via CSS, not unmounted) so an
          in-flight Ollama response keeps streaming into the chat even while you're on another tab. */}
      <main className="flex-1 overflow-auto bg-background">
        <div className={tab === 'ai' ? 'contents' : 'hidden'}>
          <AppAI key={aiKey} initialQuestion={aiQuestion} />
        </div>
        {tab === 'lessons' && <AppLessons onAsk={openAI} />}
        {tab === 'support' && <AppSupport />}
        {tab === 'account' && <AppAccount user={user} />}
      </main>
      </div>
    </div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-warm-muted hover:bg-white/60 hover:text-foreground'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      {label}
    </button>
  );
}

// ── AI Coach tab ──────────────────────────────────────────────────────────────
function AppAI({ initialQuestion }: { initialQuestion: string }) {
  if (!isElectron) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <Orbit className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-2xl text-foreground mb-2">AI Coach runs on desktop</h2>
        <p className="text-sm text-warm-muted max-w-xs leading-relaxed mb-6">
          The AI coach runs privately on your computer — your questions never leave your device.
          Download the Orchestra-Core app for Windows or Mac to unlock it.
        </p>
        <a
          href="https://github.com/Ivan19x/Orchestra-Core/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          Download for desktop
        </a>
        <p className="text-xs text-faint mt-4">Full lesson library is available right here on mobile.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-8 pb-4 border-b border-border">
        <h1 className="font-serif text-2xl text-foreground">AI Coach</h1>
        <p className="text-sm text-warm-muted mt-1">Ask anything about money. Powered by a local AI — nothing leaves your device.</p>
      </div>
      <div className="flex-1 overflow-auto px-8 py-6">
        <AskPanel initialQuestion={initialQuestion} />
      </div>
    </div>
  );
}

// ── Lessons tab ───────────────────────────────────────────────────────────────
function AppLessons({ onAsk }: { onAsk: (q: string) => void }) {
  const active = series.filter(s => !s.comingSoon && s.lessons.length > 0);

  return (
    <div className="px-8 py-8">
      <h1 className="font-serif text-2xl text-foreground mb-1">Lessons</h1>
      <p className="text-sm text-warm-muted mb-8">Your full curriculum — tap "Ask about this" on any lesson to discuss it with your AI coach.</p>

      <div className="space-y-10">
        {active.map(s => (
          <div key={s.id}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}18`, color: s.color }}
              >
                <s.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">{s.name}</h2>
                <p className="text-xs text-warm-muted">{s.tagline}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {s.lessons.map((lesson, idx) => (
                <div
                  key={lesson.id ?? idx}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-blush transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${s.color}12`, color: s.color }}
                  >
                    <lesson.icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-faint mb-0.5">{lesson.module}</div>
                    <p className="text-sm font-medium text-foreground leading-snug">{lesson.title}</p>
                    {lesson.summary && (
                      <p className="text-xs text-warm-muted mt-1 leading-relaxed">{lesson.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-faint">
                        <Clock className="w-3 h-3" />
                        {lesson.readTime}
                      </span>
                      <button
                        onClick={() => onAsk(`Tell me about the lesson "${lesson.title}" — explain it in plain English with an example.`)}
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        Ask about this <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Coming soon */}
        <div>
          <h2 className="text-sm font-medium text-faint mb-3 uppercase tracking-[0.12em]">Coming soon</h2>
          <div className="grid grid-cols-2 gap-3">
            {series.filter(s => s.comingSoon).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background opacity-50">
                <s.icon className="w-4 h-4 text-faint shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="text-xs font-medium text-foreground">{s.name}</p>
                  <p className="text-[10px] text-faint">{s.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Support tab ───────────────────────────────────────────────────────────────
function AppSupport() {
  return (
    <div className="px-8 py-8 max-w-lg">
      <h1 className="font-serif text-2xl text-foreground mb-1">Support Orchestra-Core</h1>
      <p className="text-sm text-warm-muted mb-8">
        Orchestra-Core is an independent project. If it's helped you understand money better, you can support its development.
      </p>

      <div className="space-y-4">
        {/* M-Pesa */}
        <div className="p-5 rounded-2xl border border-border bg-blush">
          <div className="text-xs uppercase tracking-[0.15em] text-faint mb-3">M-Pesa · Send Money</div>
          <div className="text-3xl font-serif text-foreground mb-1">0790 694 452</div>
          <p className="text-xs text-warm-muted">M-Pesa → Send Money → enter 0790694452 → any amount</p>
        </div>

        {/* Buy Me a Coffee */}
        <div className="p-5 rounded-2xl border border-border bg-background">
          <div className="text-xs uppercase tracking-[0.15em] text-faint mb-3">International · Buy Me a Coffee</div>
          <p className="text-sm text-foreground mb-3">Support from anywhere in the world.</p>
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
          >
            Buy me a coffee
          </a>
        </div>
      </div>

      <p className="text-xs text-faint mt-8 italic">
        "Inter se pecuniarie adiuvantes" — helping one another financially.
      </p>
    </div>
  );
}

// ── Account tab ───────────────────────────────────────────────────────────────
function AppAccount({ user }: { user: ReturnType<typeof useSession> }) {
  const [signinStep, setSigninStep] = useState<'email' | 'otp' | 'loading'>('email');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = email.trim().toLowerCase();
    if (!val || !val.includes('@')) { setEmailError('Enter a valid email address.'); return; }
    setEmailError('');
    setSigninStep('loading');
    try {
      await sendOtp(val);
      setSigninStep('otp');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not send code. Try again.');
      setSigninStep('email');
    }
  }

  async function handleOtpChange(code: string) {
    setOtpValue(code);
    if (code.replace(/\D/g, '').length !== 6) return;
    setOtpError('');
    try {
      const result = await verifyOtp(email.trim().toLowerCase(), code);
      saveSession(result.token, result.user);
      dispatchSessionChange();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Incorrect code. Try again.');
      setOtpValue('');
    }
  }

  function handleSignOut() {
    clearSession();
    dispatchSessionChange();
  }

  // ── Signed in ──────────────────────────────────────────────
  if (user) {
    return (
      <div className="px-8 py-8 max-w-md">
        <h1 className="font-serif text-2xl text-foreground mb-6">Account</h1>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-border bg-blush">
            <div className="text-xs uppercase tracking-[0.15em] text-faint mb-1">Signed in as</div>
            <p className="text-sm text-foreground font-medium">{user.identifier}</p>
          </div>

          {user.licenseKey && (
            <div className="p-5 rounded-2xl border border-border bg-background">
              <div className="text-xs uppercase tracking-[0.15em] text-faint mb-1">License key</div>
              <p className="text-sm font-mono text-foreground break-all">{user.licenseKey}</p>
              <p className="text-xs text-warm-muted mt-2">Keep this safe — it proves your purchase.</p>
            </div>
          )}

          <div className="p-5 rounded-2xl border border-border bg-background">
            <div className="text-xs uppercase tracking-[0.15em] text-faint mb-2">Your plan</div>
            <p className="text-sm text-foreground">Orchestra-Core · Lifetime access</p>
            <p className="text-xs text-warm-muted mt-1">AI runs entirely on this device. No subscription required.</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-8 inline-flex items-center gap-2 text-sm text-warm-muted hover:text-foreground transition"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────
  return (
    <div className="px-8 py-8 max-w-sm">
      <h1 className="font-serif text-2xl text-foreground mb-2">Sign in</h1>
      <p className="text-sm text-warm-muted mb-6">
        Already purchased Orchestra-Core? Sign in with the email you used at checkout to access your account and license key.
      </p>

      {signinStep === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-border bg-blush text-sm focus:outline-none focus:border-primary"
          />
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
          >
            Send verification code
          </button>
        </form>
      )}

      {signinStep === 'loading' && (
        <p className="text-sm text-warm-muted">Sending code to {email}…</p>
      )}

      {signinStep === 'otp' && (
        <div className="space-y-4">
          <p className="text-sm text-warm-muted">Check your inbox at <strong className="text-foreground">{email}</strong>. Enter the 6-digit code below.</p>
          <OTPInput value={otpValue} onChange={handleOtpChange} />
          {otpError && <p className="text-xs text-red-600">{otpError}</p>}
          <button
            onClick={() => setSigninStep('email')}
            className="text-xs text-warm-muted hover:text-foreground transition"
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  );
}
