import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X, ChevronUp } from 'lucide-react';
import { PERSONAS, currentPersona, setPersona, type PersonaId } from '@/lib/demoData';

// Only rendered in the demo build. Lets you switch who you are signed in as,
// so every screen can be seen without a backend.
//
// It is deliberately unmistakable — a demo must never be mistaken for the live
// site by someone you are showing it to.
export function DemoBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<PersonaId>(currentPersona().id);

  // Keep the pill in step if a page changes the session itself, e.g. the demo
  // checkout flipping a free account to paid.
  useEffect(() => {
    const sync = () => setActive(currentPersona().id);
    window.addEventListener('oc_session_change', sync);
    return () => window.removeEventListener('oc_session_change', sync);
  }, []);

  function choose(id: PersonaId) {
    setPersona(id);
    setActive(id);
    // Land somewhere that shows what this persona is for.
    const home: Record<PersonaId, string> = {
      visitor: '/',
      free: '/dashboard',
      paid: '/dashboard',
      teacher: '/teach/dashboard',
      admin: '/admin',
    };
    navigate(home[id]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[100] inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background text-sm shadow-lg"
      >
        <Users className="w-4 h-4" /> Demo
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  const persona = PERSONAS.find(p => p.id === active) ?? PERSONAS[0];

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t-2 border-foreground bg-background/98 backdrop-blur shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.4)]">
      <div className="container-prose py-3">
        <div className="flex items-start justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] font-semibold bg-foreground text-background rounded px-1.5 py-0.5">
              Demo
            </span>
            <p className="text-xs text-warm-muted truncate">
              No backend — nothing here is real. {persona.blurb}
            </p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Hide the demo bar"
            className="shrink-0 text-warm-muted hover:text-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
                active === p.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-warm-muted hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
