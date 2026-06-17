import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

type Stage = 'checking' | 'ollama' | 'model' | 'done' | 'error';

interface ProgressEvent { stage: Stage; message: string; percent: number | null }
interface CompleteEvent { model: string }
interface ErrorEvent   { message: string; detail?: string }

// window.electronSetup is declared globally in components/orchestra-core/SetupStatus.tsx

const STEPS: { id: Stage; label: string }[] = [
  { id: 'checking', label: 'Checking your device' },
  { id: 'ollama',   label: 'Setting up Ollama' },
  { id: 'model',    label: 'Downloading AI model' },
  { id: 'done',     label: 'Ready' },
];

export default function Setup() {
  const navigate = useNavigate();
  const [stage, setStage]     = useState<Stage>('checking');
  const [message, setMessage] = useState('Starting up…');
  const [percent, setPercent] = useState<number | null>(null);
  const [model, setModel]     = useState('');
  const [error, setError]     = useState<ErrorEvent | null>(null);

  useEffect(() => {
    // Not in Electron — go to dashboard
    if (!window.electronSetup) { navigate('/dashboard', { replace: true }); return; }

    window.electronSetup.onProgress((data) => {
      setStage(data.stage);
      setMessage(data.message);
      setPercent(data.percent ?? null);
    });

    window.electronSetup.onComplete((data) => {
      setModel(data.model);
      setStage('done');
      setMessage('Your AI coach is ready.');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1800);
    });

    window.electronSetup.onError((data) => {
      setStage('error');
      setError(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIdx = STEPS.findIndex(s => s.id === stage);

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-2">Orchestra-Core</div>
          <h1 className="font-serif text-3xl text-foreground">Setting up your AI coach</h1>
          <p className="text-sm text-warm-muted mt-2">This only happens once. Leave this open.</p>
        </div>

        {/* Steps */}
        <div className="bg-background rounded-2xl border border-border shadow-sm p-8 space-y-5">
          {STEPS.map((step, i) => {
            const isDone    = stage === 'done' ? true : i < currentIdx;
            const isActive  = step.id === stage && stage !== 'done' && stage !== 'error';
            const isPending = !isDone && !isActive;

            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-border" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isPending ? 'text-faint' : 'text-foreground'}`}>
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-warm-muted">{message}</p>
                      {percent !== null && (
                        <div className="w-full bg-blush rounded-full h-1.5 overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {isDone && step.id === 'done' && model && (
                    <p className="text-xs text-warm-muted mt-0.5">Using {model}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Error state */}
          {stage === 'error' && error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error.message}</p>
                  {error.detail && (
                    <p className="text-xs text-red-500 mt-1 font-mono">{error.detail}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-faint text-center mt-6">
          The AI model runs entirely on your computer — nothing is sent to the internet after setup.
        </p>
      </div>
    </div>
  );
}
