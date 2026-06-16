import { Link } from 'react-router-dom';

export function CTABand({ title = 'Ready to understand your money?', cta = 'Get Orchestra-Core', to = '/pricing' }: { title?: string; cta?: string; to?: string }) {
  return (
    <section className="bg-blush border-y border-border">
      <div className="container-prose py-20 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-8">{title}</h2>
        <Link to={to} className="inline-flex items-center px-7 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
          {cta}
        </Link>
      </div>
    </section>
  );
}
