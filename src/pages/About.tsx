import { CTABand } from '@/components/orchestra-core/CTABand';

// Deliberately one statement and nothing else. The page makes its point by
// refusing to pad it — so resist adding paragraphs around it later.
export default function About() {
  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">About</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Why Orchestra-Core exists.</h1>
        </div>
      </section>

      <section className="container-narrow py-24 md:py-32">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-6 text-center">
            What I'm trying to prove
          </div>
          <p className="font-serif text-2xl md:text-3xl text-foreground leading-snug text-center">
            There is always a path forward. Money is the tool every one of them runs on — so understanding
            it isn't a separate career you choose, it's underneath the life you already have.
          </p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
