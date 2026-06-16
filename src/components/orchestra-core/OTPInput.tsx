import { useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function set(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d));
    onChange(next.join(''));
    if (char && index < 5) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      set(index - 1, '');
      refs.current[index - 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const nextEmpty = Math.min(pasted.length, 5);
    refs.current[nextEmpty]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => set(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={e => e.target.select()}
          className="w-11 h-13 text-center text-xl font-medium border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:opacity-50"
          style={{ height: '3.25rem' }}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
