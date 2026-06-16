interface ThinkingIndicatorProps {
  status?: string;
}

/** Small animated "equalizer" shown while Orchestra-Core is working on a reply. */
export function ThinkingIndicator({ status }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5 text-warm-muted text-sm py-1">
      <div className="oc-thinking" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <span>{status ?? 'Thinking…'}</span>
    </div>
  );
}
