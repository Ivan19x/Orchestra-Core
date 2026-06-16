import { Orbit } from 'lucide-react';

interface LogoProps {
  className?: string;
  /** Collapse "Orchestra-Core" to an "OC" monogram below 420px (used in the
   * header, where the wordmark shares a row with the CTA + hamburger). */
  collapseOnMobile?: boolean;
}

export function Logo({ className = '', collapseOnMobile = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Orbit className="w-5 h-5 shrink-0 text-primary" strokeWidth={1.75} />
      <span className="font-serif text-2xl leading-none text-foreground">
        {collapseOnMobile && (
          <span className="min-[420px]:hidden">
            O<span className="text-primary">C</span>
          </span>
        )}
        <span className={collapseOnMobile ? 'hidden min-[420px]:inline' : undefined}>
          Orchestra<span className="text-primary">-Core</span>
        </span>
      </span>
    </span>
  );
}
