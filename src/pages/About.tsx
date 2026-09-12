import { CTABand } from '@/components/orchestra-core/CTABand';
import { getAllLessons } from '@/lib/lessons';

export default function About() {
  const seriesCount = new Set(getAllLessons().map(l => l.series)).size;

  return (
    <>
      <section className="bg-blush border-b border-border">
        <div className="container-narrow py-20 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-primary mb-4">About</div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground">Why Orchestra-Core exists.</h1>
        </div>
      </section>

      <section className="container-narrow py-16">
        <div className="space-y-6 text-foreground leading-relaxed">
          <p className="text-warm-muted">
            People are told to pick a lane — school, or a job, or a business — as though the others don't
            count. And money gets filed under the things you'll figure out later, once you've picked the
            right one. I kept seeing that, including in my own life.
          </p>

          <p className="text-warm-muted">
            I don't think it's true. You can be studying, employed, running something on the side, or all
            three at once, and still deserve to understand your money properly now — not later, once some
            other part of your life is settled. Nobody is taught this in school, which is almost everybody,
            and then we're expected to make real decisions about salaries, loans and savings anyway.
          </p>

          <p className="text-warm-muted">
            So I built the thing I wished existed.
          </p>

          <div className="my-12 p-8 rounded-2xl bg-blush border border-border">
            <div className="text-xs uppercase tracking-[0.18em] text-primary mb-3">What I'm trying to prove</div>
            <p className="font-serif text-2xl text-foreground leading-snug">
              There is always a path forward. Money is the tool every one of them runs on — so understanding
              it isn't a separate career you choose, it's underneath the life you already have.
            </p>
          </div>

          <p className="text-warm-muted">
            What that turned into is a written curriculum: {seriesCount} series that build on each other from
            the first lesson, taught through the money Kenyans actually handle — M-Pesa, SACCOs, mobile
            loans, the NSE, chamas, school fees that arrive in termly lumps — before widening out to the
            principles that hold anywhere. The figures are researched against the institutions that publish
            them: the Central Bank of Kenya, KRA, SASRA, the NSE. That's deliberate. The credibility should
            sit in the accuracy of the material, not in me.
          </p>

          <p className="text-warm-muted">
            I'm young, and I'd rather say so than have you find out. It's also why the whole thing is built
            on sourcing and verification rather than on my own track record — you aren't being asked to trust
            my opinion about money, only that I did the work to get the facts right. And it's education, not
            advice: explaining how a SACCO pays dividends or how Fuliza's cost actually works is a different
            thing from telling you what to do with your money, and I don't do the second one.
          </p>

          <p className="text-warm-muted">
            You pay once and you own it forever. That's a choice, not a pricing accident — the value is
            handed over completely, upfront, and nothing more is asked of you afterwards. The first lesson of
            every series is free to read before you pay, so the decision is yours to make with the actual
            writing in front of you rather than a promise about it.
          </p>

          <p className="text-warm-muted">
            It's web-first, and the written curriculum is the entire focus for now. Finishing that properly
            matters more to me than adding features before they're ready to be good. Kenya first because
            that's home; anywhere else comes later, and only with lessons that genuinely fit it rather than a
            translation of these.
          </p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
