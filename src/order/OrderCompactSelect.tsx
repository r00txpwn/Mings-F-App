import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface OrderCompactSelectOption<T extends string> {
  value: T;
  label: string;
}

interface OrderCompactSelectProps<T extends string> {
  value: T;
  options: OrderCompactSelectOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}

export function OrderCompactSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: OrderCompactSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeLabel = options.find((opt) => opt.value === value)?.label ?? options[0]?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="ming-input flex items-center justify-between gap-3 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ming-ash transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-white/10 bg-ming-charcoal p-1 shadow-ming">
          <ul role="listbox" className="max-h-56 overflow-auto">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? 'bg-ming-red/15 text-ming-bone'
                        : 'text-ming-ash hover:bg-white/[0.06] hover:text-ming-bone'
                    }`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
