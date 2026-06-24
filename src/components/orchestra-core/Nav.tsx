import { NavLink, Link } from 'react-router-dom';
import { Menu, X, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useSession } from '@/lib/session';

const links = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/support', label: 'Support' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const session = useSession();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container-prose flex items-center justify-between h-16">
        <Link to="/"><Logo collapseOnMobile /></Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `text-sm transition ${isActive ? 'text-primary border-b border-primary pb-0.5' : 'text-warm-muted hover:text-foreground'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link to="/account"
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-foreground transition">
              <UserCircle className="w-4 h-4" />
              Account
            </Link>
          ) : (
            <Link to="/login"
              className="hidden md:inline-flex text-sm text-warm-muted hover:text-foreground transition">
              Sign in
            </Link>
          )}
          {session?.paid ? (
            <Link to="/dashboard"
              className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              Open dashboard
            </Link>
          ) : (
            <Link to="/checkout"
              className="inline-flex items-center px-4 sm:px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm hover:opacity-90 transition">
              <span className="sm:hidden">Get app</span>
              <span className="hidden sm:inline">Get Orchestra-Core</span>
            </Link>
          )}
          <button className="md:hidden p-2 text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-prose py-4 flex flex-col gap-3">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `text-sm py-1 ${isActive ? 'text-primary' : 'text-warm-muted'}`}>
                {l.label}
              </NavLink>
            ))}
            {session ? (
              <Link to="/account" onClick={() => setOpen(false)} className="text-sm py-1 text-warm-muted flex items-center gap-1.5">
                <UserCircle className="w-4 h-4" /> Account
              </Link>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm py-1 text-warm-muted">Sign in</Link>
            )}
            {session?.paid ? (
              <Link to="/dashboard" onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm">
                Open dashboard
              </Link>
            ) : (
              <Link to="/checkout" onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm">
                Get Orchestra-Core
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
