import { useEffect, useState } from 'react';
import { Download as DownloadIcon, ChevronDown, Cpu, ShieldCheck, Loader2, Clock } from 'lucide-react';
import { scanDevice, type DeviceSignal } from '@/lib/deviceScan';
import { modelTiers, defaultTier, npuNote, type DeviceTier } from '@/lib/modelTiers';

function getDownloadUrl(): string | null {
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
  if (isMac) return import.meta.env.VITE_DOWNLOAD_URL_MAC || null;
  return import.meta.env.VITE_DOWNLOAD_URL_WIN || null;
}

export function DeviceScanPanel() {
  const [scanning, setScanning] = useState(true);
  const [signals, setSignals] = useState<DeviceSignal[]>([]);
  const [tier, setTier] = useState<DeviceTier>(defaultTier);
  const [showSignals, setShowSignals] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const downloadUrl = getDownloadUrl();

  useEffect(() => {
    let cancelled = false;
    scanDevice().then((result) => {
      if (cancelled) return;
      setSignals(result.signals);
      setTier(result.recommendedTier);
      setScanning(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      {/* Recommendation */}
      <div className="p-8 rounded-2xl border border-border bg-background">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blush flex items-center justify-center text-primary">
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.75} /> : <Cpu className="w-5 h-5" strokeWidth={1.75} />}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-faint">
              {scanning ? 'Scanning your device…' : 'Based on your device'}
            </div>
            <div className="text-foreground">
              Recommended: <strong className="text-primary font-medium">Orchestra-Core {tier.name}</strong> · {tier.size}
            </div>
          </div>
        </div>
        <p className="text-sm text-warm-muted mb-6">{tier.for}</p>

        {downloadUrl ? (
          <a href={downloadUrl} download
            className="w-full inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
            <DownloadIcon className="w-4 h-4" /> Download Orchestra-Core {tier.name}
          </a>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-border text-warm-muted text-sm">
            <Clock className="w-4 h-4" /> Download coming soon — sign up for early access
          </div>
        )}

        <div className="mt-3 text-xs text-warm-muted">
          Includes the Orchestra-Core app and the {tier.primary.model} model via {tier.primary.runtime} ({tier.primary.license ?? 'open-source'}).
        </div>

        <button onClick={() => setShowVersions(!showVersions)} className="mt-4 text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
          Choose a different version <ChevronDown className={`w-4 h-4 transition ${showVersions ? 'rotate-180' : ''}`} />
        </button>

        {showVersions && (
          <div className="mt-6 border-t border-border pt-6 space-y-3">
            {modelTiers.map((t) => (
              <div key={t.id}>
                <button
                  onClick={() => {
                    setTier(t);
                    setExpandedTier(expandedTier === t.id ? null : t.id);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition ${tier.id === t.id ? 'border-primary bg-blush' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex justify-between items-baseline">
                    <strong className="text-foreground font-medium">Orchestra-Core {t.name}</strong>
                    <span className="text-xs text-warm-muted">{t.size}</span>
                  </div>
                  <div className="text-sm text-warm-muted mt-1">{t.ramRange} — {t.for}</div>
                </button>

                {expandedTier === t.id && (
                  <div className="mt-2 ml-4 pl-4 border-l border-border space-y-2">
                    <div className="text-xs uppercase tracking-wider text-faint pt-2">Default setup</div>
                    <RuntimeRow option={t.primary} />
                    {t.alternatives.length > 0 && (
                      <>
                        <div className="text-xs uppercase tracking-wider text-faint pt-2">Other ways to run a similar model</div>
                        {t.alternatives.map((alt, i) => <RuntimeRow key={i} option={alt} />)}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-warm-muted pt-2">{npuNote}</p>
          </div>
        )}
      </div>

      {/* Transparency: what we checked */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-blush">
        <button onClick={() => setShowSignals(!showSignals)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={1.75} />
            <h3 className="text-base">What Orchestra-Core checked on your device, and why</h3>
          </div>
          <ChevronDown className={`w-4 h-4 text-primary transition shrink-0 ${showSignals ? 'rotate-180' : ''}`} />
        </button>

        <p className="text-sm text-warm-muted mt-3 leading-relaxed">
          This scan runs entirely in your browser, using standard web features. Orchestra-Core has no server —
          nothing about your device is sent anywhere. The results below are used only to suggest which model to
          download, and you can always pick a different one yourself.
        </p>

        {showSignals && (
          <div className="mt-5 space-y-3">
            {signals.map((s) => (
              <div key={s.key} className="p-4 rounded-lg border border-border bg-background">
                <div className="flex justify-between items-baseline gap-4">
                  <strong className="text-foreground font-medium text-sm">{s.label}</strong>
                  <span className={`text-sm shrink-0 ${s.detected ? 'text-primary' : 'text-faint'}`}>{scanning ? '…' : s.value}</span>
                </div>
                <p className="text-xs text-warm-muted mt-1">{s.why}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RuntimeRow({ option }: { option: { runtime: string; model: string; install: string; license?: string } }) {
  return (
    <div className="py-2">
      <div className="text-sm text-foreground">
        <strong className="font-medium">{option.runtime}</strong> — {option.model}
        {option.license && <span className="text-warm-muted"> · {option.license}</span>}
      </div>
      <div className="text-xs text-warm-muted mt-0.5">{option.install}</div>
    </div>
  );
}
