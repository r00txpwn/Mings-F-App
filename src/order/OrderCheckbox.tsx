import { Check } from 'lucide-react';

interface OrderCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function OrderCheckbox({ checked, onChange, disabled, ariaLabel }: OrderCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-ming-red/30 ${
        checked
          ? 'border-ming-red bg-ming-red text-white'
          : 'border-white/25 bg-ming-ink/70 text-transparent hover:border-white/40'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Check className="h-3 w-3" />
    </button>
  );
}
