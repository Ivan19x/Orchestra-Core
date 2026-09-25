import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="container-prose py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-warm-muted max-w-xs">
            Clear, practical financial education — built for Kenya, built for clarity, not hype.
          </p>
        </div>

        <FooterCol title="Learn" links={[
          ['How it works', '/how-it-works'],
          ['Lessons', '/lessons'],
          ['Consultants', '/consultants'],
          ['Pricing', '/pricing'],
          ['Questions', '/faq'],
          ['About', '/about'],
        ]} />
        <FooterCol title="More" links={[
          ['Teach with us', '/teach'],
          ['Contact', '/contact'],
        ]} />
        <FooterCol title="Legal" links={[
          ['Terms of Service', '/terms'],
          ['Privacy Policy', '/privacy'],
        ]} />
      </div>

      <div className="border-t border-border">
        <div className="container-prose py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-faint">
          <span>© {new Date().getFullYear()} Orchestra-Core · Built in Nairobi, Kenya.</span>
          <span className="max-w-xl md:text-right">
            Orchestra-Core provides general financial education only — not personalized financial, investment, legal,
            or tax advice. Nothing here is a recommendation to buy or sell any asset.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-faint mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-warm-muted hover:text-primary transition">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
