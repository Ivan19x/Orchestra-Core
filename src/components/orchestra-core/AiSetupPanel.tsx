import { useState, useEffect, useCallback } from 'react';
import { Brain, Check, Loader2, AlertCircle, Copy, ExternalLink, Smartphone } from 'lucide-react';
import { checkOllama, pullModel, REQUIRED_MODELS, type PullProgress } from '@/lib/ollamaSetup';
import { isMobileApp, isLikelyMobileDevice } from '@/lib/platform';

type Phase = 'idle' | 'checking' | 'unreachable' | 'pulling' | 'ready' | 'error';

const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://orchestra-core.vercel.app';

/**
 * The website's "Set up AI coach" flow. The AI runs locally through Ollama; a
 * web page can't install or launch it, but it can download the required models
 * via Ollama's HTTP API once it's running. Laptops get the smart setup; phones
 * are told to just keep reading (Ollama doesn't run on phones).
 *
 * Calls `onReady(true)` once all required models are present so the parent can
 * enable the chat.
 */
export function AiSetupPanel({ onReady }: { onReady?: (ready: boolean) => void }) {
  const isMobile = isMobileApp || isLikelyMobileDevice();
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<Record<string, PullProgress>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const markReady = useCallback(() => {
    setPhase('ready');
    onReady?.(true);
  }, [onReady]);

  // Silent check on mount (desktop only): if Ollama is already up with every
  // model, enable the chat right away without making the user click Set up.
  useEffect(() => {
    if (isMobile) return;
    let cancelled = false;
    (async () => {
      const status = await checkOllama();
      if (!cancelled && status.reachable && status.missing.length === 0) markReady();
    })();
    return () => { cancelled = true; };
  }, [isMobile, markReady]);

  async function runSetup() {
    setErrorMsg('');
    setPhase('checking');
    const status = await checkOllama();

    if (!status.reachable) { setPhase('unreachable'); return; }
    if (status.missing.length === 0) { markReady(); return; }

    setPhase('pulling');
    try {
      for (const model of status.missing) {
        setProgress((p) => ({ ...p, [model]: { model, status: 'starting…', percent: null } }));
        await pullModel(model, (pr) => setProgress((p) => ({ ...p, [model]: pr })));
        setProgress((p) => ({ ...p, [model]: { model, status: 'done', percent: 100 } }));
      }
      const after = await checkOllama();
      if (after.reachable && after.missing.length === 0) markReady();
      else { setErrorMsg("Some models still aren't showing up — try again."); setPhase('error'); }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'The download failed.');
      setPhase('error');
    }
  }

  // ── Phone/tablet: no setup, just keep reading ──────────────────────────────
  if (isMobile) {
    return (
      <div className="rounded-2xl border border-border bg-blush p-6 flex items-start gap-4">
        <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <h3 className="text-base text-foreground mb-1">The AI coach runs on a computer</h3>
          <p className="text-sm text-warm-muted leading-relaxed">
            Orchestra-Core's AI runs privately on a laptop or desktop for now. On your phone you can read every
            lesson you've unlocked — the AI coach will come to mobile once we host it ourselves. Keep reading.
          </p>
        </div>
      </div>
    );
  }

  // ── Ready: the chat takes over, nothing to show here ───────────────────────
  if (phase === 'ready') return null;

  // ── Downloading models ─────────────────────────────────────────────────────
  if (phase === 'pulling') {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center gap-2 mb-3 text-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <h3 className="text-base">Downloading the AI models…</h3>
        </div>
        <p className="text-xs text-warm-muted mb-5">
          One-time download (a few GB). Keep this tab open — you can read lessons meanwhile. It resumes if interrupted.
        </p>
        <div className="space-y-3">
          {REQUIRED_MODELS.map((m) => {
            const pr = progress[m];
            const pct = pr?.status === 'done' ? 100 : pr?.percent ?? null;
            const label = !pr ? 'queued' : pr.status === 'done' ? 'done' : pct != null ? `${pct}%` : pr.status;
            return (
              <div key={m}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-foreground">{m}</span>
                  <span className="text-warm-muted">{label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-blush overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Ollama not reachable: install + configure instructions ─────────────────
  if (phase === 'unreachable') {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center gap-2 mb-3 text-foreground">
          <AlertCircle className="w-4 h-4 text-primary" />
          <h3 className="text-base">Let's get your AI coach running</h3>
        </div>
        <p className="text-sm text-warm-muted mb-5">
          The AI runs privately on your computer through Ollama. We couldn't reach it — set it up once (works on
          Windows, Mac and Linux), then click Retry.
        </p>
        <ol className="space-y-4 text-sm">
          <li>
            <div className="text-foreground mb-1.5"><span className="text-primary font-medium">1.</span> Install Ollama</div>
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              ollama.com/download <ExternalLink className="w-3 h-3" />
            </a>
          </li>
          <li>
            <div className="text-foreground mb-1.5"><span className="text-primary font-medium">2.</span> Start it so this site can reach it</div>
            <CopyRow text={`OLLAMA_ORIGINS=${SITE_ORIGIN} ollama serve`} />
            <p className="text-[11px] text-faint mt-1.5">
              Windows PowerShell: <code className="text-warm-muted">$env:OLLAMA_ORIGINS="{SITE_ORIGIN}"; ollama serve</code>
            </p>
          </li>
          <li>
            <div className="text-foreground mb-1.5"><span className="text-primary font-medium">3.</span> Optional — pre-download the models in a terminal</div>
            <CopyRow text={'ollama pull qwen2.5:7b\nollama pull nomic-embed-text\nollama pull moondream'} />
          </li>
        </ol>
        <button
          onClick={runSetup}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          <Brain className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // ── Pull failed ────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center gap-2 mb-2 text-foreground">
          <AlertCircle className="w-4 h-4 text-primary" />
          <h3 className="text-base">Setup didn't finish</h3>
        </div>
        <p className="text-sm text-warm-muted mb-2">{errorMsg}</p>
        <p className="text-xs text-faint mb-5">
          If you're low on disk space, free a few GB and try again — the models need room. You can also run the
          <code className="mx-1">ollama pull</code> commands in a terminal.
        </p>
        <button
          onClick={runSetup}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
        >
          <Brain className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  // ── Idle / checking ────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border bg-background p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center text-primary mx-auto mb-4">
        <Brain className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-base text-foreground mb-1">Set up your AI coach</h3>
      <p className="text-sm text-warm-muted mb-5 max-w-sm mx-auto leading-relaxed">
        The AI runs privately on your computer — nothing you ask leaves your device. One-time setup downloads the
        models it needs.
      </p>
      <button
        onClick={runSetup}
        disabled={phase === 'checking'}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition disabled:opacity-60"
      >
        {phase === 'checking'
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
          : <><Brain className="w-4 h-4" /> Set up</>}
      </button>
    </div>
  );
}

function CopyRow({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <pre className="flex-1 text-[11px] bg-blush border border-border rounded-lg px-3 py-2 overflow-x-auto text-foreground whitespace-pre">{text}</pre>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Copy"
        className="shrink-0 inline-flex items-center px-2.5 rounded-lg border border-border text-warm-muted hover:text-foreground hover:border-primary/40 transition"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
