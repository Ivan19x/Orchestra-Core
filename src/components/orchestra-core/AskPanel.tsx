import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, AlertCircle, Globe, ExternalLink } from 'lucide-react';
import { askOrchestraCore, type ChatMessage, type RetrievedChunk, type WebSource } from '@/lib/orchestraCore';
import { ThinkingIndicator } from '@/components/orchestra-core/ThinkingIndicator';

interface DisplayMessage extends ChatMessage {
  sources?: RetrievedChunk[];
  webSources?: WebSource[];
}

interface AskPanelProps {
  /** Pre-fill the input (e.g. when arriving from a "Discuss with Orchestra-Core" link). */
  initialQuestion?: string;
  /** Shorter panel for embedding inside the dashboard, with a link out to the full /ask page. */
  compact?: boolean;
  /** False while the model is still being set up — blocks sending with a friendly message instead of a failed request. Defaults to true for callers outside the Electron setup flow (e.g. the website's /ask, /dashboard). */
  ready?: boolean;
}

export function AskPanel({ initialQuestion, compact = false, ready = true }: AskPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState(initialQuestion ?? '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deepDive, setDeepDive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isStreaming || !ready) return;

    setError(null);
    setInput('');
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
    setIsStreaming(true);
    setStatus('Searching the lesson library…');

    try {
      const { lessonSources, webSources } = await askOrchestraCore(
        question,
        history,
        (token) => {
          setStatus(null);
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + token };
            return next;
          });
        },
        { deepDive, onStatus: setStatus },
      );
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], sources: lessonSources, webSources };
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setStatus(null);
    }
  }

  const maxHeight = compact ? 'max-h-[300px]' : 'max-h-[480px]';
  const minHeight = compact ? '' : 'min-h-[480px]';

  return (
    <div className={`rounded-2xl border border-border bg-background p-6 md:p-8 flex flex-col ${minHeight}`}>
      {compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.75} />
            <h3 className="text-base">Ask Orchestra-Core</h3>
          </div>
          <Link to="/ask" className="text-xs text-primary hover:underline">Open full chat</Link>
        </div>
      )}

      <div ref={scrollRef} className={`flex-1 space-y-3 overflow-y-auto ${maxHeight} pr-1`}>
        {messages.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center text-center text-warm-muted ${compact ? 'py-8' : 'py-16'}`}>
            <Sparkles className="w-8 h-8 text-primary mb-3" strokeWidth={1.5} />
            <p>Ask me to explain a lesson further, look something up, or walk you through setting up an account — try "What is Fuliza and is it bad?"</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-blush border border-border text-foreground'
                }`}>
                  {m.content
                    ? m.content
                    : (isStreaming && i === messages.length - 1
                      ? <ThinkingIndicator status={status ?? undefined} />
                      : '')}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.sources.map(({ chunk }) => (
                      <span key={chunk.id} className="text-[10px] uppercase tracking-wider text-faint border border-border rounded-full px-2 py-0.5">
                        {chunk.title} · {chunk.module}
                      </span>
                    ))}
                  </div>
                )}
                {m.webSources && m.webSources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.webSources.map((src) => (
                      <a
                        key={src.url}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary border border-border rounded-full px-2 py-0.5 hover:bg-blush transition"
                      >
                        <Globe className="w-2.5 h-2.5" />
                        {src.title}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-sm text-primary bg-blush border border-border rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Couldn't reach Orchestra-Core.</p>
            <p className="text-warm-muted mt-0.5">{error} Make sure Ollama is running locally with <code>qwen2.5:7b</code> and <code>nomic-embed-text</code> pulled, and that the lesson index exists (<code>npm run rag:build</code>).</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
        <p className="text-xs text-faint">Orchestra-Core is financial education, not financial advice.</p>
        <button
          type="button"
          onClick={() => setDeepDive((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
            deepDive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-blush text-warm-muted border-border hover:border-primary/40'
          }`}
          title="When on, Orchestra-Core can search the web and read pages itself if this question needs current information."
        >
          <Globe className="w-3.5 h-3.5" />
          Deep Dive {deepDive ? 'on' : 'off'}
        </button>
      </div>

      {!ready && (
        <p className="mt-3 text-xs text-primary bg-blush border border-border rounded-lg px-3 py-2">
          Currently setting up the model, kindly wait…
        </p>
      )}

      {ready && (
        <p className="mt-3 text-[11px] text-faint text-center leading-relaxed">
          Heads up — the AI runs locally on your own computer, so replies can be slow. It's still working even when it
          seems quiet; please be patient and give it a moment.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          disabled={isStreaming || !ready}
          placeholder={ready ? 'Ask anything about money…' : 'Setting up the model…'}
          className="flex-1 px-4 py-2.5 rounded-full bg-blush border border-border text-sm focus:outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !ready || !input.trim()}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
