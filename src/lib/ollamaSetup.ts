// Drives a locally-installed Ollama from the browser over its HTTP API.
// A web page can't run `ollama pull` in a terminal, but it CAN ask a running
// Ollama to list and download models — which is what the website's AI setup
// button uses. For this to work against the deployed (HTTPS) site, Ollama must
// be started allowing this origin, e.g.:
//   OLLAMA_ORIGINS=https://orchestra-core.vercel.app ollama serve
// (localhost → localhost is allowed by Ollama's defaults, so local dev works
// without it.)

const OLLAMA_URL = 'http://localhost:11434';

// Same lineup the desktop app pulls (electron/main.cjs REQUIRED_MODELS):
// qwen2.5:7b is the chat model, nomic-embed-text powers RAG retrieval,
// moondream is reserved for a future vision feature.
export const REQUIRED_MODELS = ['qwen2.5:7b', 'nomic-embed-text', 'moondream'];

export interface OllamaStatus {
  reachable: boolean;
  installed: string[];
  missing: string[];
}

function baseName(n: string): string {
  return n.split(':')[0];
}

// Ollama reports models as "qwen2.5:7b", "moondream:latest" etc. Match either
// the exact tag or the base name so "moondream" counts "moondream:latest".
function isInstalled(installed: string[], required: string): boolean {
  const base = baseName(required);
  return installed.some((m) => m === required || baseName(m) === base);
}

export async function checkOllama(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { reachable: false, installed: [], missing: REQUIRED_MODELS };
    const data = await res.json();
    const installed: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    const missing = REQUIRED_MODELS.filter((r) => !isInstalled(installed, r));
    return { reachable: true, installed, missing };
  } catch {
    // Network error / CORS / not running — all mean "can't reach Ollama here".
    return { reachable: false, installed: [], missing: REQUIRED_MODELS };
  }
}

export interface PullProgress {
  model: string;
  status: string;
  percent: number | null;
}

// Streams `ollama pull <model>` via the local HTTP API, reporting per-layer
// progress. Resolves when the model is fully pulled; rejects on error (e.g.
// out of disk space, which Ollama returns as an {error} line).
export async function pullModel(model: string, onProgress: (p: PullProgress) => void): Promise<void> {
  const res = await fetch(`${OLLAMA_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: true }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Couldn't start the download for ${model} (HTTP ${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;

      let obj: { status?: string; error?: string; total?: number; completed?: number };
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      if (obj.error) throw new Error(obj.error);

      const percent = obj.total && obj.completed != null
        ? Math.round((obj.completed / obj.total) * 100)
        : null;
      onProgress({ model, status: obj.status ?? 'downloading', percent });
    }
  }
}
