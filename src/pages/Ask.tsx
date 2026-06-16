import { useSearchParams } from 'react-router-dom';
import { AskPanel } from '@/components/orchestra-core/AskPanel';

export default function Ask() {
  const [searchParams] = useSearchParams();
  const initialQuestion = searchParams.get('q') ?? undefined;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">Ask Orchestra-Core (local preview)</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4">Your private AI coach.</h1>
          <p className="text-warm-muted">Running locally via Ollama, grounded in the lesson library — turn on Deep Dive when you want it to read the web too.</p>
        </div>
      </section>

      <section className="container-narrow py-16">
        <AskPanel initialQuestion={initialQuestion} />
      </section>
    </>
  );
}
