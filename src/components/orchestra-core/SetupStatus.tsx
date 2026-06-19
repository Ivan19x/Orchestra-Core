import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

type Stage = 'checking' | 'ollama' | 'model' | 'done' | 'error';

interface ProgressEvent {
  stage: Stage;
  message: string;
  percent: number | null;
  model?: string;
  modelIndex?: number;
  modelCount?: number;
}
interface CompleteEvent { model: string }
interface ErrorEvent { message: string; detail?: string }

declare global {
  interface Window {
    electronSetup?: {
      onProgress: (cb: (data: ProgressEvent) => void) => void;
      onComplete: (cb: (data: CompleteEvent) => void) => void;
      onError:    (cb: (data: ErrorEvent) => void) => void;
      notifyReady: () => void;
      retrySetup: () => void;
      onToken: (cb: (token: string) => void) => void;
      onUpdateAvailable?:  (cb: (data: { version: string }) => void) => void;
      onUpdateProgress?:   (cb: (data: { percent: number }) => void) => void;
      onUpdateDownloaded?: (cb: (data: { version: string }) => void) => void;
      installUpdate?: () => void;
    };
  }
}

interface SetupState {
  deviceDone: boolean;
  ollamaDone: boolean;
  modelName: string | null;
  modelIndex: number;
  modelCount: number;
  modelPercent: number | null;
  modelsDone: boolean;
  error: string | null;
  allDone: boolean;
}

const READY: SetupState = {
  deviceDone: true, ollamaDone: true, modelName: null,
  modelIndex: 0, modelCount: 3, modelPercent: null,
  modelsDone: true, error: null, allDone: true,
};

export function SetupStatus({ onTokenReceived, onSetupComplete }: {
  onTokenReceived?: (token: string) => void;
  onSetupComplete?: () => void;
}) {
  const isElectron = typeof window !== 'undefined' && !!window.electronSetup;

  const [state, setState] = useState<SetupState>(
    isElectron ? {
      deviceDone: true, ollamaDone: false, modelName: null,
      modelIndex: 0, modelCount: 3, modelPercent: null,
      modelsDone: false, error: null, allDone: false,
    } : READY
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!window.electronSetup) { onSetupComplete?.(); return; }

    // Signal to main.cjs that the UI is mounted and ready for IPC events
    window.electronSetup.notifyReady();

    window.electronSetup.onProgress((data) => {
      setState(prev => {
        const base = { ...prev, error: null };
        if (data.stage === 'ollama') return base;
        if (data.stage === 'model') {
          return {
            ...base,
            ollamaDone: true,
            modelName: data.model ?? prev.modelName,
            modelIndex: data.modelIndex ?? prev.modelIndex,
            modelCount: data.modelCount ?? prev.modelCount,
            modelPercent: data.percent ?? null,
          };
        }
        return base;
      });
    });

    window.electronSetup.onComplete((data) => {
      setState({ ...READY, modelName: data.model });
      onSetupComplete?.();
      setTimeout(() => setCollapsed(true), 2000);
    });

    window.electronSetup.onError((data) => {
      setState(prev => ({ ...prev, error: data.message }));
    });

    // Handle JWT passed via deep link (orchestracore://auth?token=...)
    window.electronSetup.onToken((token) => {
      onTokenReceived?.(token);
    });
  }, [onTokenReceived, onSetupComplete]);

  if (!isElectron) return null;

  if (collapsed && state.allDone) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center justify-between text-xs text-warm-muted hover:text-foreground transition py-1"
      >
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          AI ready
        </span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.15em] text-faint font-medium">Setup</span>
        {state.allDone && (
          <button onClick={() => setCollapsed(true)} className="text-faint hover:text-foreground transition">
            <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>

      <Step done label="Device scanned" />
      <Step
        done={state.ollamaDone}
        active={!state.ollamaDone && !state.error}
        label="Ollama"
      />
      <Step
        done={state.modelsDone}
        active={state.ollamaDone && !state.modelsDone && !state.error}
        label={state.modelName ? `Downloading models (${state.modelIndex + 1} of ${state.modelCount})` : 'Downloading models'}
        sub={
          state.modelName && !state.modelsDone ? (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-warm-muted truncate max-w-[110px]">{state.modelName}</span>
                <span className="text-[10px] text-faint shrink-0 ml-1">{state.modelPercent ?? 0}%</span>
              </div>
              <div className="w-full bg-divider rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${state.modelPercent ?? 0}%` }}
                />
              </div>
            </div>
          ) : null
        }
      />

      {state.error && (
        <div className="mt-1 p-2.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
          <div className="flex gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-700 leading-relaxed">{state.error}</p>
          </div>
          <div className="flex items-center gap-3 pl-5">
            <button
              onClick={() => {
                setState(prev => ({ ...prev, error: null, ollamaDone: false, modelsDone: false }));
                window.electronSetup?.retrySetup();
              }}
              className="inline-flex items-center gap-1 text-[10px] text-red-700 hover:text-red-900 font-medium transition"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-red-600 hover:underline"
            >
              Get Ollama →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({
  done, active = false, label, sub,
}: {
  done: boolean; active?: boolean; label: string; sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">
        {done
          ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          : active
            ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            : <Circle className="w-3.5 h-3.5 text-border" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-xs leading-tight ${done ? 'text-foreground' : active ? 'text-foreground' : 'text-faint'}`}>
          {label}
        </span>
        {sub}
      </div>
    </div>
  );
}
