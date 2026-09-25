// The status pill, shared by the learner, teacher and admin views so they can
// never disagree about what a booking state means. The timing rules that decide
// which actions are still allowed live in @/lib/sessionTime.

const LABELS: Record<string, { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'muted' },
  confirmed:       { label: 'Confirmed',         tone: 'ok' },
  completed:       { label: 'Completed',         tone: 'ok' },
  cancelled:       { label: 'Cancelled',         tone: 'muted' },
  no_show_teacher: { label: 'Consultant missed', tone: 'bad' },
  no_show_learner: { label: 'Missed',            tone: 'warn' },
  disputed:        { label: 'Under review',      tone: 'warn' },
  failed:          { label: 'Payment failed',    tone: 'bad' },
};

// Semantic colour, deliberately separate from the brand maroon so state reads
// at a glance instead of blending into the accent.
const TONES = {
  ok:    'text-[hsl(152_40%_32%)] border-[hsl(152_40%_32%)]/30 bg-[hsl(152_40%_32%)]/10',
  warn:  'text-[hsl(32_70%_34%)] border-[hsl(32_70%_34%)]/30 bg-[hsl(32_70%_34%)]/10',
  bad:   'text-[hsl(0_60%_42%)] border-[hsl(0_60%_42%)]/30 bg-[hsl(0_60%_42%)]/10',
  muted: 'text-faint border-border bg-transparent',
};

export function SessionStatusPill({ status }: { status: string }) {
  const meta = LABELS[status] ?? { label: status, tone: 'muted' as const };
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wider rounded-full border px-2 py-1 ${TONES[meta.tone]}`}>
      {meta.label}
    </span>
  );
}
